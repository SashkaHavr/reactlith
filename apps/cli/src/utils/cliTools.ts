import which from 'which';

export async function toolIsMissing(toolName: string) {
  try {
    await which(toolName);
    return false;
  } catch {
    return true;
  }
}
