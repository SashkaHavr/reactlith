import * as p from '@clack/prompts';
import { z } from 'trpc-cli';

import { publicProcedure } from '~/init';
import { UserInputError } from '~/utils/error';
import { format } from '~/utils/format';
import { getWorkspace } from '~/utils/workspace';

const workspaceRootNameRegex = /^(?:[a-z0-9-~])[a-z0-9-._~]*$/;

const inputSchema = z.object({
  name: z
    .string()
    .nonempty()
    .regex(workspaceRootNameRegex, {
      message: 'Invalid workspace root name.',
    })
    .meta({ description: 'Name of the monorepo' }),
});

export const createCommand = publicProcedure
  .meta({ description: 'create monorepo' })
  .input(inputSchema.partial())
  .query(async ({ input }) => {
    const workspace = await getWorkspace();
    if (workspace) {
      throw new UserInputError({
        message: 'Monorepo already exists.',
        hint: `Use ${format.command('add')} to add packages.`,
      });
    }
    const promptInputs = await p.group({
      name: () =>
        input.name
          ? Promise.resolve(input.name)
          : p.text({
              message: 'Name of the monorepo',
            }),
    });
    inputSchema.parse(promptInputs);
  });
