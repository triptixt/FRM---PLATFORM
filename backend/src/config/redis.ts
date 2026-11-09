import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

let isRedisConnected = false;
let redisClient: Redis | null = null;

// In-memory fallback cache when Redis is unavailable
const memoryCounterStore = new Map<string, { value: number; expiresAt: number }>();

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return isRedisConnected;
}

export async function initRedis(): Promise<void> {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
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
      logger.info(`Redis connected successfully on ${config.redis.host}:${config.redis.port}`);
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      if (config.redis.failOpen) {
        logger.warn(`Redis error (${err.message}). Fail-open is enabled; falling back gracefully.`);
      } else {
        logger.error(`Redis connection error: ${err.message}`);
      }
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    await redisClient.connect().catch((err) => {
      isRedisConnected = false;
      logger.warn(`Could not connect to Redis at ${config.redis.host}:${config.redis.port}. Fail-open active.`);
    });
  } catch (err: any) {
    isRedisConnected = false;
    logger.warn(`Redis initialization exception: ${err.message}`);
  }
}

// ── In-Memory Fallback Operations ──────────────────────────────────────────

export function memoryGet(key: string): number | null {
  const item = memoryCounterStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCounterStore.delete(key);
    return null;
  }
  return item.value;
}

export function memoryIncrBy(key: string, amount: number, ttlSeconds: number): number {
  const now = Date.now();
  const item = memoryCounterStore.get(key);
  let newVal = amount;
  if (item && now <= item.expiresAt) {
    newVal = item.value + amount;
    memoryCounterStore.set(key, { value: newVal, expiresAt: item.expiresAt });
  } else {
    memoryCounterStore.set(key, { value: newVal, expiresAt: now + ttlSeconds * 1000 });
  }
  return newVal;
}

