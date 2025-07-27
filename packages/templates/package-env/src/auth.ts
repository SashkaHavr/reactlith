import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const authConfig = {
  AUTH_DEV_MAGIC_LINK: z.stringbool().default(false),
};

export const authProdConfig =
  process.env.NODE_ENV == 'production'
    ? {
        BETTER_AUTH_URL: z.url(),
        BETTER_AUTH_SECRET: z.string().nonempty(),
      }
    : {};

export const envAuth = createEnv({
  server: { ...authConfig, ...authProdConfig },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
