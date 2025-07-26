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
} from '~/utils/cli-tools';
import { CWD } from '~/utils/consts';
import { UserInputError } from '~/utils/error';
import { format } from '~/utils/format';
import { addPackage, copyBaseWorkspaceTemplate } from '~/utils/templates';
import { getWorkspace, getWorkspaceFromPathDefined } from '~/utils/workspace';

const workspaceRootNameRegex = /^(?:[a-z0-9-~])[a-z0-9-._~]*$/;

const nameSchema = z
  .string()
  .nonempty()
  .meta({ title: 'name', description: 'name of the monorepo' });

const inputSchema = z.tuple([nameSchema.optional()]);

const promptSchema = z.object({
  name: nameSchema,
});

export const createCommand = publicProcedure
  .meta({ description: 'create monorepo' })
  .input(inputSchema)
  .query(async ({ input: [inputName] }) => {
    const workspace = await getWorkspace();
    if (workspace) {
      throw new UserInputError({
        message: 'Monorepo already exists.',
        hint: `Use ${format.command('add')} to add packages.`,
      });
    }
    const promptInput = await prompts.group({
      name: () =>
        inputName
          ? Promise.resolve(inputName)
          : prompts.text({
              message: 'name of the monorepo',
            }),
    });
    const parsedInput = promptSchema.parse(promptInput);

    const workspacePath = path.resolve(CWD, parsedInput.name);
    const workspaceName =
      parsedInput.name == '.'
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
        title: 'Creating workspace directory...',
        task: () => fs.mkdirp(workspacePath),
      },
      {
        title: 'Copying workspace template...',
        task: () => copyBaseWorkspaceTemplate({ workspacePath, workspaceName }),
      },
      {
        title: 'Copying typescript config template...',
        task: async () =>
          await addPackage({
            workspace: await getWorkspaceFromPathDefined(workspacePath),
            workspacePackageType: 'tool',
            packageName: 'typescript-config',
            type: 'typescript-config',
          }),
      },
      {
        title: 'Copying prettier config template...',
        task: async () =>
          await addPackage({
            workspace: await getWorkspaceFromPathDefined(workspacePath),
            workspacePackageType: 'tool',
            packageName: 'prettier-config',
            type: 'prettier-config',
          }),
      },
      {
        title: 'Copying eslint config template...',
        task: async () =>
          await addPackage({
            workspace: await getWorkspaceFromPathDefined(workspacePath),
            workspacePackageType: 'tool',
            packageName: 'eslint-config',
            type: 'eslint-config',
          }),
      },
      {
        title: 'Initializing git repository...',
        task: () => gitInit(workspacePath),
      },
      {
        title: 'Updating dependencies...',
        task: (message) => updateDependencies(workspacePath, message),
      },
      {
        title: 'Installing dependencies...',
        task: (message) => pnpmInstall(workspacePath, message),
      },
      {
        title: 'Formatting files...',
        task: async () => {
          await pnpmFormat(workspacePath);
        },
      },
      {
        title: 'Staging changes...',
        task: async () => {
          await gitStageAll(workspacePath);
        },
      },
      {
        title: 'Checking workspace...',
        task: (message) => pnpmCheck(workspacePath, message),
      },
    ]);

    prompts.log.success(`Monorepo ${format.path(workspacePath)} created!`);
  });
