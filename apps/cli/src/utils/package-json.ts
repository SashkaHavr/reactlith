import path from 'path';
import type { PackageJson } from 'type-fest';
import fs from 'fs-extra';

import { CLI_ROOT } from './consts';
import { readJson, saveJson } from './json';

export async function getPackageJson(packageJsonDir: string) {
  const resolvedPath = path.resolve(packageJsonDir, 'package.json');
  if (!(await fs.exists(resolvedPath))) {
    return {} as PackageJson;
  }
  return readJson<PackageJson>(resolvedPath);
}

export async function getCliPackageJson() {
  return getPackageJson(CLI_ROOT);
}

export async function savePackageJson(
  packageJsonDir: string,
  data: PackageJson,
) {
  await fs.mkdirp(packageJsonDir);
  const resolvedPath = path.resolve(packageJsonDir, 'package.json');
  await saveJson(resolvedPath, data);
}

export function addDefaultPackageJsonConfig(
  packageJson: PackageJson,
  packageName: string,
) {
  packageJson.name = packageName;
  packageJson.private = true;
  packageJson.type = 'module';
  addScript(packageJson, 'clean');
}

type PackageVersion = 'workspace:*' | 'catalog:';
export function addDependency(
  packageJson: PackageJson,
  name: string,
  version: PackageVersion,
) {
  packageJson.dependencies ??= {};
  packageJson.dependencies[name] = version;
}

export function addDevDependency(
  packageJson: PackageJson,
  name: string,
  version: PackageVersion,
) {
  packageJson.devDependencies ??= {};
  packageJson.devDependencies[name] = version;
}

const packageJsonScripts = {
  clean: 'git clean -xdf .turbo node_modules dist .tanstack .nitro .output',
  format:
    'prettier . --ignore-path ../../.gitignore --ignore-path ../../.prettierignore --write',
  'format:check':
    'prettier . --ignore-path ../../.gitignore --ignore-path ../../.prettierignore --check',
  lint: 'eslint',
  'lint:fix': 'eslint --fix',
  typecheck: 'tsc --noEmit',
};

export function addScript(
  packageJson: PackageJson,
  script: keyof typeof packageJsonScripts,
) {
  packageJson.scripts ??= {};
  packageJson.scripts[script] = packageJsonScripts[script];
}

export function addImports(packageJson: PackageJson) {
  packageJson.imports ??= {};
  packageJson.imports['#*'] = './src/*';
}

export function addExports(
  packageJson: PackageJson,
  exportKey: string,
  exportPath: string,
) {
  packageJson.exports ??= {};
  const exports = packageJson.exports;
  if (typeof exports == 'object' && !Array.isArray(exports)) {
    exports[exportKey] = exportPath;
  }
}

export function copyPackageJsonInfo(
  packageJson: PackageJson,
  source: PackageJson,
) {
  if (source.dependencies) {
    packageJson.dependencies ??= {};
    Object.assign(packageJson.dependencies, source.dependencies);
  }
  if (source.devDependencies) {
    packageJson.devDependencies ??= {};
    Object.assign(packageJson.devDependencies, source.devDependencies);
  }
  if (source.scripts) {
    packageJson.scripts ??= {};
    Object.assign(packageJson.scripts, source.scripts);
  }
  if (
    source.exports != null &&
    typeof source.exports == 'object' &&
    !Array.isArray(source.exports)
  ) {
    packageJson.exports ??= {};
    Object.assign(packageJson.exports, source.exports);
  }
}
