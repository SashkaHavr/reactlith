import path from 'path';
import fs from 'fs-extra';

import type {
  AppType,
  PackageType,
  ToolType,
  WorkspacePackageType,
} from './consts';
import type { Workspace } from './workspace';
import {
  TEMPLATE_NAME,
  TEMPLATE_PACKAGE_NAME,
  workspacePackageTypeToDir,
} from './consts';
import { CliError } from './error';
import { includePackageByTypeInteractive } from './include-package';
import {
  addDefaultPackageJsonConfig,
  addDevDependency,
  addExports,
  addImports,
  addScript,
  copyPackageJsonInfo,
  getPackageJson,
  savePackageJson,
} from './package-json';
import {
  addEmptyIndexTs,
  copyTemplate,
  replaceInFileRecursive,
} from './templates';
import {
  addTsConfigPath,
  getTsConfigJson,
  saveTsConfigJson,
  targetDom,
} from './tsconfig-json';
import { getPackage, getWorkspaceFromPathDefined } from './workspace';

export async function addPackage(config: {
  workspace: Workspace;
  workspacePackageType: WorkspacePackageType;
  packageName: string;
  type: AppType | PackageType | ToolType;
}) {
  const packagePath = path.join(
    config.workspace.workspaceRoot,
    workspacePackageTypeToDir[config.workspacePackageType],
    config.packageName,
  );

  if (
    (await fs.exists(packagePath)) &&
    (await fs.readdir(packagePath)).length > 0
  ) {
    throw new CliError({
      message: `Package ${config.packageName} already exists at ${packagePath}.`,
    });
  }

  const initialPackageJson = await getPackageJson(packagePath);
  addDefaultPackageJsonConfig(
    initialPackageJson,
    `@${config.workspace.packageJson.name}/${config.packageName}`,
  );
  await savePackageJson(packagePath, initialPackageJson);

  const currentPackage = await getPackage(packagePath);
  if (!currentPackage) {
    throw new CliError({
      message: `Failed to create package at ${packagePath}.`,
    });
  }

  const currentPackageJson = await getPackageJson(packagePath);
  const currentTsConfigJson = await getTsConfigJson(packagePath);

  switch (config.workspacePackageType) {
    case 'app':
      addTsConfigPath(currentTsConfigJson);
      addDevDependency(currentPackageJson, '@types/bun', 'catalog:');
      switch (config.type) {
        case 'base':
          break;
        case 'web':
          await copyTemplate('app-web', packagePath);
          targetDom(currentTsConfigJson);
          break;
        case 'api':
          // TODO: handle api app
          break;
      }
      break;
    case 'package':
      addImports(currentPackageJson);
      addDevDependency(currentPackageJson, '@types/bun', 'catalog:');
      switch (config.type) {
        case 'base':
          addExports(currentPackageJson, '.', './src/index.ts');
          break;
        case 'auth':
          await copyTemplate('package-auth', packagePath);
          break;
        case 'db':
          await copyTemplate('package-db', packagePath);
          break;
        case 'trpc':
          await copyTemplate('package-trpc', packagePath);
          break;
        case 'intl':
          await copyTemplate('package-intl', packagePath);
          break;
        case 'env':
          await copyTemplate('package-env', packagePath);
          break;
      }
      break;
    case 'tool':
      addDevDependency(currentPackageJson, '@types/node', 'catalog:');
      switch (config.type) {
        case 'base':
          addExports(currentPackageJson, '.', './index.ts');
          break;
        case 'typescript-config':
          await copyTemplate('tool-typescript-config', packagePath);
          currentPackageJson.devDependencies = undefined;
          currentPackageJson.scripts = undefined;
          break;
        case 'prettier-config':
          await copyTemplate('tool-prettier-config', packagePath);
          addScript(currentPackageJson, 'format');
          addScript(currentPackageJson, 'format:check');
          break;
        case 'eslint-config':
          await copyTemplate('tool-eslint-config', packagePath);
          break;
      }
      break;
  }

  copyPackageJsonInfo(currentPackageJson, await getPackageJson(packagePath));

  await savePackageJson(packagePath, currentPackageJson);
  if (config.type != 'typescript-config') {
    await saveTsConfigJson(packagePath, currentTsConfigJson);
  }

  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    packagePath,
    config.packageName,
  );

  await includeDependenciesAfterAdd(packagePath, config);

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    packagePath,
    config.workspace.packageJson.name,
  );
}

async function includeDependenciesAfterAdd(
  packagePath: string,
  config: {
    workspacePackageType: WorkspacePackageType;
    type: AppType | PackageType | ToolType;
  },
) {
  const workspace = await getWorkspaceFromPathDefined(packagePath);
  const currentPackage = await getPackage(packagePath);

  if (!currentPackage) {
    throw new CliError({
      message: `Failed to get package at ${packagePath}.`,
    });
  }

  const includePackage = (pkg: AppType | PackageType | ToolType) =>
    includePackageByTypeInteractive(workspace, currentPackage, pkg);

  if (config.type != 'typescript-config') {
    await includePackage('typescript-config');
  }

  if (config.type != 'typescript-config' && config.type != 'prettier-config') {
    await includePackage('prettier-config');
  }
  if (config.workspacePackageType != 'tool') {
    await includePackage('eslint-config');
  }

  if (config.type == 'base') {
    await addEmptyIndexTs(packagePath, config.workspacePackageType != 'tool');
  }

  switch (config.workspacePackageType) {
    case 'app':
      switch (config.type) {
        case 'web':
          await includePackage('trpc');
          await includePackage('auth');
          await includePackage('intl');
          break;
      }
      break;
    case 'package':
      switch (config.type) {
        case 'auth':
          await includePackage('db');
          await includePackage('env');
          break;
        case 'db':
          await includePackage('env');
          break;
        case 'trpc':
          await includePackage('db');
          await includePackage('env');
          await includePackage('auth');
          break;
      }
  }
}
