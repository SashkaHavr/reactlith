import { createRequire } from 'module';
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
  TEMPLATE_MODULE,
  TEMPLATE_NAME,
  TEMPLATE_PACKAGE_NAME,
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
    config.workspace.workspaceRoot,
    config.workspace.packageJson.name,
  );
  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    config.packagePath,
    config.packageName,
  );
}

export async function getAddPackageTask(config: {
  workspace: Workspace;
  workspacePackageType: WorkspacePackageType;
  packageName: string;
  packagePath: string;
  type: AppType | PackageType | ToolType;
}) {
  if (config.type === 'base') {
    return copyPackageTemplate('basePackage', config);
  }

  switch (config.workspacePackageType) {
    case 'app':
      switch (config.type) {
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
        case 'auth':
          // TODO: handle auth package
          break;
        case 'db':
          // TODO: handle db package
          break;
        case 'trpc':
          // TODO: handle trpc package
          break;
        case 'i18n':
          // TODO: handle i18n package
          break;
        case 'env':
          // TODO: handle env package
          break;
      }
      break;
    case 'tool':
      switch (config.type) {
        case 'tsconfig':
          // TODO: handle tsconfig tool
          break;
        case 'eslint':
          // TODO: handle eslint tool
          break;
        case 'prettier':
          // TODO: handle prettier tool
          break;
      }
      break;
  }
}
