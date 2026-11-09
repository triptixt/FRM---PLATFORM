import { TransactionContext } from '../engine/TransactionContext';
import { FrmRule } from '../types';
import { VelocityService } from '../../services/velocityService';
import { logger } from '../../utils/logger';

export class AggregationEvaluator {
  public static async evaluate(ctx: TransactionContext, rule: FrmRule): Promise<boolean> {
    const cond = rule.conditionJson;
    if (!cond || Object.keys(cond).length === 0) return false;

    try {
      const entity = cond.entity;
      const window = cond.window;
      const metric = (cond.metric || 'COUNT').toUpperCase();
      const operator = cond.operator;
      const threshold = parseFloat(String(cond.threshold));
      const windowSeconds = VelocityService.toSeconds(window);

      if (!entity) return false;

      const entityValue = ctx.getFieldAsString(entity);
      if (!entityValue || !entityValue.trim()) {
        return false;
      }

      let currentValue = 0;
      if (metric === 'COUNT') {
        currentValue = await VelocityService.getCount(entity, entityValue, windowSeconds);
      } else if (metric === 'SUM') {
        currentValue = await VelocityService.getSum(entity, entityValue, windowSeconds);
      } else {
        logger.warn(`Unknown aggregation metric: ${metric}`);
        return false;
      }

      // -1 signals Redis was unavailable and failOpen=true -> skip
      if (currentValue === -1) return false;

      return this.applyOperator(currentValue, operator, threshold);
    } catch (err: any) {
      logger.warn(`AggregationEvaluator error for rule ${rule.ruleCode}: ${err.message}`);
      return false;
    }
  }

  private static applyOperator(current: number, operator?: string, threshold?: number): boolean {
    if (threshold == null || isNaN(threshold) || !operator) return false;

    switch (operator) {
      case '>':
        return current > threshold;
      case '>=':
        return current >= threshold;
      case '<':
        return current < threshold;
      case '<=':
        return current <= threshold;
      case '==':
        return current === threshold;
      default:
        return false;
    }
  }
}

