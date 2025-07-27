import * as prompts from '@clack/prompts';

import type { AppType, PackageType, ToolType } from './consts';
import type { Workspace, WorkspacePackageInfo } from './workspace';
import { TEMPLATE_NAME, TEMPLATE_PACKAGE_NAME } from './consts';
import { CliError, UserInputError } from './error';
import { format } from './format';
import {
  addDependency,
  addDevDependency,
  addScript,
  savePackageJson,
} from './package-json';
import {
  copyIncludeTemplate,
  getPackageNameWithoutWorkspace,
  replaceInFileRecursive,
} from './templates';
import {
  extendTsConfig,
  getTsConfigJson,
  saveTsConfigJson,
} from './tsconfig-json';
import { getWorkspacePackageInfoType } from './workspace';

export async function includePackage(
  workspace: Workspace,
  currentPackage: WorkspacePackageInfo,
  packageToInclude: WorkspacePackageInfo,
  replaceTemplateName = true,
) {
  const currentPackageJson = currentPackage.packageJson;
  const copyConfig = {
    workspace,
    currentPackage,
    packageToInclude,
  };
  const currentTsConfigJson = await getTsConfigJson(currentPackage.packageRoot);

  switch (packageToInclude.type) {
    case 'app':
      addDependency(
        currentPackageJson,
        packageToInclude.packageJson.name,
        'workspace:*',
      );
      break;
    case 'package':
      addDependency(
        currentPackageJson,
        packageToInclude.packageJson.name,
        'workspace:*',
      );
      break;
    case 'tool':
      addDevDependency(
        currentPackageJson,
        packageToInclude.packageJson.name,
        'workspace:*',
      );
      switch (packageToInclude.toolType) {
        case 'typescript-config':
          extendTsConfig(
            currentTsConfigJson,
            packageToInclude.packageJson.name,
          );
          addScript(currentPackageJson, 'typecheck');
          addDevDependency(currentPackageJson, 'typescript', 'catalog:');
          break;
        case 'eslint-config':
          await copyIncludeTemplate('tool-eslint-config', copyConfig);
          addScript(currentPackageJson, 'lint');
          addScript(currentPackageJson, 'lint:fix');
          break;
        case 'prettier-config':
          currentPackageJson.prettier = packageToInclude.packageJson.name;
          addScript(currentPackageJson, 'format');
          addScript(currentPackageJson, 'format:check');
          break;
      }
      break;
  }
  await savePackageJson(currentPackage.packageRoot, currentPackageJson);
  await saveTsConfigJson(currentPackage.packageRoot, currentTsConfigJson);

  await replaceInFileRecursive(
    `@${TEMPLATE_NAME}/${getWorkspacePackageInfoType(packageToInclude)}`,
    currentPackage.packageRoot,
    packageToInclude.packageJson.name,
  );
  if (replaceTemplateName) {
    await replaceInFileRecursive(
      TEMPLATE_NAME,
      currentPackage.packageRoot,
      workspace.packageJson.name,
    );
  }
  await replaceInFileRecursive(
    TEMPLATE_PACKAGE_NAME,
    currentPackage.packageRoot,
    getPackageNameWithoutWorkspace(
      packageToInclude.packageJson.name,
      workspace.packageJson.name,
    ),
  );
}

export async function includePackageByTypeInteractive(
  workspace: Workspace,
  currentPackage: WorkspacePackageInfo,
  packageToInclude: AppType | PackageType | ToolType,
) {
  if (packageToInclude == 'base') {
    throw new CliError({
      message: 'Cannot interactively include base package type.',
    });
  }

  if (
    currentPackage.dependencies.some(
      (dep) => getWorkspacePackageInfoType(dep) == packageToInclude,
    )
  ) {
    return;
  }

  const packages = workspace.packages.filter(
    (pkg) => getWorkspacePackageInfoType(pkg) == packageToInclude,
  );
  if (packages.length == 0) {
    throw new UserInputError({
      message: `No packages found for type ${packageToInclude}.`,
      hint: `Use ${format.command('add')} to add a new package of type ${packageToInclude}.`,
    });
  } else if (packages.length == 1 && packages[0] != undefined) {
    await includePackage(workspace, currentPackage, packages[0]);
  } else {
    const promptInput = await prompts.group({
      packageToInclude: () =>
        prompts.select({
          message: `Select package to include of type ${packageToInclude}`,
          options: packages.map((pkg) => ({
            value: pkg.packageJson.name,
            label: pkg.packageJson.name,
          })),
        }),
    });
    const selectedPackage = packages.find(
      (pkg) => pkg.packageJson.name == promptInput.packageToInclude,
    );
    if (!selectedPackage) {
      throw new UserInputError({
        message: `Selected package not found.`,
        hint: `Please select a valid package from the list.`,
      });
    }
    await includePackage(workspace, currentPackage, selectedPackage, false);
  }
}
