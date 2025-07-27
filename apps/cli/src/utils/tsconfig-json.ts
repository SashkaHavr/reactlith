import path from 'path';
import type { TsConfigJson } from 'type-fest';
import fs from 'fs-extra';

import { readJson, saveJson } from './json';

export async function getTsConfigJson(packageRootDir: string) {
  const resolvedPath = path.resolve(packageRootDir, 'tsconfig.json');
  if (!(await fs.exists(resolvedPath))) {
    return {} as TsConfigJson;
  }
  return readJson<TsConfigJson>(resolvedPath);
}

export async function saveTsConfigJson(
  packageRootDir: string,
  data: TsConfigJson,
) {
  const resolvedPath = path.resolve(packageRootDir, 'tsconfig.json');
  await saveJson(resolvedPath, data);
}

export function extendTsConfig(
  tsconfigJson: TsConfigJson,
  tsconfigPackageName: string,
) {
  tsconfigJson.extends = tsconfigPackageName;
}

export function addTsConfigPath(tsconfigJson: TsConfigJson) {
  tsconfigJson.compilerOptions ??= {};
  tsconfigJson.compilerOptions.baseUrl = '.';
  tsconfigJson.compilerOptions.paths ??= {};
  tsconfigJson.compilerOptions.paths['~/*'] = ['./src/*'];
}

export function targetDom(tsconfigJson: TsConfigJson) {
  tsconfigJson.compilerOptions ??= {};
  tsconfigJson.compilerOptions.target = 'ES2024';
  tsconfigJson.compilerOptions.lib = ['ES2024', 'DOM', 'DOM.Iterable'];
}
