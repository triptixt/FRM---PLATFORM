"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreeningService = void 0;
const database_1 = require("../config/database");
const TransactionContext_1 = require("../core/engine/TransactionContext");
const ruleEngine_1 = require("../core/engine/ruleEngine");
const caseService_1 = require("./caseService");
const logger_1 = require("../utils/logger");
class ScreeningService {
    static async screen(req) {
        const startMs = Date.now();
        // 1. Build context
        const ctx = new TransactionContext_1.TransactionContext(req);
        // 2. Evaluate rules
        const assessment = await ruleEngine_1.RuleEngineService.evaluate(ctx);
        const screeningMs = Date.now() - startMs;
        // 3. Persist transaction log
        try {
            await (0, database_1.query)(`INSERT INTO frm_transaction_log
         (txn_id, merchant_id, amount, currency, payment_mode, payer_mobile,
          payer_email, card_token, card_bin, card_last4, vpa, ip_address,
          device_id, risk_score, decision, triggered_rules, screening_ms, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
         ON CONFLICT (txn_id) DO UPDATE
         SET risk_score = EXCLUDED.risk_score,
             decision = EXCLUDED.decision,
             triggered_rules = EXCLUDED.triggered_rules,
             screening_ms = EXCLUDED.screening_ms`, [
                req.txnId,
                req.merchantId,
                ctx.amount,
                ctx.currency,
                req.paymentMode || null,
                req.payerMobile || null,
                req.payerEmail || null,
                req.cardToken || null,
                req.cardBin || null,
                req.cardLast4 || null,
                req.vpa || null,
                req.ipAddress || null,
                req.deviceId || null,
                assessment.riskScore,
                assessment.decision,
                JSON.stringify(assessment.triggeredRules),
                screeningMs,
            ]);
        }
        catch (err) {
            logger_1.logger.error(`Failed to persist transaction log for ${req.txnId}: ${err.message}`);
        }
        // 4. Generate case if needed (REVIEW or BLOCK)
        let caseRef = null;
        if (assessment.decision === 'REVIEW' || assessment.decision === 'BLOCK') {
            caseRef = await caseService_1.CaseService.createCase(assessment, req.merchantId);
        }
        logger_1.logger.info(`Screening finalized | txn=${req.txnId} decision=${assessment.decision} score=${assessment.riskScore} ms=${screeningMs} caseRef=${caseRef || 'none'}`);
        // 5. Return result
        return {
            txnId: req.txnId,
            decision: assessment.decision,
            riskScore: assessment.riskScore,
            triggeredRules: assessment.triggeredRules,
            caseGenerated: caseRef !== null,
            caseRef,
            screeningMs,
        };
    }
}
exports.ScreeningService = ScreeningService;
