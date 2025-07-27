import { drizzle } from 'drizzle-orm/node-postgres';

import { envDB } from '@reactlith-template/env/db';

import { relations } from '#relations.ts';
import * as schema from './schema';

export const db = drizzle({
  connection: {
    connectionString: envDB.DATABASE_URL,
  },
  schema: schema,
  relations: relations,
  casing: 'snake_case',
});
