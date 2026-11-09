"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.isRedisAvailable = isRedisAvailable;
exports.initRedis = initRedis;
exports.memoryGet = memoryGet;
exports.memoryIncrBy = memoryIncrBy;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let isRedisConnected = false;
let redisClient = null;
// In-memory fallback cache when Redis is unavailable
const memoryCounterStore = new Map();
function getRedisClient() {
    return redisClient;
}
function isRedisAvailable() {
    return isRedisConnected;
}
async function initRedis() {
    try {
        redisClient = new ioredis_1.default({
            host: env_1.config.redis.host,
            port: env_1.config.redis.port,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 5) {
                    return null; // Stop retrying after 5 attempts
                }
                return Math.min(times * 200, 2000);
            },
        });
        redisClient.on('connect', () => {
            isRedisConnected = true;
            logger_1.logger.info(`Redis connected successfully on ${env_1.config.redis.host}:${env_1.config.redis.port}`);
        });
        redisClient.on('error', (err) => {
            isRedisConnected = false;
            if (env_1.config.redis.failOpen) {
                logger_1.logger.warn(`Redis error (${err.message}). Fail-open is enabled; falling back gracefully.`);
            }
            else {
                logger_1.logger.error(`Redis connection error: ${err.message}`);
            }
        });
        redisClient.on('close', () => {
            isRedisConnected = false;
        });
        await redisClient.connect().catch((err) => {
            isRedisConnected = false;
            logger_1.logger.warn(`Could not connect to Redis at ${env_1.config.redis.host}:${env_1.config.redis.port}. Fail-open active.`);
        });
    }
    catch (err) {
        isRedisConnected = false;
        logger_1.logger.warn(`Redis initialization exception: ${err.message}`);
    }
}
// ── In-Memory Fallback Operations ──────────────────────────────────────────
function memoryGet(key) {
    const item = memoryCounterStore.get(key);
    if (!item)
        return null;
    if (Date.now() > item.expiresAt) {
        memoryCounterStore.delete(key);
        return null;
    }
    return item.value;
}
function memoryIncrBy(key, amount, ttlSeconds) {
    const now = Date.now();
    const item = memoryCounterStore.get(key);
    let newVal = amount;
    if (item && now <= item.expiresAt) {
        newVal = item.value + amount;
        memoryCounterStore.set(key, { value: newVal, expiresAt: item.expiresAt });
    }
    else {
        memoryCounterStore.set(key, { value: newVal, expiresAt: now + ttlSeconds * 1000 });
    }
    return newVal;
}
