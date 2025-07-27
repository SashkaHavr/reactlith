import { workspaceProcedure } from '~/init';
import { getWorkspacePackageInfoType } from '~/utils/workspace';

export const infoCommand = workspaceProcedure
  .meta({ description: 'get information about monorepo' })
  .query(({ ctx }) => {
    const workspace = ctx.workspace;
    console.log(`Workspace name: ${workspace.packageJson.name}`);
    console.log(`Workspace root: ${workspace.workspaceRoot}`);
    console.log('Packages:');
    if (workspace.packages.length === 0) {
      console.log('No packages found in the workspace.');
      return;
    }
    workspace.packages.forEach((pkg) => {
      console.log(
        `- ${pkg.packageJson.name} (${pkg.type}): ${getWorkspacePackageInfoType(pkg)}`,
      );
    });
    console.log(`Current package: ${ctx.package?.packageJson.name ?? 'N/A'}`);
  });
