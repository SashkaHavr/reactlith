import { createRequire } from 'module';
import path from 'path';
import fs from 'fs-extra';

import type {
  AppType,
  PackageType,
  ToolType,
  WorkspacePackageType,
} from './consts';
import type { Workspace, WorkspacePackageInfo } from './workspace';
import {
  TEMPLATE_INCLUDE_BASE_PATH,
  TEMPLATE_MODULE,
  TEMPLATE_NAME,
  TEMPLATE_PACKAGE_NAME,
  workspacePackageTypeToDir,
} from './consts';
import { CliError } from './error';

async function replaceInFile(
  stringToReplace: string,
  filePath: string,
  workspaceName: string,
) {
  const content = await fs.readFile(filePath, 'utf8');
  const updatedContent = content.replace(
    new RegExp(stringToReplace, 'g'),
    workspaceName,
  );
  if (content != updatedContent) {
    await fs.writeFile(filePath, updatedContent, 'utf8');
  }
}

async function replaceInFileRecursive(
  stringToReplace: string,
  dir: string,
  workspaceName: string,
) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await replaceInFileRecursive(stringToReplace, fullPath, workspaceName);
      } else if (entry.isFile()) {
        await replaceInFile(stringToReplace, fullPath, workspaceName);
      }
    }),
  );
}

async function getTemplateModulePath() {
  const require = createRequire(import.meta.url);
  const resolvedPath = require.resolve.paths(TEMPLATE_MODULE);
  if (resolvedPath) {
    const lookupPaths = resolvedPath.map((p) => path.join(p, TEMPLATE_MODULE));
    for (const lookupPath of lookupPaths) {
      if (await fs.exists(lookupPath)) {
        return lookupPath;
      }
    }
  }
  throw new CliError({
    message: `Template module ${TEMPLATE_MODULE} not found.`,
  });
}

async function copyTemplate(templateName: string, targetPath: string) {
  const templateModulePath = await getTemplateModulePath();
  const templatePath = path.join(templateModulePath, templateName);
  if (!(await fs.exists(templatePath))) {
    throw new CliError({
      message: `Template not found at ${templatePath}.`,
    });
  }
  await fs.copy(templatePath, targetPath);
}

export async function copyBaseWorkspaceTemplate(config: {
  workspacePath: string;
  workspaceName: string;
}) {
  await copyTemplate('base', config.workspacePath);

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    config.workspacePath,
    config.workspaceName,
  );
}

export async function copyPackageTemplate(
  packageTemplateName: string,
  config: {
    workspace: Workspace;
    workspacePackageType: WorkspacePackageType;
    packageName: string;
    packagePath: string;
  },
) {
  await copyTemplate(packageTemplateName, config.packagePath);

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    config.packagePath,
    config.workspace.packageJson.name,
  );
  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    config.packagePath,
    config.packageName,
  );
}

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

  const updatedConfig = {
    ...config,
    packagePath,
  };

  switch (config.workspacePackageType) {
    case 'app':
      switch (config.type) {
        case 'base':
          await copyPackageTemplate('app-base', updatedConfig);
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
          await copyPackageTemplate('package-base', updatedConfig);
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
          await copyPackageTemplate('tool-base', updatedConfig);
          break;
        case 'typescript-config':
          await copyPackageTemplate('tool-typescript-config', updatedConfig);
          break;
        case 'eslint-config':
          await copyPackageTemplate('tool-eslint-config', updatedConfig);
          break;
        case 'prettier-config':
          await copyPackageTemplate('tool-prettier-config', updatedConfig);
          break;
      }
      break;
  }
}

export function getPackageNameWithoutWorkspace(
  packageName: string,
  workspaceName: string,
): string {
  return packageName.replace(new RegExp(`@${workspaceName}/`, 'g'), '');
}

export async function copyIncludeTemplate(
  includeTemplateName: string,
  config: {
    workspace: Workspace;
    currentPackage: WorkspacePackageInfo;
    packageToInclude: WorkspacePackageInfo;
  },
) {
  await copyTemplate(
    TEMPLATE_INCLUDE_BASE_PATH + '/' + includeTemplateName,
    config.currentPackage.packageRoot,
  );

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    config.currentPackage.packageRoot,
    config.workspace.packageJson.name,
  );
  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    config.currentPackage.packageRoot,
    getPackageNameWithoutWorkspace(
      config.packageToInclude.packageJson.name,
      config.workspace.packageJson.name,
    ),
  );
}
