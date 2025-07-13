import path from 'path';
import * as prompts from '@clack/prompts';
import fs from 'fs-extra';
import { z } from 'trpc-cli';

import { publicProcedure } from '~/init';
import {
  gitInit,
  gitStageAll,
  pnpmCheck,
  pnpmFormat,
  pnpmInstall,
  updateDependencies,
} from '~/utils/cliTools';
import { CWD } from '~/utils/consts';
import { UserInputError } from '~/utils/error';
import { format } from '~/utils/format';
import { copyBaseWorkspaceTemplate } from '~/utils/templates';
import { getWorkspace } from '~/utils/workspace';

const workspaceRootNameRegex = /^(?:[a-z0-9-~])[a-z0-9-._~]*$/;

const inputSchema = z.tuple([
  z
    .string()
    .nonempty()
    .optional()
    .meta({ title: 'name', description: 'name of the monorepo' }),
]);

const promptSchema = z.object({
  name: z.string().nonempty().meta({
    title: 'name',
    description: 'name of the monorepo',
  }),
});

export const createCommand = publicProcedure
  .meta({ description: 'create monorepo' })
  .input(inputSchema)
  .query(async ({ input }) => {
    const workspace = await getWorkspace();
    if (workspace) {
      throw new UserInputError({
        message: 'Monorepo already exists.',
        hint: `Use ${format.command('add')} to add packages.`,
      });
    }
    const promptInputs = await prompts.group({
      name: () =>
        input[0]
          ? Promise.resolve(input[0])
          : prompts.text({
              message: 'name of the monorepo',
            }),
    });
    promptSchema.parse(promptInputs);

    const workspacePath = path.resolve(CWD, promptInputs.name);
    const workspaceName =
      promptInputs.name == '.'
        ? path.basename(CWD)
        : path.basename(workspacePath);

    if (!workspaceRootNameRegex.test(workspaceName)) {
      throw new UserInputError({
        message: `Invalid workspace name: ${format.path(workspaceName)}`,
        hint: 'Workspace names must start with a letter or number and can contain letters, numbers, dashes, underscores, and periods.',
      });
    }

    if (
      (await fs.exists(workspacePath)) &&
      (await fs.readdir(workspacePath)).length > 0
    ) {
      throw new UserInputError({
        message: `Directory ${format.path(workspacePath)} already exists and is not empty.`,
        hint: 'Please choose a different directory or empty the existing one before proceeding.',
      });
    }

    await prompts.tasks([
      {
        title: 'Create workspace directory',
        task: () => fs.mkdirp(workspacePath),
      },
      {
        title: 'Copy workspace template',
        task: () => copyBaseWorkspaceTemplate({ workspacePath, workspaceName }),
      },
      {
        title: 'Initialize git repository',
        task: () => gitInit(workspacePath),
      },
      {
        title: 'Update dependencies',
        task: (message) => updateDependencies(workspacePath, message),
      },
      {
        title: 'Install dependencies',
        task: (message) => pnpmInstall(workspacePath, message),
      },
      {
        title: 'Format workspace',
        task: async () => {
          await pnpmFormat(workspacePath);
        },
      },
      {
        title: 'Stage changes',
        task: async () => {
          await gitStageAll(workspacePath);
        },
      },
      {
        title: 'Check workspace',
        task: (message) => pnpmCheck(workspacePath, message),
      },
    ]);

    prompts.log.success(`Monorepo ${format.path(workspacePath)} created!`);
  });
