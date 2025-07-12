import { CWD } from './utils/consts';
import { getPackage, getWorkspace } from './utils/workspace';

export async function createContext() {
  return { workspace: await getWorkspace(), package: await getPackage(CWD) };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
