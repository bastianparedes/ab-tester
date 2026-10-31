import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../../../../libs/env';

import * as schema from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL_POSTGRES,
  max: env.PG_POOL_MAX,
});

const db = drizzle(pool, { schema });

export default db;
