"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregationEvaluator = void 0;
const velocityService_1 = require("../../services/velocityService");
const logger_1 = require("../../utils/logger");
class AggregationEvaluator {
    static async evaluate(ctx, rule) {
        const cond = rule.conditionJson;
        if (!cond || Object.keys(cond).length === 0)
            return false;
        try {
            const entity = cond.entity;
            const window = cond.window;
            const metric = (cond.metric || 'COUNT').toUpperCase();
            const operator = cond.operator;
            const threshold = parseFloat(String(cond.threshold));
            const windowSeconds = velocityService_1.VelocityService.toSeconds(window);
            if (!entity)
                return false;
            const entityValue = ctx.getFieldAsString(entity);
            if (!entityValue || !entityValue.trim()) {
                return false;
            }
            let currentValue = 0;
            if (metric === 'COUNT') {
                currentValue = await velocityService_1.VelocityService.getCount(entity, entityValue, windowSeconds);
            }
            else if (metric === 'SUM') {
                currentValue = await velocityService_1.VelocityService.getSum(entity, entityValue, windowSeconds);
            }
            else {
                logger_1.logger.warn(`Unknown aggregation metric: ${metric}`);
                return false;
            }
            // -1 signals Redis was unavailable and failOpen=true -> skip
            if (currentValue === -1)
                return false;
            return this.applyOperator(currentValue, operator, threshold);
        }
        catch (err) {
            logger_1.logger.warn(`AggregationEvaluator error for rule ${rule.ruleCode}: ${err.message}`);
            return false;
        }
    }
    static applyOperator(current, operator, threshold) {
        if (threshold == null || isNaN(threshold) || !operator)
            return false;
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
exports.AggregationEvaluator = AggregationEvaluator;
