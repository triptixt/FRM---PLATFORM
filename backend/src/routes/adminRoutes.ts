import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse } from '../utils/apiResponse';
import { RuleEngineService } from '../core/engine/ruleEngine';
import { CaseService } from '../services/caseService';
import { BlacklistService } from '../services/blacklistService';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// 1. DASHBOARD
// ============================================================================

router.get('/dashboard/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const txnCountsRes = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE decision = 'ALLOW') AS allowed,
        COUNT(*) FILTER (WHERE decision = 'REVIEW') AS reviewed,
        COUNT(*) FILTER (WHERE decision = 'BLOCK') AS blocked
      FROM frm_transaction_log
    `);

    const caseCountsRes = await query(`
      SELECT
        COUNT(*) FILTER (WHERE case_status = 'OPEN') AS open_cases,
        COUNT(*) FILTER (WHERE case_status = 'REVIEWING') AS reviewing_cases,
        COUNT(*) FILTER (WHERE case_status = 'CLOSED') AS closed_cases
      FROM frm_case
    `);

    const txnCounts = txnCountsRes.rows[0];
    const caseCounts = caseCountsRes.rows[0];

    const totalTxns = parseInt(txnCounts.total || '0', 10);
    const allowed = parseInt(txnCounts.allowed || '0', 10);
    const reviewed = parseInt(txnCounts.reviewed || '0', 10);
    const blocked = parseInt(txnCounts.blocked || '0', 10);

    const openCases = parseInt(caseCounts.open_cases || '0', 10);
    const reviewingCases = parseInt(caseCounts.reviewing_cases || '0', 10);
    const closedCases = parseInt(caseCounts.closed_cases || '0', 10);

    const blockRate = totalTxns > 0 ? `${((blocked / totalTxns) * 100).toFixed(1)}%` : '0.0%';

    res.json(
      ApiResponse.ok({
        totalTransactions: totalTxns,
        allowed,
        reviewed,
        blocked,
        openCases,
        reviewingCases,
        closedCases,
        blockRate,
      })
    );
  } catch (err: any) {
    logger.error(`Error loading dashboard summary: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to load dashboard summary'));
  }
});

// ============================================================================
// 2. RULES
// ============================================================================

router.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT rule_id, rule_code, rule_name, rule_type, entity_scope,
             condition_json, risk_score, action, priority, status, version,
             created_at, updated_at
      FROM frm_rule_master
      ORDER BY priority ASC
    `);

    const rules = result.rows.map((row) => ({
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

    res.json(ApiResponse.ok(rules));
  } catch (err: any) {
    logger.error(`Error listing rules: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to fetch rules'));
  }
});

router.get('/rules/cache', (req: Request, res: Response) => {
  res.json(ApiResponse.ok(RuleEngineService.getCachedRules()));
});

router.get('/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT rule_id, rule_code, rule_name, rule_type, entity_scope,
              condition_json, risk_score, action, priority, status, version,
              created_at, updated_at
       FROM frm_rule_master WHERE rule_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Rule not found: ${req.params.id}`));
      return;
    }

    const row = result.rows[0];
    res.json(
      ApiResponse.ok({
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
      })
    );
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

router.put('/rules/:id', async (req: Request, res: Response): Promise<void> => {
  const { conditionJson, riskScore } = req.body;
  const ruleId = req.params.id;

  try {
    const existing = await query(`SELECT * FROM frm_rule_master WHERE rule_id = $1`, [ruleId]);
    if (existing.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Rule not found: ${ruleId}`));
      return;
    }

    const rule = existing.rows[0];
    const currentCond = typeof rule.condition_json === 'string' ? JSON.parse(rule.condition_json) : rule.condition_json;

    if (currentCond?.operator === 'IN_BLACKLIST') {
      res.status(400).json(ApiResponse.error('Blacklist rules cannot be edited. Manage entries via the Blacklist page.'));
      return;
    }

    if (riskScore != null && (riskScore < 0 || riskScore > 100)) {
      res.status(400).json(ApiResponse.error('Risk score must be between 0 and 100'));
      return;
    }

    const newCond = conditionJson ? JSON.stringify(conditionJson) : rule.condition_json;
    const newScore = riskScore != null ? parseInt(riskScore, 10) : rule.risk_score;

    const updateRes = await query(
      `UPDATE frm_rule_master
       SET condition_json = $1,
           risk_score = $2,
           version = version + 1,
           updated_at = NOW()
       WHERE rule_id = $3
       RETURNING *`,
      [newCond, newScore, ruleId]
    );

    // Immediate in-memory cache refresh
    await RuleEngineService.refreshRuleCache();

    const updated = updateRes.rows[0];
    res.json(
      ApiResponse.ok({
        ruleId: parseInt(updated.rule_id, 10),
        ruleCode: updated.rule_code,
        ruleName: updated.rule_name,
        ruleType: updated.rule_type,
        entityScope: updated.entity_scope,
        conditionJson: typeof updated.condition_json === 'string' ? JSON.parse(updated.condition_json) : updated.condition_json,
        riskScore: updated.risk_score,
        action: updated.action,
        priority: updated.priority,
        status: updated.status,
        version: updated.version,
        updatedAt: updated.updated_at,
      })
    );
  } catch (err: any) {
    logger.error(`Error updating rule ${ruleId}: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to update rule'));
  }
});

router.patch('/rules/:id/status', async (req: Request, res: Response): Promise<void> => {
  const statusParam = req.query.status as string;
  const status = (statusParam || req.body.status || 'ACTIVE').toUpperCase();
  const ruleId = req.params.id;

  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    res.status(400).json(ApiResponse.error("Status must be 'ACTIVE' or 'INACTIVE'"));
    return;
  }

  try {
    const updateRes = await query(
      `UPDATE frm_rule_master
       SET status = $1, updated_at = NOW()
       WHERE rule_id = $2
       RETURNING *`,
      [status, ruleId]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Rule not found: ${ruleId}`));
      return;
    }

    await RuleEngineService.refreshRuleCache();

    const updated = updateRes.rows[0];
    res.json(
      ApiResponse.ok({
        ruleId: parseInt(updated.rule_id, 10),
        ruleCode: updated.rule_code,
        status: updated.status,
      })
    );
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

// ============================================================================
// 3. TRANSACTIONS
// ============================================================================

router.get('/transactions', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt((req.query.page as string) || '0', 10);
  const size = parseInt((req.query.size as string) || '15', 10);
  const offset = page * size;

  const { txnId, merchantId, decision, paymentMode, dateFrom, dateTo } = req.query;

  try {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (txnId && String(txnId).trim()) {
      conditions.push(`txn_id ILIKE $${idx++}`);
      params.push(`%${String(txnId).trim()}%`);
    }

    if (merchantId && String(merchantId).trim()) {
      conditions.push(`merchant_id ILIKE $${idx++}`);
      params.push(`%${String(merchantId).trim()}%`);
    }

    if (decision && String(decision).trim()) {
      conditions.push(`decision = $${idx++}`);
      params.push(String(decision).trim().toUpperCase());
    }

    if (paymentMode && String(paymentMode).trim()) {
      conditions.push(`payment_mode = $${idx++}`);
      params.push(String(paymentMode).trim().toUpperCase());
    }

    if (dateFrom && String(dateFrom).trim()) {
      conditions.push(`received_at >= $${idx++}`);
      params.push(`${String(dateFrom).trim()} 00:00:00`);
    }

    if (dateTo && String(dateTo).trim()) {
      conditions.push(`received_at <= $${idx++}`);
      params.push(`${String(dateTo).trim()} 23:59:59`);
    }

    const whereClause = conditions.join(' AND ');

    // Count query
    const countRes = await query(`SELECT COUNT(*) FROM frm_transaction_log WHERE ${whereClause}`, params);
    const totalElements = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalElements / size);

    // Data query
    const dataParams = [...params, size, offset];
    const dataRes = await query(
      `SELECT txn_id, merchant_id, amount, currency, payment_mode, payer_mobile,
              payer_email, card_token, card_bin, card_last4, vpa, ip_address,
              device_id, risk_score, decision, triggered_rules, screening_ms, received_at
       FROM frm_transaction_log
       WHERE ${whereClause}
       ORDER BY received_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataParams
    );

    const content = dataRes.rows.map((row) => ({
      txnId: row.txn_id,
      merchantId: row.merchant_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      paymentMode: row.payment_mode,
      payerMobile: row.payer_mobile,
      payerEmail: row.payer_email,
      cardToken: row.card_token,
      cardBin: row.card_bin,
      cardLast4: row.card_last4,
      vpa: row.vpa,
      ipAddress: row.ip_address,
      deviceId: row.device_id,
      riskScore: row.risk_score,
      decision: row.decision,
      triggeredRules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules || [],
      screeningMs: row.screening_ms ? parseInt(row.screening_ms, 10) : null,
      receivedAt: row.received_at,
    }));

    res.json(
      ApiResponse.ok({
        content,
        totalElements,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      })
    );
  } catch (err: any) {
    logger.error(`Error listing transactions: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to list transactions'));
  }
});

router.get('/transactions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM frm_transaction_log WHERE txn_id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Transaction not found: ${req.params.id}`));
      return;
    }
    const row = result.rows[0];
    res.json(
      ApiResponse.ok({
        txnId: row.txn_id,
        merchantId: row.merchant_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        paymentMode: row.payment_mode,
        payerMobile: row.payer_mobile,
        payerEmail: row.payer_email,
        cardToken: row.card_token,
        cardBin: row.card_bin,
        cardLast4: row.card_last4,
        vpa: row.vpa,
        ipAddress: row.ip_address,
        deviceId: row.device_id,
        riskScore: row.risk_score,
        decision: row.decision,
        triggeredRules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules || [],
        screeningMs: row.screening_ms ? parseInt(row.screening_ms, 10) : null,
        receivedAt: row.received_at,
      })
    );
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

// ============================================================================
// 4. CASES
// ============================================================================

router.get('/cases', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt((req.query.page as string) || '0', 10);
  const size = parseInt((req.query.size as string) || '15', 10);
  const status = ((req.query.status as string) || 'OPEN').toUpperCase();
  const offset = page * size;

  try {
    const countRes = await query(`SELECT COUNT(*) FROM frm_case WHERE case_status = $1`, [status]);
    const totalElements = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalElements / size);

    const dataRes = await query(
      `SELECT case_id, case_ref, txn_id, merchant_id, risk_score, decision,
              triggered_rules, case_status, assigned_to, remarks, created_at, updated_at
       FROM frm_case
       WHERE case_status = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, size, offset]
    );

    const content = dataRes.rows.map((row) => ({
      caseId: parseInt(row.case_id, 10),
      caseRef: row.case_ref,
      txnId: row.txn_id,
      merchantId: row.merchant_id,
      riskScore: row.risk_score,
      decision: row.decision,
      triggeredRules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules || [],
      caseStatus: row.case_status,
      assignedTo: row.assigned_to,
      remarks: row.remarks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(
      ApiResponse.ok({
        content,
        totalElements,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      })
    );
  } catch (err: any) {
    logger.error(`Error querying cases: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to query cases'));
  }
});

router.get('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM frm_case WHERE case_id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Case not found: ${req.params.id}`));
      return;
    }
    const row = result.rows[0];
    res.json(
      ApiResponse.ok({
        caseId: parseInt(row.case_id, 10),
        caseRef: row.case_ref,
        txnId: row.txn_id,
        merchantId: row.merchant_id,
        riskScore: row.risk_score,
        decision: row.decision,
        triggeredRules: typeof row.triggered_rules === 'string' ? JSON.parse(row.triggered_rules) : row.triggered_rules || [],
        caseStatus: row.case_status,
        assignedTo: row.assigned_to,
        remarks: row.remarks,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

router.patch('/cases/:id', async (req: Request, res: Response): Promise<void> => {
  const { caseStatus, remarks, assignedTo } = req.body;
  const changedBy = req.user?.username || 'system';

  try {
    const updated = await CaseService.updateCaseStatus(
      req.params.id,
      caseStatus,
      remarks,
      assignedTo,
      changedBy
    );
    res.json(ApiResponse.okWithMessage('Case updated', updated));
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

router.get('/cases/:id/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, case_id, case_ref, changed_by, old_status, new_status,
              assigned_to, remarks, changed_at
       FROM frm_case_audit
       WHERE case_id = $1
       ORDER BY changed_at ASC`,
      [req.params.id]
    );
    res.json(ApiResponse.ok(result.rows));
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

// ============================================================================
// 5. BLACKLIST & WATCHLIST
// ============================================================================

router.get('/blacklist', async (req: Request, res: Response): Promise<void> => {
  const listType = ((req.query.listType as string) || 'BLACKLIST').toUpperCase();
  const entityType = req.query.entityType as string | undefined;
  const page = parseInt((req.query.page as string) || '0', 10);
  const size = parseInt((req.query.size as string) || '50', 10);
  const offset = page * size;

  try {
    let where = `WHERE (expiry_date IS NULL OR expiry_date > NOW()) AND list_type = $1`;
    const params: any[] = [listType];

    if (entityType && entityType.trim()) {
      where += ` AND entity_type = $2`;
      params.push(entityType.trim().toUpperCase());
      params.push(size);
      params.push(offset);
    } else {
      params.push(size);
      params.push(offset);
    }

    const limitIdx = params.length - 1;
    const offsetIdx = params.length;

    const sql = `
      SELECT id, entity_type, entity_value, list_type, risk_level, action,
             source, case_ref, remarks, expiry_date, created_by, created_at
      FROM frm_risk_entity
      ${where}
      ORDER BY created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await query(sql, params);
    res.json(ApiResponse.ok(result.rows));
  } catch (err: any) {
    logger.error(`Error querying blacklist: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to query blacklist entries'));
  }
});

router.get('/blacklist/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT entity_type, list_type, COUNT(*) as count
      FROM frm_risk_entity
      WHERE expiry_date IS NULL OR expiry_date > NOW()
      GROUP BY entity_type, list_type
    `);
    res.json(ApiResponse.ok(result.rows));
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

router.post('/blacklist', async (req: Request, res: Response): Promise<void> => {
  const { entityType, entityValue, listType, riskLevel, source, caseRef, remarks, expiryDays } = req.body;
  const createdBy = req.user?.username || 'system';

  if (!entityType || !entityValue || !entityValue.trim()) {
    res.status(400).json(ApiResponse.error('entityType and entityValue are required'));
    return;
  }

  const normalizedType = String(entityType).toUpperCase();
  const normalizedValue = String(entityValue).trim();
  const normalizedList = (listType || 'BLACKLIST').toUpperCase();
  const normalizedRisk = (riskLevel || 'HIGH').toUpperCase();
  const action = normalizedList === 'BLACKLIST' ? 'BLOCK' : 'MONITOR';

  try {
    // Check duplicate
    const duplicateRes = await query(
      `SELECT COUNT(*) FROM frm_risk_entity
       WHERE entity_type = $1 AND entity_value = $2 AND list_type = $3
       AND (expiry_date IS NULL OR expiry_date > NOW())`,
      [normalizedType, normalizedValue, normalizedList]
    );

    if (parseInt(duplicateRes.rows[0].count, 10) > 0) {
      res.status(400).json(ApiResponse.error(`${normalizedValue} is already registered in ${normalizedList}`));
      return;
    }

    const expiryDate = expiryDays ? new Date(Date.now() + parseInt(expiryDays, 10) * 86400000) : null;

    await query(
      `INSERT INTO frm_risk_entity
       (entity_type, entity_value, list_type, risk_level, action, source, case_ref, remarks, expiry_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        normalizedType,
        normalizedValue,
        normalizedList,
        normalizedRisk,
        action,
        source || 'INTERNAL',
        caseRef || null,
        remarks || null,
        expiryDate,
        createdBy,
      ]
    );

    // Refresh blacklist cache in Redis
    await BlacklistService.refreshBlacklist();

    logger.info(`Risk entity added: type=${normalizedType} value=${normalizedValue} list=${normalizedList} by=${createdBy}`);

    res.json(
      ApiResponse.okWithMessage('Entry added successfully', {
        entityType: normalizedType,
        entityValue: normalizedValue,
      })
    );
  } catch (err: any) {
    logger.error(`Error adding risk entity: ${err.message}`);
    res.status(500).json(ApiResponse.error('Failed to add risk entity'));
  }
});

router.delete('/blacklist/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`DELETE FROM frm_risk_entity WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json(ApiResponse.error(`Entry not found: ${req.params.id}`));
      return;
    }

    await BlacklistService.refreshBlacklist();
    res.json(ApiResponse.okWithMessage('Entry removed successfully', { id: req.params.id }));
  } catch (err: any) {
    res.status(500).json(ApiResponse.error(err.message));
  }
});

export default router;

