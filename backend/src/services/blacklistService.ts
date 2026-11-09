import { query } from '../config/database';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';

export class BlacklistService {
  private static KEY_PREFIX = 'bl:';
  private static TTL_SECONDS = 600; // 10 minutes

  public static async refreshBlacklist(): Promise<void> {
    try {
      const res = await query(
        `SELECT entity_type, entity_value, action FROM frm_risk_entity
         WHERE expiry_date IS NULL OR expiry_date > NOW()`
      );

      const redis = getRedisClient();
      let count = 0;

      for (const row of res.rows) {
        const type = String(row.entity_type).toUpperCase();
        const value = String(row.entity_value);
        const action = String(row.action);

        if (redis && isRedisAvailable()) {
          const key = this.buildKey(type, value);
          await redis.set(key, action, 'EX', this.TTL_SECONDS);
        }
        count++;
      }

      logger.info(`Blacklist cache refreshed: ${count} active entries loaded.`);
    } catch (err: any) {
      logger.warn(`Failed to refresh blacklist cache: ${err.message}`);
    }
  }

  public static async isBlacklisted(entityType: string, entityValue?: string | null): Promise<boolean> {
    if (!entityValue || !entityValue.trim()) return false;
    const action = await this.lookup(entityType.toUpperCase(), entityValue.trim());
    const blocked = action === 'BLOCK';
    if (blocked) {
      logger.info(`Blacklist match hit: type=${entityType} value=${entityValue}`);
    }
    return blocked;
  }

  public static async isWatchlisted(entityType: string, entityValue?: string | null): Promise<boolean> {
    if (!entityValue || !entityValue.trim()) return false;
    const action = await this.lookup(entityType.toUpperCase(), entityValue.trim());
    return action === 'MONITOR';
  }

  public static async lookup(entityType: string, entityValue: string): Promise<string | null> {
    const key = this.buildKey(entityType, entityValue);
    const redis = getRedisClient();

    if (redis && isRedisAvailable()) {
      try {
        const cached = await redis.get(key);
        if (cached) return cached;
      } catch (err: any) {
        logger.warn(`Redis lookup failed for ${key}, falling back to PostgreSQL`);
      }
    }

    return this.dbLookup(entityType, entityValue);
  }

  private static async dbLookup(entityType: string, entityValue: string): Promise<string | null> {
    try {
      const res = await query(
        `SELECT action FROM frm_risk_entity
         WHERE UPPER(entity_type) = UPPER($1) AND entity_value = $2
         AND (expiry_date IS NULL OR expiry_date > NOW())
         LIMIT 1`,
        [entityType, entityValue]
      );
      return res.rows.length > 0 ? res.rows[0].action : null;
    } catch (err: any) {
      logger.error(`Database blacklist lookup failed: ${err.message}`);
      return null;
    }
  }

  private static buildKey(entityType: string, entityValue: string): string {
    return `${this.KEY_PREFIX}${entityType.toUpperCase()}:${entityValue}`;
  }
}

