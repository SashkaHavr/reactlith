import path from 'path';
import type { PackageJson } from 'type-fest';
import fs from 'fs-extra';

import type {
  AppType,
  PackageType,
  ToolType,
  WorkspacePackageType,
} from './consts';
import {
  CWD,
  workspacePackageTypes,
  workspacePackageTypeToDir,
} from './consts';
import { CliError } from './error';
import { format } from './format';
import { getPackageJson } from './package-json';

export interface Workspace {
  packageJson: PackageJson & { name: string };
  workspaceRoot: string;
  packages: WorkspacePackageInfo[];
}

export async function getWorkspace() {
  return await getWorkspaceFromPath(CWD);
}

export async function getWorkspaceFromPathDefined(dir: string) {
  const newWorkspace = await getWorkspaceFromPath(dir);
  if (!newWorkspace) {
    throw new CliError({
      message: `Failed to find workspace at ${format.path(dir)}`,
    });
  }
  return newWorkspace;
}

export async function getWorkspaceFromPath(dir: string) {
  const currentDir = path.resolve(dir);
  const packageJson = await getPackageJson(currentDir);
  if (
    packageJson &&
    packageJson.devDependencies &&
    'turbo' in packageJson.devDependencies
  ) {
    return getWorkspaceInternal(currentDir, packageJson);
  }
  const nextDir = path.resolve(dir, '..');
  if (nextDir == dir) return;
  return getWorkspaceFromPath(nextDir);
}

async function getWorkspaceInternal(
  workspaceRoot: string,
  packageJson: PackageJson,
) {
  if (
    !packageJson.devDependencies ||
    !('turbo' in packageJson.devDependencies) ||
    !packageJson.name
  ) {
    throw new CliError({ message: 'Not a Reactlith workspace' });
  }

  return {
    packageJson: packageJson as PackageJson & { name: string },
    workspaceRoot: workspaceRoot,
    packages: await getPackages(workspaceRoot),
  };
}

async function getPackages(workspaceRoot: string) {
  const packages = await Promise.all(
    workspacePackageTypes.map(async (packageType) => {
      const packageTypeDir = path.join(
        workspaceRoot,
        workspacePackageTypeToDir[packageType],
      );
      if (await fs.exists(packageTypeDir)) {
        const dirEntries = await fs.readdir(packageTypeDir);
        return await Promise.all(
          dirEntries.map(async (entry) => {
            return await getPackageInternal(
              path.join(packageTypeDir, entry),
              packageType,
            );
          }),
        );
      }
    }),
  );
  const filteredPackages = packages
    .flat()
    .filter((pkg): pkg is WorkspacePackageInfo => pkg != undefined);
  return filteredPackages;
}

interface BaseWorkspacePackageInfo {
  packageJson: PackageJson & { name: string };
  packageRoot: string;
}

interface PackageInfo extends BaseWorkspacePackageInfo {
  type: 'package';
  packageType: PackageType;
}
interface AppInfo extends BaseWorkspacePackageInfo {
  type: 'app';
  appType: AppType;
}

interface ToolInfo extends BaseWorkspacePackageInfo {
  type: 'tool';
  toolType: ToolType;
}

export type WorkspacePackageInfo = PackageInfo | AppInfo | ToolInfo;

export async function getPackage(
  packageRoot: string,
): Promise<WorkspacePackageInfo | undefined> {
  const pathSegments = packageRoot.split(path.sep);
  const parentDirName =
    pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2] : '';
  const type = workspacePackageTypes.find(
    (key) => workspacePackageTypeToDir[key] == parentDirName,
  );
  if (!type) return;

  return getPackageInternal(packageRoot, type);
}

async function getPackageInternal(
  packagePath: string,
  packageType: WorkspacePackageType,
): Promise<WorkspacePackageInfo | undefined> {
  const packageJson = await getPackageJson(packagePath);
  if (
    !packageJson ||
    (packageJson.devDependencies && 'turbo' in packageJson.devDependencies) ||
    packageJson.name == undefined
  ) {
    return;
  }

  const baseInfo: BaseWorkspacePackageInfo = {
    packageJson: packageJson as PackageJson & { name: string },
    packageRoot: packagePath,
  };

  switch (packageType) {
    case 'app': {
      return {
        ...baseInfo,
        type: 'app',
        appType: getAppType(packageJson),
      };
    }
    case 'package': {
      return {
        ...baseInfo,
        type: 'package',
        packageType: await getPackageType(baseInfo),
      };
    }
    case 'tool': {
      return {
        ...baseInfo,
        type: 'tool',
        toolType: await getToolType(baseInfo),
      };
    }
  }
}

async function getPackageType(
  baseInfo: BaseWorkspacePackageInfo,
): Promise<PackageType> {
  const { packageJson, packageRoot } = baseInfo;
  if (packageJson.dependencies) {
    if (
      'better-auth' in packageJson.dependencies &&
      packageJson.scripts &&
      'generate-db-schema' in packageJson.scripts
    ) {
      return 'auth';
    }
    if (
      'pg' in packageJson.dependencies &&
      'drizzle-orm' in packageJson.dependencies
    ) {
      return 'db';
    }
    if ('@trpc/server' in packageJson.dependencies) {
      return 'trpc';
    }
    if (
      'use-intl' in packageJson.dependencies &&
      (await fs.exists(path.join(packageRoot, 'messages')))
    ) {
      return 'intl';
    }
    if ('@t3-oss/env-core' in packageJson.dependencies) {
      return 'env';
    }
  }

  return 'base';
}

async function getToolType(
  baseInfo: BaseWorkspacePackageInfo,
): Promise<ToolType> {
  const { packageJson, packageRoot } = baseInfo;
  if (packageJson.devDependencies) {
    if ('eslint' in packageJson.devDependencies) {
      return 'eslint-config';
    }
    if ('prettier' in packageJson.devDependencies) {
      return 'prettier-config';
    }
  }
  if (
    !packageJson.dependencies &&
    !packageJson.devDependencies &&
    (await fs.exists(path.join(packageRoot, 'tsconfig.json')))
  ) {
    return 'typescript-config';
  }

  return 'base';
}

function getAppType(packageJson: PackageJson): AppType {
  if (packageJson.dependencies) {
    if (
      'react' in packageJson.dependencies &&
      'react-dom' in packageJson.dependencies
    ) {
      return 'web';
    }
    if ('hono' in packageJson.dependencies) {
      return 'api';
    }
  }

  return 'base';
}
