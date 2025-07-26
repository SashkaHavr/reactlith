import type { PackageJson } from 'type-fest';

import type { Workspace, WorkspacePackageInfo } from './workspace';
import { savePackageJson } from './package-json';
import { copyIncludeTemplate } from './templates';

export async function includePackage(
  workspace: Workspace,
  currentPackage: WorkspacePackageInfo,
  packageToInclude: WorkspacePackageInfo,
) {
  const currentPackageJson = currentPackage.packageJson;
  const copyConfig = {
    workspace,
    currentPackage,
    packageToInclude,
  };

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
          await copyIncludeTemplate('tool-typescript-config', copyConfig);
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
}

type PackageVersion = 'workspace:*' | 'catalog:';

function addDependency(
  packageJson: PackageJson,
  name: string,
  version: PackageVersion,
) {
  packageJson.dependencies ??= {};
  packageJson.dependencies[name] = version;
}

function addDevDependency(
  packageJson: PackageJson,
  name: string,
  version: PackageVersion,
) {
  packageJson.devDependencies ??= {};
  packageJson.devDependencies[name] = version;
}

type PackageJsonScript =
  | 'format'
  | 'format:check'
  | 'lint'
  | 'lint:fix'
  | 'typecheck';
const packageJsonScripts: Record<PackageJsonScript, string> = {
  format:
    'prettier . --ignore-path ../../.gitignore --ignore-path ../../.prettierignore --write',
  'format:check':
    'prettier . --ignore-path ../../.gitignore --ignore-path ../../.prettierignore --check',
  lint: 'eslint',
  'lint:fix': 'eslint --fix',
  typecheck: 'tsc --noEmit',
};

function addScript(packageJson: PackageJson, script: PackageJsonScript) {
  packageJson.scripts ??= {};
  packageJson.scripts[script] = packageJsonScripts[script];
}
