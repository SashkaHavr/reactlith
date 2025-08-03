import path from 'path';
import fs from 'fs-extra';

import type { Workspace, WorkspacePackageInfo } from './workspace';
import {
  CLI_ROOT,
  TEMPLATE_INCLUDE_BASE_PATH,
  TEMPLATE_NAME,
  TEMPLATE_PRETTY_NAME,
  TEMPLATES_FOLDER,
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

export async function replaceInFileRecursive(
  stringToReplace: string,
  dir: string,
  workspaceName: string,
) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name != 'node_modules') {
        await replaceInFileRecursive(stringToReplace, fullPath, workspaceName);
      } else if (entry.isFile()) {
        await replaceInFile(stringToReplace, fullPath, workspaceName);
      }
    }),
  );
}

async function getTemplateModulePath() {
  const resolvedPath = path.join(CLI_ROOT, TEMPLATES_FOLDER);

  if (await fs.exists(resolvedPath)) {
    return resolvedPath;
  }
  throw new CliError({
    message: `Templates folder not found.`,
  });
}

export async function copyTemplate(templateName: string, targetPath: string) {
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
  await copyTemplate('workspace-base', config.workspacePath);

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    config.workspacePath,
    config.workspaceName,
  );

  await replaceInFileRecursive(
    TEMPLATE_PRETTY_NAME,
    config.workspacePath,
    getWorkspaceNamePrettified(config.workspaceName),
  );
}

export function getPackageNameWithoutWorkspace(
  packageName: string,
  workspaceName: string,
): string {
  return packageName.replace(new RegExp(`@${workspaceName}/`, 'g'), '');
}

export function getWorkspaceNamePrettified(workspaceName: string): string {
  return workspaceName.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
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
}

export async function addEmptyIndexTs(packageRootDir: string, inSrc = true) {
  const indexPath = path.join(packageRootDir, inSrc ? 'src' : '', 'index.ts');
  await fs.mkdirp(path.dirname(indexPath));
  if (!(await fs.exists(indexPath))) {
    await fs.writeFile(indexPath, '', 'utf8');
  }
}
