import * as prompts from '@clack/prompts';
import { z } from 'trpc-cli';

import { packageProcedure } from '~/init';
import { pnpmCheck, pnpmFormat, pnpmInstall } from '~/utils/cli-tools';
import { CliError, UserInputError } from '~/utils/error';
import { format } from '~/utils/format';
import { includePackage } from '~/utils/include-package';
import { getPackageNameWithoutWorkspace } from '~/utils/templates';
import { getWorkspacePackageInfoType } from '~/utils/workspace';

const packageNameSchema = z
  .string()
  .nonempty()
  .meta({ title: 'name', description: 'name of the package in workspace' });

const inputSchema = z.tuple([packageNameSchema.optional()]);

const promptSchema = z.object({
  packageName: packageNameSchema,
});

export const includeCommand = packageProcedure
  .meta({ description: 'include another package from monorepo' })
  .input(inputSchema)
  .query(async ({ ctx, input: [inputPackageName] }) => {
    const availablePackages = ctx.workspace.packages.filter(
      (pkg) =>
        ctx.package.packageJson.dependencies?.[pkg.packageJson.name] ==
          undefined &&
        ctx.package.packageJson.devDependencies?.[pkg.packageJson.name] ==
          undefined &&
        ctx.package.packageJson.name != pkg.packageJson.name,
    );
    if (availablePackages.length == 0) {
      throw new UserInputError({
        message: 'No packages available to include.',
        hint: `Use ${format.command('add')} to add packages.`,
      });
    }
    const promptInput = await prompts.group({
      packageName: () =>
        inputPackageName
          ? Promise.resolve(inputPackageName)
          : prompts.select({
              message: 'Select a package to include',
              options: availablePackages.map((pkg) => ({
                value: pkg.packageJson.name,
                label: pkg.packageJson.name,
                hint: pkg.type + ' - ' + getWorkspacePackageInfoType(pkg),
              })),
            }),
    });
    const parsedInput = promptSchema.parse(promptInput);

    const packageToInclude = availablePackages.find(
      (pkg) =>
        pkg.packageJson.name == parsedInput.packageName ||
        getPackageNameWithoutWorkspace(
          pkg.packageJson.name,
          ctx.workspace.packageJson.name,
        ) == parsedInput.packageName,
    );
    if (!packageToInclude) {
      throw new CliError({
        message: `Package ${parsedInput.packageName} not found in workspace or already included.`,
      });
    }

    await prompts.tasks([
      {
        title: `Including package ${packageToInclude.packageJson.name}`,
        task: async () => {
          await includePackage(ctx.workspace, ctx.package, packageToInclude);
        },
      },
      {
        title: 'Installing dependencies...',
        task: (message) => pnpmInstall(ctx.workspace.workspaceRoot, message),
      },
      {
        title: 'Formatting files...',
        task: async () => {
          await pnpmFormat(ctx.package.packageRoot);
        },
      },
      {
        title: 'Checking workspace...',
        task: (message) => pnpmCheck(ctx.workspace.workspaceRoot, message),
      },
    ]);

    prompts.log.success(
      `${format.path(packageToInclude.packageJson.name)} is included in ${format.path(ctx.package.packageJson.name)}!`,
    );
  });
