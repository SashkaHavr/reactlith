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
} from './tsconfig-json';
import { getPackage } from './workspace';

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

  if (config.type != 'typescript-config') {
    await includePackageByTypeInteractive(
      config.workspace,
      currentPackage,
      'typescript-config',
    );
  }

  if (config.type != 'typescript-config' && config.type != 'prettier-config') {
    await includePackageByTypeInteractive(
      config.workspace,
      currentPackage,
      'prettier-config',
    );
  }
  if (config.workspacePackageType != 'tool') {
    await includePackageByTypeInteractive(
      config.workspace,
      currentPackage,
      'eslint-config',
    );
  }

  if (config.type == 'base') {
    await addEmptyIndexTs(packagePath, config.workspacePackageType != 'tool');
  }

  const currentPackageJson = await getPackageJson(packagePath);
  const currentTsConfigJson = await getTsConfigJson(packagePath);

  switch (config.workspacePackageType) {
    case 'app':
      switch (config.type) {
        case 'base':
          addTsConfigPath(currentTsConfigJson);
          break;
        case 'web':
          // TODO: handle web app
          break;
        case 'api':
          // TODO: handle api app
          break;
      }
      break;
    case 'package':
      switch (config.type) {
        case 'base':
          addExports(currentPackageJson, '.', './src/index.ts');
          addImports(currentPackageJson);
          break;
        case 'auth':
          // TODO: handle auth package
          break;
        case 'db':
          // TODO: handle db package
          break;
        case 'trpc':
          // TODO: handle trpc package
          break;
        case 'intl':
          // TODO: handle i18n package
          break;
        case 'env':
          // TODO: handle env package
          break;
      }
      break;
    case 'tool':
      switch (config.type) {
        case 'base':
          addExports(currentPackageJson, '.', './index.ts');
          break;
        case 'typescript-config':
          await copyTemplate('tool-typescript-config', packagePath);
          addExports(currentPackageJson, '.', './tsconfig.json');
          currentPackageJson.devDependencies = undefined;
          currentPackageJson.scripts = undefined;
          break;
        case 'prettier-config':
          await copyTemplate('tool-prettier-config', packagePath);
          copyPackageJsonInfo(
            currentPackageJson,
            await getPackageJson(packagePath),
          );
          addScript(currentPackageJson, 'format');
          addScript(currentPackageJson, 'format:check');
          addExports(currentPackageJson, '.', './prettier.config.js');
          break;
        case 'eslint-config':
          await copyTemplate('tool-eslint-config', packagePath);
          copyPackageJsonInfo(
            currentPackageJson,
            await getPackageJson(packagePath),
          );
          addExports(currentPackageJson, '.', './eslint.config.js');
          break;
      }
      break;
  }

  await savePackageJson(packagePath, currentPackageJson);
  if (config.type != 'typescript-config') {
    await saveTsConfigJson(packagePath, currentTsConfigJson);
  }

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    packagePath,
    config.workspace.packageJson.name,
  );
  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    packagePath,
    config.packageName,
  );
}
