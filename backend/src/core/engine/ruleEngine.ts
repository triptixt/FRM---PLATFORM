import { query } from '../../config/database';
import { TransactionContext } from './TransactionContext';
import { StaticEvaluator } from '../evaluators/staticEvaluator';
import { AggregationEvaluator } from '../evaluators/aggregationEvaluator';
import { DecisionEngine } from './decisionEngine';
import { VelocityService } from '../../services/velocityService';
import { FrmRule, RiskAssessment } from '../types';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

export class RuleEngineService {
  private static ruleCache: FrmRule[] = [];
  private static refreshTimer: NodeJS.Timeout | null = null;

  public static async init(): Promise<void> {
    await this.refreshRuleCache();
    if (!this.refreshTimer) {
      this.refreshTimer = setInterval(() => {
        this.refreshRuleCache().catch((err) =>
          logger.error(`Periodic rule cache refresh failed: ${err.message}`)
        );
      }, config.frm.ruleCacheIntervalMs);
    }
  }

  public static async refreshRuleCache(): Promise<void> {
    try {
      const res = await query(
        `SELECT rule_id, rule_code, rule_name, rule_type, entity_scope,
                condition_json, risk_score, action, priority, status, version,
                created_at, updated_at
         FROM frm_rule_master
         WHERE status = 'ACTIVE'
         ORDER BY priority ASC`
      );

      this.ruleCache = res.rows.map((row) => ({
        ruleId: parseInt(row.rule_id, 10),
        ruleCode: row.rule_code,
        ruleName: row.rule_name,
        ruleType: row.rule_type,
        entityScope: row.entity_scope,
        conditionJson: typeof row.condition_json === 'string' ? JSON.parse(row.condition_json) : row.condition_json,
        riskScore: row.risk_score,
        action: row.action,
        priority: row.priority,
        status: row.status,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      logger.info(`Rule engine loaded ${this.ruleCache.length} active rules into cache.`);
    } catch (err: any) {
      logger.warn(`Failed to refresh rule cache from DB: ${err.message}`);
    }
  }

  public static getCachedRules(): FrmRule[] {
    return [...this.ruleCache];
  }

  public static async evaluate(context: TransactionContext): Promise<RiskAssessment> {
    let totalScore = 0;
    const triggeredRules: string[] = [];
    let hardBlock = false;

    for (const rule of this.ruleCache) {
      let triggered = false;
      try {
        if (rule.ruleType === 'STATIC') {
          triggered = await StaticEvaluator.evaluate(context, rule);
        } else if (rule.ruleType === 'AGGREGATION') {
          triggered = await AggregationEvaluator.evaluate(context, rule);
        }
      } catch (err: any) {
        logger.warn(`Rule evaluation error [${rule.ruleCode}]: ${err.message}`);
      }

      if (triggered) {
        totalScore += rule.riskScore;
        triggeredRules.push(rule.ruleCode);
        logger.debug(`Rule triggered: ${rule.ruleCode} (+${rule.riskScore})`);

        if (rule.action === 'BLOCK') {
          hardBlock = true;
        }
      }
    }

    // Increment velocity counters AFTER evaluation (read-before-write pattern)
    await this.updateVelocityCounters(context);

    const decision = hardBlock ? 'BLOCK' : DecisionEngine.decide(totalScore);

    logger.info(
      `Screening finished | txn=${context.txnId} score=${totalScore} decision=${decision} rules=${triggeredRules.length}`
    );

    return {
      txnId: context.txnId,
      riskScore: totalScore,
      decision,
      triggeredRules,
      hardBlock,
    };
  }

  private static async updateVelocityCounters(ctx: TransactionContext): Promise<void> {
    for (const rule of this.ruleCache) {
      if (rule.ruleType !== 'AGGREGATION') continue;
      const cond = rule.conditionJson;
      if (!cond) continue;

      const entity = cond.entity;
      const window = cond.window;
      const metric = (cond.metric || 'COUNT').toUpperCase();
      const windowSeconds = VelocityService.toSeconds(window);

      if (!entity) continue;
      const entityValue = ctx.getFieldAsString(entity);
      if (!entityValue || !entityValue.trim()) continue;

      try {
        if (metric === 'COUNT') {
          await VelocityService.incrementCount(entity, entityValue, windowSeconds);
        } else if (metric === 'SUM') {
          await VelocityService.incrementSum(entity, entityValue, windowSeconds, ctx.amount);
        }
      } catch (err: any) {
        logger.warn(`Failed to update velocity counter for rule ${rule.ruleCode}: ${err.message}`);
      }
    }
  }
}

