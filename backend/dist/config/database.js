"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabaseConnection = initDatabaseConnection;
exports.query = query;
exports.getPool = getPool;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let pool = new pg_1.Pool({
    host: env_1.config.db.host,
    port: env_1.config.db.port,
    user: env_1.config.db.user,
    password: env_1.config.db.password,
    database: env_1.config.db.database,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
async function initDatabaseConnection() {
    try {
        const client = await pool.connect();
        client.release();
        logger_1.logger.info(`PostgreSQL connected successfully on ${env_1.config.db.host}:${env_1.config.db.port} [${env_1.config.db.database}]`);
    }
    catch (err) {
        logger_1.logger.warn(`Failed to connect to PostgreSQL on primary port ${env_1.config.db.port}: ${err.message}`);
        // Attempt fallback port (e.g., 5432 if 5433 failed)
        if (env_1.config.db.fallbackPort && env_1.config.db.fallbackPort !== env_1.config.db.port) {
            try {
                logger_1.logger.info(`Attempting fallback PostgreSQL connection on port ${env_1.config.db.fallbackPort}...`);
                const fallbackPool = new pg_1.Pool({
                    host: env_1.config.db.host,
                    port: env_1.config.db.fallbackPort,
                    user: env_1.config.db.user,
                    password: env_1.config.db.password,
                    database: env_1.config.db.database,
                    max: 15,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                });
                const fallbackClient = await fallbackPool.connect();
                fallbackClient.release();
                await pool.end().catch(() => { });
                pool = fallbackPool;
                logger_1.logger.info(`PostgreSQL connected on fallback port ${env_1.config.db.fallbackPort} [${env_1.config.db.database}]`);
                return;
            }
            catch (fallbackErr) {
                logger_1.logger.warn(`Fallback connection on port ${env_1.config.db.fallbackPort} also failed: ${fallbackErr.message}`);
            }
        }
        logger_1.logger.error(`PostgreSQL database unavailable. Database operations will fail until database is started.`);
    }
}
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 50) {
        logger_1.logger.debug(`Slow query (${duration}ms): ${text.slice(0, 80)}...`);
    }
    return res;
}
function getPool() {
    return pool;
}
