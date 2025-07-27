import { toolIsMissing } from './cli-tools';
import { UserInputError } from './error';

export async function checkGlobalPackages() {
  if (await toolIsMissing('git')) {
    throw new UserInputError({
      message: 'Git is not found.',
      hint: 'Please install Git to use Reactlith CLI. See https://git-scm.com/book/en/v2/Getting-Started-Installing-Git',
    });
  }
  if (await toolIsMissing('node')) {
    throw new UserInputError({
      message: 'Node.js is not found.',
      hint: 'Please install Node.js to use Reactlith CLI. See https://nodejs.org/en/download',
    });
  }
  if (await toolIsMissing('pnpm')) {
    throw new UserInputError({
      message: 'pnpm is not found.',
      hint: 'Please install pnpm to use Reactlith CLI. See https://pnpm.io/installation',
    });
  }
  if (await toolIsMissing('turbo')) {
    throw new UserInputError({
      message: 'Turbo is not found.',
      hint: 'Please install Turbo to use Reactlith CLI. See https://turborepo.com/docs/getting-started/installation#global-installation',
    });
  }
  if (await toolIsMissing('bun')) {
    throw new UserInputError({
      message: 'Bun is not found.',
      hint: 'Please install Bun to use Reactlith CLI. See https://bun.sh/docs/installation',
    });
  }
  if (await toolIsMissing('docker')) {
    throw new UserInputError({
      message: 'Docker is not found.',
      hint: 'Please install Docker to use Reactlith CLI. See https://docs.docker.com/get-started/get-docker',
    });
  }
}
