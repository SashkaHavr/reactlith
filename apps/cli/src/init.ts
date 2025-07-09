import type { TrpcCliMeta } from 'trpc-cli';
import { initTRPC } from '@trpc/server';
import z, { ZodError } from 'zod/v4';

import type { Context } from './context';

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

export const procedure = t.procedure;
