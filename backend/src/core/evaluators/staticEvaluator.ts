import { TransactionContext } from '../engine/TransactionContext';
import { FrmRule } from '../types';
import { BlacklistService } from '../../services/blacklistService';
import { logger } from '../../utils/logger';

export class StaticEvaluator {
  public static async evaluate(ctx: TransactionContext, rule: FrmRule): Promise<boolean> {
    const cond = rule.conditionJson;
    if (!cond || Object.keys(cond).length === 0) return false;

    try {
      const operator = cond.operator;

      // ── Blacklist Evaluation ──────────────────────────────────────────
      if (operator === 'IN_BLACKLIST') {
        const field = cond.field;
        const entityType = cond.entityType;
        if (!field || !entityType) {
          logger.warn(`Rule ${rule.ruleCode} has IN_BLACKLIST but missing field or entityType`);
          return false;
        }

        const entityValue = ctx.getFieldAsString(field);
        if (!entityValue || !entityValue.trim()) return false;

        return await BlacklistService.isBlacklisted(entityType, entityValue);
      }

      // ── Payment mode guard ───────────────────────────────────────────
      if (cond.paymentModeIn) {
        const modes = String(cond.paymentModeIn)
          .split(',')
          .map((m) => m.trim().toUpperCase());
        const actualMode = (ctx.paymentMode || '').toUpperCase();
        if (!modes.includes(actualMode)) return false;
      }

      // ── Extra flags (e.g. newCard) ────────────────────────────────────
      if (cond.extra === 'newCard') {
        if (!ctx.cardToken) return false;
      }

      // ── Field value extraction ────────────────────────────────────────
      const field = cond.field;
      const targetValue = cond.value != null ? String(cond.value) : '';
      if (!field) return false;

      const actualValue = ctx.getFieldAsString(field);
      if (actualValue == null) return false;

      return this.applyOperator(actualValue, operator, targetValue);
    } catch (err: any) {
      logger.warn(`StaticEvaluator error for rule ${rule.ruleCode}: ${err.message}`);
      return false;
    }
  }

  private static applyOperator(actual: string, operator?: string, threshold?: string): boolean {
    if (!operator) return false;
    const actualNum = parseFloat(actual);
    const threshNum = threshold ? parseFloat(threshold) : NaN;

    switch (operator) {
      case '>':
        return !isNaN(actualNum) && !isNaN(threshNum) && actualNum > threshNum;
      case '<':
        return !isNaN(actualNum) && !isNaN(threshNum) && actualNum < threshNum;
      case '>=':
        return !isNaN(actualNum) && !isNaN(threshNum) && actualNum >= threshNum;
      case '<=':
        return !isNaN(actualNum) && !isNaN(threshNum) && actualNum <= threshNum;
      case '==':
        return actual.toLowerCase() === (threshold || '').toLowerCase();
      case '!=':
        return actual.toLowerCase() !== (threshold || '').toLowerCase();
      case 'CONTAINS':
        return actual.toLowerCase().includes((threshold || '').toLowerCase());
      case 'CONTAINS_ANY':
        return (threshold || '')
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .some((v) => v && actual.toLowerCase().includes(v));
      case 'ENDS_WITH':
        return actual.toLowerCase().endsWith((threshold || '').toLowerCase());
      case 'IN':
        return (threshold || '')
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .some((v) => v === actual.toLowerCase());
      case 'IS_ROUND': {
        if (isNaN(actualNum)) return false;
        const minThreshold = threshNum || 0;
        if (actualNum < minThreshold) return false;
        return actualNum % 100 === 0;
      }
      default:
        logger.warn(`Unknown static operator: ${operator}`);
        return false;
    }
  }
}

