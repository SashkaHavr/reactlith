#!/bin/env node
import { createCli, z } from 'trpc-cli';

import { createContext } from './context';
import { procedure, router } from './init';

export const cliRouter = router({
  create: procedure
    .meta({ description: 'create monorepo' })
    .query(() => console.log('Init')),
  add: procedure
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
  fix: procedure
    .meta({ description: 'add common parts to existing package in monorepo' })
    .query(() => console.log('Fix')),
  integrate: procedure
    .meta({ description: 'add another package from monorepo' })
    .query(() => console.log('Init')),
});

const cli = createCli({
  router: cliRouter,
  name: 'Reactlith CLI',
  description: 'Create a full-stack, typesafe, rock-solid React monorepo',
  version: '0.0.1',
  context: () => createContext(),
});
await cli.run();
