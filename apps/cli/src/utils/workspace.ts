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
import { getPackageJson } from './getPackageJson';

interface Workspace {
  packageJson: PackageJson;
  workspaceRoot: string;
  packages: WorkspacePackageInfo[];
}

export async function getWorkspace(): Promise<Workspace | undefined> {
  const cwd = CWD;
  const workspace = await getWorkspaceRecursive(cwd);
  return workspace;
}

async function getWorkspaceRecursive(dir: string) {
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
  return getWorkspaceRecursive(nextDir);
}

async function getWorkspaceInternal(
  workspaceRoot: string,
  packageJson: PackageJson,
) {
  if (
    !packageJson.devDependencies ||
    !('turbo' in packageJson.devDependencies)
  ) {
    throw new CliError({ message: 'Not a Reactlith workspace' });
  }

  return {
    packageJson: packageJson,
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
        for (const entry of dirEntries) {
          return await getPackageInternal(
            path.join(packageTypeDir, entry),
            packageType,
          );
        }
      }
    }),
  );
  const filteredPackages = packages.filter(
    (pkg): pkg is WorkspacePackageInfo => pkg !== undefined,
  );
  return filteredPackages;
}

interface BaseWorkspacePackageInfo {
  packageJson: PackageJson;
  packageRoot: string;
  type: WorkspacePackageType;
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

type WorkspacePackageInfo = PackageInfo | AppInfo | ToolInfo;

export async function getPackage(
  packageRoot: string,
): Promise<WorkspacePackageInfo | undefined> {
  const pathSegments = packageRoot.split(path.sep);
  const parentDirName =
    pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2] : '';
  const type = workspacePackageTypes.find(
    (key) => workspacePackageTypeToDir[key] === parentDirName,
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
    packageJson.name === undefined
  ) {
    return;
  }

  const baseInfo: BaseWorkspacePackageInfo = {
    packageJson: packageJson,
    packageRoot: packagePath,
    type: packageType,
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
      return 'locale';
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
      return 'eslint';
    }
    if ('prettier' in packageJson.devDependencies) {
      return 'prettier';
    }
  }
  if (
    !packageJson.dependencies &&
    !packageJson.devDependencies &&
    (await fs.exists(path.join(packageRoot, 'tsconfig.json')))
  ) {
    return 'tsconfig';
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
