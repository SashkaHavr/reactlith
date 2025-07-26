import * as prompts from '@clack/prompts';

import { packageProcedure } from '~/init';
import { pnpmCheck, pnpmFormat, pnpmInstall } from '~/utils/cli-tools';
import { CliError, UserInputError } from '~/utils/error';
import { format } from '~/utils/format';
import { includePackage } from '~/utils/include-package';

export const includeCommand = packageProcedure
  .meta({ description: 'include another package from monorepo' })
  .query(async ({ ctx }) => {
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
    const input = await prompts.group({
      packageName: () =>
        prompts.select({
          message: 'Select a package to include',
          options: availablePackages.map((pkg) => ({
            value: pkg.packageJson.name,
            label: pkg.packageJson.name,
            hint:
              pkg.type +
              ' - ' +
              (pkg.type == 'app'
                ? pkg.appType
                : pkg.type == 'package'
                  ? pkg.packageType
                  : pkg.toolType),
          })),
        }),
    });
    const packageToInclude = ctx.workspace.packages.find(
      (pkg) => pkg.packageJson.name == input.packageName,
    );
    if (!packageToInclude) {
      throw new CliError({
        message: `Package ${input.packageName} not found in workspace`,
      });
    }
    if (!availablePackages.includes(packageToInclude)) {
      throw new CliError({
        message: `Package ${packageToInclude.packageJson.name} is already included`,
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
