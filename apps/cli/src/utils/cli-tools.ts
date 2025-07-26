import type { ResultPromise } from 'execa';
import { execa } from 'execa';
import which from 'which';

export async function toolIsMissing(toolName: string) {
  try {
    await which(toolName);
    return false;
  } catch {
    return true;
  }
}

export async function streamCommand(
  command: ResultPromise<object>,
  message?: (str: string) => void,
) {
  for await (const line of command.iterable({ from: 'stdout' })) {
    message?.(line);
  }
}

export async function gitInit(workspaceRoot: string) {
  await execa({ cwd: workspaceRoot })`git init`;
}

export async function gitStageAll(workspaceRoot: string) {
  await execa({ cwd: workspaceRoot })`git add .`;
}

export async function updateDependencies(
  workspaceRoot: string,
  message?: (str: string) => void,
) {
  await streamCommand(execa({ cwd: workspaceRoot })`pnpm deps-w`, message);
}

export async function pnpmInstall(
  workspaceRoot: string,
  message?: (str: string) => void,
) {
  await streamCommand(execa({ cwd: workspaceRoot })`pnpm install`, message);
}

export async function isWorkspaceClean(workspaceRoot: string) {
  const { stdout } = await execa({
    cwd: workspaceRoot,
  })`git status --porcelain`;
  return stdout.trim() == '';
}

export async function pnpmFormat(packageRoot: string) {
  return execa({ cwd: packageRoot })`pnpm format`;
}

export async function pnpmCheck(
  workspaceRoot: string,
  message?: (str: string) => void,
) {
  await streamCommand(execa({ cwd: workspaceRoot })`pnpm check`, message);
}
