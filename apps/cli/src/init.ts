import type { TrpcCliMeta } from 'trpc-cli';
import { initTRPC } from '@trpc/server';
import pc from 'picocolors';
import z, { ZodError } from 'zod';

import type { Context } from './context';
import { UserInputError } from './utils/error';

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

export const publicProcedure = t.procedure;

export const workspaceProcedure = t.procedure.use(({ ctx, next }) => {
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
