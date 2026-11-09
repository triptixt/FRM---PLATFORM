import { config } from '../config/env';
import { getRedisClient, isRedisAvailable, memoryGet, memoryIncrBy } from '../config/redis';
import { logger } from '../utils/logger';

export class VelocityService {
  private static keyPrefix = config.redis.keyPrefix;
  private static failOpen = config.redis.failOpen;

  public static toSeconds(window?: string | null): number {
    if (!window) return 300;
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

  public static async getCount(
    entityName: string,
    entityValue: string,
    windowSeconds: number
  ): Promise<number> {
    const key = this.buildKey(entityName, entityValue, windowSeconds);
    const redis = getRedisClient();

    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(key);
        return val ? parseInt(val, 10) : 0;
      } catch (err: any) {
        logger.warn(`Redis getCount error for ${key}: ${err.message}`);
      }
    }

    // Fallback to in-memory store
    const memVal = memoryGet(key);
    if (memVal !== null) return memVal;

    return this.failOpen ? 0 : -1;
  }

  public static async getSum(
    entityName: string,
    entityValue: string,
    windowSeconds: number
  ): Promise<number> {
    const key = this.buildSumKey(entityName, entityValue, windowSeconds);
    const redis = getRedisClient();

    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(key);
        return val ? parseFloat(val) : 0;
      } catch (err: any) {
        logger.warn(`Redis getSum error for ${key}: ${err.message}`);
      }
    }

    // Fallback to in-memory store
    const memVal = memoryGet(key);
    if (memVal !== null) return memVal;

    return this.failOpen ? 0 : -1;
  }

  public static async incrementCount(
    entityName: string,
    entityValue: string,
    windowSeconds: number
  ): Promise<void> {
    const key = this.buildKey(entityName, entityValue, windowSeconds);
    const redis = getRedisClient();

    if (redis && isRedisAvailable()) {
      try {
        const newVal = await redis.incr(key);
        if (newVal === 1) {
          await redis.expire(key, windowSeconds);
        }
      } catch (err: any) {
        logger.warn(`Redis incrementCount error for ${key}: ${err.message}`);
      }
    }

    // Maintain in memory fallback
    memoryIncrBy(key, 1, windowSeconds);
  }

  public static async incrementSum(
    entityName: string,
    entityValue: string,
    windowSeconds: number,
    amount: number
  ): Promise<void> {
    const key = this.buildSumKey(entityName, entityValue, windowSeconds);
    const redis = getRedisClient();
    const amountInt = Math.round(amount);

    if (redis && isRedisAvailable()) {
      try {
        const newVal = await redis.incrby(key, amountInt);
        if (newVal === amountInt) {
          await redis.expire(key, windowSeconds);
        }
      } catch (err: any) {
        logger.warn(`Redis incrementSum error for ${key}: ${err.message}`);
      }
    }

    // Maintain in memory fallback
    memoryIncrBy(key, amountInt, windowSeconds);
  }

  private static buildKey(entityName: string, entityValue: string, windowSeconds: number): string {
    return `${this.keyPrefix}${entityName}:${this.sanitise(entityValue)}:${windowSeconds}`;
  }

  private static buildSumKey(entityName: string, entityValue: string, windowSeconds: number): string {
    return `${this.keyPrefix}sum:${entityName}:${this.sanitise(entityValue)}:${windowSeconds}`;
  }

  private static sanitise(value?: string | null): string {
    return value ? value.replace(/[\s:*?]/g, '_') : 'null';
  }
}

