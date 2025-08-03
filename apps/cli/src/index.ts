#!/usr/bin/env node
import { log } from '@clack/prompts';
import { createCli } from 'trpc-cli';

import { addCommand } from './commands/add';
import { createCommand } from './commands/create';
import { fixCommand } from './commands/fix';
import { includeCommand } from './commands/include';
import { infoCommand } from './commands/info';
import { createContext } from './context';
import { router } from './init';

export const cliRouter = router({
  create: createCommand,
  add: addCommand,
  include: includeCommand,
  info: infoCommand,
  fix: fixCommand,
});

const cli = createCli({
  router: cliRouter,
  name: 'Reactlith CLI',
  description: 'Create a full-stack, typesafe, rock-solid React monorepo',
  version: '0.0.1',
  context: await createContext(),
});
await cli.run({
  logger: {
    info: (...args: unknown[]) =>
      args
        .filter(
          (arg): arg is string => typeof arg == 'string' && arg.trim() != '',
        )
        .forEach((arg) => log.info(arg)),
    error: (...args: unknown[]) =>
      args
        .filter(
          (arg): arg is string => typeof arg == 'string' && arg.trim() != '',
        )
        .forEach((arg) => log.error(arg)),
  },
  prompts: await import('@clack/prompts'),
});
