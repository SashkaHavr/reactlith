import { createRequire } from 'module';
import path from 'path';
import fs from 'fs-extra';

import { TEMPLATE_MODULE, TEMPLATE_NAME } from './consts';
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

export async function getTemplateModulePath() {
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

export async function copyBaseWorkspaceTemplate(config: {
  workspacePath: string;
  workspaceName: string;
}) {
  const templateModulePath = await getTemplateModulePath();
  const templatePath = path.join(templateModulePath, 'base');
  if (!(await fs.exists(templatePath))) {
    throw new CliError({
      message: `Base template not found at ${templatePath}.`,
    });
  }
  await fs.copy(templatePath, config.workspacePath);

  await replaceInFileRecursive(
    TEMPLATE_NAME,
    config.workspacePath,
    config.workspaceName,
  );
}
