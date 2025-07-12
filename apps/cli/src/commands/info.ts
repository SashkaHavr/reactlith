import { workspaceProcedure } from '~/init';

export const infoCommand = workspaceProcedure
  .meta({ description: 'Get information about monorepo' })
  .query(({ ctx }) => {
    const workspace = ctx.workspace;
    console.log(`Workspace root: ${workspace.workspaceRoot}`);
    console.log(`Workspace name: ${workspace.packageJson.name}`);
    console.log(
      `Workspace packages: ${workspace.packages.map((pkg) => pkg.packageJson.name).join(', ')}`,
    );
    console.log(`Package name: ${ctx.package?.packageJson.name ?? 'N/A'}`);
  });
