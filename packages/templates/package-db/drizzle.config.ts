import { defineConfig } from 'drizzle-kit';

import { envDB } from '@reactlith-template/env/db';

export default defineConfig({
  out: './drizzle',
  schema: './src/schema',
  dialect: 'postgresql',
  dbCredentials: { url: envDB.DATABASE_URL },
  casing: 'snake_case',
});
