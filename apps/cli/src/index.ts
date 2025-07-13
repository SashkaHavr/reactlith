#!/usr/bin/env node
import { log } from '@clack/prompts';
import { createCli, z } from 'trpc-cli';

import { createCommand } from './commands/create';
import { infoCommand } from './commands/info';
import { createContext } from './context';
import { router, workspaceProcedure } from './init';

export const cliRouter = router({
  create: createCommand,
  add: workspaceProcedure
    .meta({ description: 'add package to monorepo' })
    .input(
      z.tuple([
        z.enum(['app', 'package', 'tool']).meta({
          title: 'package type',
          description: 'type of package to add',
        }),
      ]),
    )
    .query(({ input: [type] }) => console.log('Add ' + type)),
  fix: workspaceProcedure
    .meta({
      description: 'add/fix common parts to existing package in monorepo',
    })
    .query(() => console.log('Fix')),
  include: workspaceProcedure
    .meta({ description: 'include another package from monorepo' })
    .query(() => console.log('Init')),
  info: infoCommand,
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
