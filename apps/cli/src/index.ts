#!/usr/bin/env node
import { createCli, z } from 'trpc-cli';

import { infoCommand } from './commands/info';
import { createContext } from './context';
import { publicProcedure, router, workspaceProcedure } from './init';

export const cliRouter = router({
  create: publicProcedure
    .meta({ description: 'create monorepo' })
    .query(() => console.log('Init')),
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
await cli.run();
