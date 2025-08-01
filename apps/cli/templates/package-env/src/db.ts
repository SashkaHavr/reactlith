import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const dbConfig = {
  DATABASE_URL: z.string(),
};

export const envDB = createEnv({
  server: { ...dbConfig },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
