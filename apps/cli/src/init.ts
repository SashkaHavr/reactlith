import type { TrpcCliMeta } from 'trpc-cli';
import { log } from '@clack/prompts';
import { initTRPC } from '@trpc/server';
import pc from 'picocolors';
import z, { ZodError } from 'zod';

import type { Context } from './context';
import { toolIsMissing } from './utils/cliTools';
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
  } else {
    log.error(`Internal error 😱: ${result.error.message}`);
  }
  return result;
});

export const publicProcedure = catchErrorsProcedure.use(async ({ next }) => {
  if (await toolIsMissing('git')) {
    throw new UserInputError({
      message: 'Git is not found.',
      hint: 'Please install Git to use Reactlith CLI. See https://git-scm.com/book/en/v2/Getting-Started-Installing-Git',
    });
  }
  if (await toolIsMissing('node')) {
    throw new UserInputError({
      message: 'Node.js is not found.',
      hint: 'Please install Node.js to use Reactlith CLI. See https://nodejs.org/en/download',
    });
  }
  if (await toolIsMissing('pnpm')) {
    throw new UserInputError({
      message: 'pnpm is not found.',
      hint: 'Please install pnpm to use Reactlith CLI. See https://pnpm.io/installation',
    });
  }
  if (await toolIsMissing('turbo')) {
    throw new UserInputError({
      message: 'Turbo is not found.',
      hint: 'Please install Turbo to use Reactlith CLI. See https://turborepo.com/docs/getting-started/installation#global-installation',
    });
  }
  if (await toolIsMissing('bun')) {
    throw new UserInputError({
      message: 'Bun is not found.',
      hint: 'Please install Bun to use Reactlith CLI. See https://bun.sh/docs/installation',
    });
  }
  if (await toolIsMissing('docker')) {
    throw new UserInputError({
      message: 'Docker is not found.',
      hint: 'Please install Docker to use Reactlith CLI. See https://docs.docker.com/get-started/get-docker',
    });
  }

  return await next();
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
