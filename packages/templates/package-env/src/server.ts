import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { authConfig, authProdConfig } from './auth';
import { dbConfig } from './db';

export const envServer = createEnv({
  server: {
    ...dbConfig,
    ...authConfig,
    ...authProdConfig,

    NODE_ENV: z.enum(['development', 'production']),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
