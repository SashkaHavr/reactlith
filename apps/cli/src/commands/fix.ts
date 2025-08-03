import * as prompts from '@clack/prompts';

import { workspaceProcedure } from '~/init';
import { addPackage } from '~/utils/add-package';
import {
  gitStageAll,
  pnpmCheck,
  pnpmFormat,
  pnpmInstall,
  updateDependencies,
} from '~/utils/cli-tools';
import {
  copyBaseWorkspaceTemplate,
  getPackageNameWithoutWorkspace,
} from '~/utils/templates';
import { getWorkspacePackageInfoType } from '~/utils/workspace';

export const fixCommand = workspaceProcedure
  .meta({ description: 'fix monorepo' })
  .query(async ({ ctx }) => {
    await prompts.tasks([
      {
        title: 'Fixing workspace...',
        task: () =>
          copyBaseWorkspaceTemplate({
            workspacePath: ctx.workspace.workspaceRoot,
            workspaceName: ctx.workspace.packageJson.name,
          }),
      },
      {
        title: 'Fixing packages...',
        task: async () => {
          for (const pkg of ctx.workspace.packages) {
            prompts.log.info(
              `Fixing package ${pkg.packageJson.name}, workspace type: ${pkg.type}, type: ${getWorkspacePackageInfoType(pkg)}`,
            );
            await addPackage({
              workspace: ctx.workspace,
              packageName: getPackageNameWithoutWorkspace(
                pkg.packageJson.name,
                ctx.workspace.packageJson.name,
              ),
              type: getWorkspacePackageInfoType(pkg),
              workspacePackageType: pkg.type,
              allowOverwrite: true,
            });
          }
        },
      },
      {
        title: 'Updating dependencies...',
        task: (message) =>
          updateDependencies(ctx.workspace.workspaceRoot, message),
      },
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
        title: 'Staging changes...',
        task: async () => {
          await gitStageAll(ctx.workspace.workspaceRoot);
        },
      },
      {
        title: 'Checking workspace...',
        task: (message) => pnpmCheck(ctx.workspace.workspaceRoot, message),
      },
    ]);
  });
