import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger';

let pool: Pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDatabaseConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
    logger.info(`PostgreSQL connected successfully on ${config.db.host}:${config.db.port} [${config.db.database}]`);
  } catch (err: any) {
    logger.warn(`Failed to connect to PostgreSQL on primary port ${config.db.port}: ${err.message}`);

    // Attempt fallback port (e.g., 5432 if 5433 failed)
    if (config.db.fallbackPort && config.db.fallbackPort !== config.db.port) {
      try {
        logger.info(`Attempting fallback PostgreSQL connection on port ${config.db.fallbackPort}...`);
        const fallbackPool = new Pool({
          host: config.db.host,
          port: config.db.fallbackPort,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
          max: 15,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        const fallbackClient = await fallbackPool.connect();
        fallbackClient.release();
        await pool.end().catch(() => {});
        pool = fallbackPool;
        logger.info(`PostgreSQL connected on fallback port ${config.db.fallbackPort} [${config.db.database}]`);
        return;
      } catch (fallbackErr: any) {
        logger.warn(`Fallback connection on port ${config.db.fallbackPort} also failed: ${fallbackErr.message}`);
      }
    }

    logger.error(`PostgreSQL database unavailable. Database operations will fail until database is started.`);
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 50) {
    logger.debug(`Slow query (${duration}ms): ${text.slice(0, 80)}...`);
  }
  return res;
}

export function getPool(): Pool {
  return pool;
}

