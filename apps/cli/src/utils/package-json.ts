import path from 'path';
import type { PackageJson } from 'type-fest';
import fs from 'fs-extra';

import { CLI_ROOT } from './consts';
import { readJson, saveJson } from './json';

export async function getPackageJson(packageJsonDir: string) {
  const resolvedPath = path.resolve(packageJsonDir, 'package.json');
  if (!(await fs.exists(resolvedPath))) {
    return undefined;
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
  const resolvedPath = path.resolve(packageJsonDir, 'package.json');
  await saveJson(resolvedPath, data);
}
