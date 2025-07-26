import fs from 'fs-extra';

export async function readJsonSafe<T extends object>(filePath: string) {
  try {
    return await readJson<T>(filePath);
  } catch {
    return undefined;
  }
}

export async function readJson<T extends object>(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' })) as T;
}

export async function saveJson<T extends object>(filePath: string, data: T) {
  await fs.writeFile(filePath, JSON.stringify(data));
}
