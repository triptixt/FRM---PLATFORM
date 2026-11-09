"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngineService = void 0;
const database_1 = require("../../config/database");
const staticEvaluator_1 = require("../evaluators/staticEvaluator");
const aggregationEvaluator_1 = require("../evaluators/aggregationEvaluator");
const decisionEngine_1 = require("./decisionEngine");
const velocityService_1 = require("../../services/velocityService");
const logger_1 = require("../../utils/logger");
const env_1 = require("../../config/env");
class RuleEngineService {
    static ruleCache = [];
    static refreshTimer = null;
    static async init() {
        await this.refreshRuleCache();
        if (!this.refreshTimer) {
            this.refreshTimer = setInterval(() => {
                this.refreshRuleCache().catch((err) => logger_1.logger.error(`Periodic rule cache refresh failed: ${err.message}`));
            }, env_1.config.frm.ruleCacheIntervalMs);
        }
    }
    static async refreshRuleCache() {
        try {
            const res = await (0, database_1.query)(`SELECT rule_id, rule_code, rule_name, rule_type, entity_scope,
                condition_json, risk_score, action, priority, status, version,
                created_at, updated_at
         FROM frm_rule_master
         WHERE status = 'ACTIVE'
         ORDER BY priority ASC`);
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
            logger_1.logger.info(`Rule engine loaded ${this.ruleCache.length} active rules into cache.`);
        }
        catch (err) {
            logger_1.logger.warn(`Failed to refresh rule cache from DB: ${err.message}`);
        }
    }
    static getCachedRules() {
        return [...this.ruleCache];
    }
    static async evaluate(context) {
        let totalScore = 0;
        const triggeredRules = [];
        let hardBlock = false;
        for (const rule of this.ruleCache) {
            let triggered = false;
            try {
                if (rule.ruleType === 'STATIC') {
                    triggered = await staticEvaluator_1.StaticEvaluator.evaluate(context, rule);
                }
                else if (rule.ruleType === 'AGGREGATION') {
                    triggered = await aggregationEvaluator_1.AggregationEvaluator.evaluate(context, rule);
                }
            }
            catch (err) {
                logger_1.logger.warn(`Rule evaluation error [${rule.ruleCode}]: ${err.message}`);
            }
            if (triggered) {
                totalScore += rule.riskScore;
                triggeredRules.push(rule.ruleCode);
                logger_1.logger.debug(`Rule triggered: ${rule.ruleCode} (+${rule.riskScore})`);
                if (rule.action === 'BLOCK') {
                    hardBlock = true;
                }
            }
        }
        // Increment velocity counters AFTER evaluation (read-before-write pattern)
        await this.updateVelocityCounters(context);
        const decision = hardBlock ? 'BLOCK' : decisionEngine_1.DecisionEngine.decide(totalScore);
        logger_1.logger.info(`Screening finished | txn=${context.txnId} score=${totalScore} decision=${decision} rules=${triggeredRules.length}`);
        return {
            txnId: context.txnId,
            riskScore: totalScore,
            decision,
            triggeredRules,
            hardBlock,
        };
    }
    static async updateVelocityCounters(ctx) {
        for (const rule of this.ruleCache) {
            if (rule.ruleType !== 'AGGREGATION')
                continue;
            const cond = rule.conditionJson;
            if (!cond)
                continue;
            const entity = cond.entity;
            const window = cond.window;
            const metric = (cond.metric || 'COUNT').toUpperCase();
            const windowSeconds = velocityService_1.VelocityService.toSeconds(window);
            if (!entity)
                continue;
            const entityValue = ctx.getFieldAsString(entity);
            if (!entityValue || !entityValue.trim())
                continue;
            try {
                if (metric === 'COUNT') {
                    await velocityService_1.VelocityService.incrementCount(entity, entityValue, windowSeconds);
                }
                else if (metric === 'SUM') {
                    await velocityService_1.VelocityService.incrementSum(entity, entityValue, windowSeconds, ctx.amount);
                }
            }
            catch (err) {
                logger_1.logger.warn(`Failed to update velocity counter for rule ${rule.ruleCode}: ${err.message}`);
            }
        }
    }
}
exports.RuleEngineService = RuleEngineService;
