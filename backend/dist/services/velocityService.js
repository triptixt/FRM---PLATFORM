"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VelocityService = void 0;
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
class VelocityService {
    static keyPrefix = env_1.config.redis.keyPrefix;
    static failOpen = env_1.config.redis.failOpen;
    static toSeconds(window) {
        if (!window)
            return 300;
        switch (window.toLowerCase()) {
            case '1m':
                return 60;
            case '5m':
                return 300;
            case '10m':
                return 600;
            case '15m':
                return 900;
            case '30m':
                return 1800;
            case '1h':
                return 3600;
            case '6h':
                return 21600;
            case '1d':
                return 86400;
            default:
                return 300;
        }
    }
    static async getCount(entityName, entityValue, windowSeconds) {
        const key = this.buildKey(entityName, entityValue, windowSeconds);
        const redis = (0, redis_1.getRedisClient)();
        if (redis && (0, redis_1.isRedisAvailable)()) {
            try {
                const val = await redis.get(key);
                return val ? parseInt(val, 10) : 0;
            }
            catch (err) {
                logger_1.logger.warn(`Redis getCount error for ${key}: ${err.message}`);
            }
        }
        // Fallback to in-memory store
        const memVal = (0, redis_1.memoryGet)(key);
        if (memVal !== null)
            return memVal;
        return this.failOpen ? 0 : -1;
    }
    static async getSum(entityName, entityValue, windowSeconds) {
        const key = this.buildSumKey(entityName, entityValue, windowSeconds);
        const redis = (0, redis_1.getRedisClient)();
        if (redis && (0, redis_1.isRedisAvailable)()) {
            try {
                const val = await redis.get(key);
                return val ? parseFloat(val) : 0;
            }
            catch (err) {
                logger_1.logger.warn(`Redis getSum error for ${key}: ${err.message}`);
            }
        }
        // Fallback to in-memory store
        const memVal = (0, redis_1.memoryGet)(key);
        if (memVal !== null)
            return memVal;
        return this.failOpen ? 0 : -1;
    }
    static async incrementCount(entityName, entityValue, windowSeconds) {
        const key = this.buildKey(entityName, entityValue, windowSeconds);
        const redis = (0, redis_1.getRedisClient)();
        if (redis && (0, redis_1.isRedisAvailable)()) {
            try {
                const newVal = await redis.incr(key);
                if (newVal === 1) {
                    await redis.expire(key, windowSeconds);
                }
            }
            catch (err) {
                logger_1.logger.warn(`Redis incrementCount error for ${key}: ${err.message}`);
            }
        }
        // Maintain in memory fallback
        (0, redis_1.memoryIncrBy)(key, 1, windowSeconds);
    }
    static async incrementSum(entityName, entityValue, windowSeconds, amount) {
        const key = this.buildSumKey(entityName, entityValue, windowSeconds);
        const redis = (0, redis_1.getRedisClient)();
        const amountInt = Math.round(amount);
        if (redis && (0, redis_1.isRedisAvailable)()) {
            try {
                const newVal = await redis.incrby(key, amountInt);
                if (newVal === amountInt) {
                    await redis.expire(key, windowSeconds);
                }
            }
            catch (err) {
                logger_1.logger.warn(`Redis incrementSum error for ${key}: ${err.message}`);
            }
        }
        // Maintain in memory fallback
        (0, redis_1.memoryIncrBy)(key, amountInt, windowSeconds);
    }
    static buildKey(entityName, entityValue, windowSeconds) {
        return `${this.keyPrefix}${entityName}:${this.sanitise(entityValue)}:${windowSeconds}`;
    }
    static buildSumKey(entityName, entityValue, windowSeconds) {
        return `${this.keyPrefix}sum:${entityName}:${this.sanitise(entityValue)}:${windowSeconds}`;
    }
    static sanitise(value) {
        return value ? value.replace(/[\s:*?]/g, '_') : 'null';
    }
}
exports.VelocityService = VelocityService;
