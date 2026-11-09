import { query } from '../config/database';
import { ScreeningRequest, ScreeningResponse } from '../core/types';
import { TransactionContext } from '../core/engine/TransactionContext';
import { RuleEngineService } from '../core/engine/ruleEngine';
import { CaseService } from './caseService';
import { logger } from '../utils/logger';

export class ScreeningService {
  public static async screen(req: ScreeningRequest): Promise<ScreeningResponse> {
    const startMs = Date.now();

    // 1. Build context
    const ctx = new TransactionContext(req);

    // 2. Evaluate rules
    const assessment = await RuleEngineService.evaluate(ctx);
    const screeningMs = Date.now() - startMs;

    // 3. Persist transaction log
    try {
      await query(
        `INSERT INTO frm_transaction_log
         (txn_id, merchant_id, amount, currency, payment_mode, payer_mobile,
          payer_email, card_token, card_bin, card_last4, vpa, ip_address,
          device_id, risk_score, decision, triggered_rules, screening_ms, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
         ON CONFLICT (txn_id) DO UPDATE
         SET risk_score = EXCLUDED.risk_score,
             decision = EXCLUDED.decision,
             triggered_rules = EXCLUDED.triggered_rules,
             screening_ms = EXCLUDED.screening_ms`,
        [
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
        ]
      );
    } catch (err: any) {
      logger.error(`Failed to persist transaction log for ${req.txnId}: ${err.message}`);
    }

    // 4. Generate case if needed (REVIEW or BLOCK)
    let caseRef: string | null = null;
    if (assessment.decision === 'REVIEW' || assessment.decision === 'BLOCK') {
      caseRef = await CaseService.createCase(assessment, req.merchantId);
    }

    logger.info(
      `Screening finalized | txn=${req.txnId} decision=${assessment.decision} score=${assessment.riskScore} ms=${screeningMs} caseRef=${caseRef || 'none'}`
    );

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

