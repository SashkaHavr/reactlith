import type { TrpcCliMeta } from 'trpc-cli';
import { log } from '@clack/prompts';
import { initTRPC } from '@trpc/server';
import pc from 'picocolors';
import z, { ZodError } from 'zod';

import type { Context } from './context';
import { CliError, UserInputError } from './utils/error';

const t = initTRPC
  .meta<TrpcCliMeta>()
  .context<Context>()
  .create({
    errorFormatter(opts) {
      const { shape, error } = opts;
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError
              ? z.prettifyError(error.cause)
              : null,
        },
      };
    },
  });

export const router = t.router;

export const publicProcedure = t.procedure.use(async ({ next }) => {
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
  } else {
    log.error(`Internal error 😱: ${result.error.message}`);
  }
  return result;
});

export const workspaceProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.workspace) {
    throw new UserInputError({
      message: 'Monorepo was not found',
      hint: `Make sure you are in the root of the monorepo or use ${pc.italic('npx reactlith init')} to create one.`,
    });
  }
  return next({
    ctx: {
      ...ctx,
      workspace: ctx.workspace,
    },
  });
});
