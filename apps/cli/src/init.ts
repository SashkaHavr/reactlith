import type { TrpcCliMeta } from 'trpc-cli';
import { log } from '@clack/prompts';
import * as prompts from '@clack/prompts';
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

import type { Context } from './context';
import { checkGlobalPackages } from './utils/check-global-packages';
import { pnpmCheck } from './utils/cli-tools';
import { CliError, UserInputError } from './utils/error';
import { format } from './utils/format';

const t = initTRPC.meta<TrpcCliMeta>().context<Context>().create();

export const router = t.router;

const catchErrorsProcedure = t.procedure.use(async ({ next }) => {
  const result = await next();
  if (result.ok) {
    return result;
  }
  const internalError = result.error.cause;
  if (internalError instanceof UserInputError) {
    log.error(internalError.message);
    if (internalError.cause instanceof Error) {
      log.error(internalError.cause.message);
    }
    if (internalError.hint) {
      log.info(internalError.hint);
    }
  } else if (internalError instanceof CliError) {
    log.error(`CLI implementation error 😢: ${internalError.message}`);
    if (internalError.cause instanceof Error) {
      log.error(internalError.cause.message);
    }
  } else if (internalError instanceof ZodError) {
    return result;
  } else {
    log.error(`Internal error 😱: ${result.error.message}`);
  }
  return { ok: true, marker: result.marker, data: undefined };
});

export const publicProcedure = catchErrorsProcedure.use(async ({ next }) => {
  await prompts.tasks([
    {
      title: 'Checking global packages...',
      task: () => checkGlobalPackages(),
    },
  ]);

  return await next();
});

export const workspaceProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const workspace = ctx.workspace;
  if (!workspace) {
    throw new UserInputError({
      message: 'Monorepo was not found',
      hint: `Make sure you are in the root of the monorepo or use ${format.command('init')} to create one.`,
    });
  }

  await prompts.tasks([
    {
      title: 'Checking workspace...',
      task: (message) => pnpmCheck(workspace.workspaceRoot, message),
    },
  ]);

  return next({
    ctx: {
      ...ctx,
      workspace: workspace,
    },
  });
});

export const packageProcedure = workspaceProcedure.use(({ ctx, next }) => {
  if (!ctx.package) {
    throw new UserInputError({
      message: 'Package was not found',
      hint: `Make sure you are in the root of the package or use ${format.command('add')} to create one.`,
    });
  }
  return next({
    ctx: {
      ...ctx,
      package: ctx.package,
    },
  });
});
