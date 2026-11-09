"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlacklistService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class BlacklistService {
    static KEY_PREFIX = 'bl:';
    static TTL_SECONDS = 600; // 10 minutes
    static async refreshBlacklist() {
        try {
            const res = await (0, database_1.query)(`SELECT entity_type, entity_value, action FROM frm_risk_entity
         WHERE expiry_date IS NULL OR expiry_date > NOW()`);
            const redis = (0, redis_1.getRedisClient)();
            let count = 0;
            for (const row of res.rows) {
                const type = String(row.entity_type).toUpperCase();
                const value = String(row.entity_value);
                const action = String(row.action);
                if (redis && (0, redis_1.isRedisAvailable)()) {
                    const key = this.buildKey(type, value);
                    await redis.set(key, action, 'EX', this.TTL_SECONDS);
                }
                count++;
            }
            logger_1.logger.info(`Blacklist cache refreshed: ${count} active entries loaded.`);
        }
        catch (err) {
            logger_1.logger.warn(`Failed to refresh blacklist cache: ${err.message}`);
        }
    }
    static async isBlacklisted(entityType, entityValue) {
        if (!entityValue || !entityValue.trim())
            return false;
        const action = await this.lookup(entityType.toUpperCase(), entityValue.trim());
        const blocked = action === 'BLOCK';
        if (blocked) {
            logger_1.logger.info(`Blacklist match hit: type=${entityType} value=${entityValue}`);
        }
        return blocked;
    }
    static async isWatchlisted(entityType, entityValue) {
        if (!entityValue || !entityValue.trim())
            return false;
        const action = await this.lookup(entityType.toUpperCase(), entityValue.trim());
        return action === 'MONITOR';
    }
    static async lookup(entityType, entityValue) {
        const key = this.buildKey(entityType, entityValue);
        const redis = (0, redis_1.getRedisClient)();
        if (redis && (0, redis_1.isRedisAvailable)()) {
            try {
                const cached = await redis.get(key);
                if (cached)
                    return cached;
            }
            catch (err) {
                logger_1.logger.warn(`Redis lookup failed for ${key}, falling back to PostgreSQL`);
            }
        }
        return this.dbLookup(entityType, entityValue);
    }
    static async dbLookup(entityType, entityValue) {
        try {
            const res = await (0, database_1.query)(`SELECT action FROM frm_risk_entity
         WHERE UPPER(entity_type) = UPPER($1) AND entity_value = $2
         AND (expiry_date IS NULL OR expiry_date > NOW())
         LIMIT 1`, [entityType, entityValue]);
            return res.rows.length > 0 ? res.rows[0].action : null;
        }
        catch (err) {
            logger_1.logger.error(`Database blacklist lookup failed: ${err.message}`);
            return null;
        }
    }
    static buildKey(entityType, entityValue) {
        return `${this.KEY_PREFIX}${entityType.toUpperCase()}:${entityValue}`;
    }
}
exports.BlacklistService = BlacklistService;
