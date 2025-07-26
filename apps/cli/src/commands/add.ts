import * as prompts from '@clack/prompts';
import { z } from 'trpc-cli';

import type { AppType, PackageType, ToolType } from '~/utils/consts';
import { workspaceProcedure } from '~/init';
import { pnpmCheck, pnpmFormat, pnpmInstall } from '~/utils/cli-tools';
import { appTypes, packageTypes, toolTypes } from '~/utils/consts';
import { UserInputError } from '~/utils/error';
import { addPackage } from '~/utils/templates';

const packageNameRegex =
  /^(?:(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?\/[a-z0-9-._~])|[a-z0-9-~])[a-z0-9-._~]*$/;

const packageTypeSchema = z.enum(['app', 'package', 'tool']).meta({
  title: 'package type',
  description: 'type of package to add',
});

const packageNameSchema = z
  .string()
  .nonempty()
  .meta({ title: 'name', description: 'name of the package' });

const inputSchema = z.tuple([
  packageTypeSchema.optional(),
  packageNameSchema.optional(),
]);

const promptSchema = z.object({
  workspacePackageType: packageTypeSchema,
  packageName: packageNameSchema,
  type: z.enum([...appTypes, ...packageTypes, ...toolTypes]).meta({
    title: 'type',
  }),
});

export const addCommand = workspaceProcedure
  .meta({ description: 'add package to monorepo' })
  .input(inputSchema)
  .query(async ({ input: [inputPackageType, inputPackageName], ctx }) => {
    const promptInput = await prompts.group({
      workspacePackageType: () =>
        inputPackageType
          ? Promise.resolve(inputPackageType)
          : prompts.select({
              message: 'Select package type to add',
              options: [
                { value: 'app', label: 'App' },
                { value: 'package', label: 'Package' },
                { value: 'tool', label: 'Tool' },
              ],
            }),
      type: ({ results: { workspacePackageType } }) => {
        if (!workspacePackageType) {
          throw new UserInputError({
            message: 'Package type is required',
            hint: 'Please select a package type from the options provided.',
          });
        }
        switch (workspacePackageType) {
          case 'app':
            return prompts.select<AppType>({
              message: 'Select app type',
              options: [
                { value: 'base', label: 'Base App' },
                { value: 'web', label: 'Web App' },
                { value: 'api', label: 'API App' },
              ],
            });
          case 'package':
            return prompts.select<PackageType>({
              message: 'Select package type',
              options: [
                { value: 'base', label: 'Base Package' },
                { value: 'auth', label: 'Auth Package' },
                { value: 'db', label: 'DB Package' },
                { value: 'trpc', label: 'tRPC Package' },
                { value: 'intl', label: 'i18n Package' },
                { value: 'env', label: 'Env Package' },
              ],
            });
          case 'tool':
            return prompts.select<ToolType>({
              message: 'Select tool type',
              options: [
                { value: 'base', label: 'Base Tool' },
                { value: 'typescript-config', label: 'TSConfig' },
                { value: 'eslint-config', label: 'ESLint Config' },
                { value: 'prettier-config', label: 'Prettier Config' },
              ],
            });
        }
      },
      packageName: () =>
        inputPackageName
          ? Promise.resolve(inputPackageName)
          : prompts.text({
              message: 'Package name',
            }),
    });
    const parsedInput = promptSchema.parse(promptInput);

    if (!packageNameRegex.test(parsedInput.packageName)) {
      throw new UserInputError({
        message: `Invalid package name: ${parsedInput.packageName}`,
        hint: 'Package names must start with a letter, number, or @, and can contain letters, numbers, dashes, underscores, and periods.',
      });
    }

    if (
      ctx.workspace.packages.some(
        (pkg) => pkg.packageJson.name == parsedInput.packageName,
      )
    ) {
      throw new UserInputError({
        message: `Package ${parsedInput.packageName} already exists in the workspace.`,
        hint: 'Please choose a different package name.',
      });
    }

    const templateConfig = {
      workspace: ctx.workspace,
      workspacePackageType: parsedInput.workspacePackageType,
      packageName: parsedInput.packageName,
    };

    await prompts.tasks([
      {
        title: `Add ${parsedInput.type} package in ${ctx.workspace.packageJson.name} under ${parsedInput.workspacePackageType}`,
        task: () =>
          addPackage({
            ...templateConfig,
            type: parsedInput.type,
          }),
      },
      // TODO update dependencies?
      {
        title: 'Installing dependencies...',
        task: (message) => pnpmInstall(ctx.workspace.workspaceRoot, message),
      },
      {
        title: 'Formatting files...',
        task: async () => {
          await pnpmFormat(ctx.workspace.workspaceRoot);
        },
      },
      {
        title: 'Checking workspace...',
        task: (message) => pnpmCheck(ctx.workspace.workspaceRoot, message),
      },
    ]);

    prompts.log.success(
      `Package ${parsedInput.packageName} added successfully!`,
    );
  });
