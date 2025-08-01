import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import z, { ZodError } from 'zod';

import { auth } from '@reactlith-template/auth';
import { envServer } from '@reactlith-template/env/server';

import type { Context } from '#context.ts';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.prettifyError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;

export const publicProcedure =
  envServer.NODE_ENV == 'production'
    ? t.procedure
    : t.procedure.use(async ({ next }) => {
        const result = await next();
        if (
          !result.ok &&
          [
            'INTERNAL_SERVER_ERROR',
            'NOT_IMPLEMENTED',
            'BAD_GATEWAY',
            'SERVICE_UNAVAILABLE',
            'SERVICE_UNAVAILABLE',
          ].includes(result.error.code)
        ) {
          console.error(result.error);
        }
        return result;
      });

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: ctx.request.headers,
  });
  if (!session) {
    throw new TRPCError({
      message: 'You must authenticate to use this endpoint',
      code: 'UNAUTHORIZED',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: session,
      userId: session.user.id,
    },
  });
});

export function adminProcedure(
  permission: NonNullable<
    Parameters<typeof auth.api.userHasPermission>[0]['body']['permission']
  >,
) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const hasPermission = await auth.api.userHasPermission({
      body: { userId: ctx.userId, permission: permission },
    });
    if (!hasPermission.success) {
      throw new TRPCError({
        message: "You don't have permissions to access this endpoint",
        code: 'FORBIDDEN',
      });
    }
    return next();
  });
}

export const createCallerFactory = t.createCallerFactory;
