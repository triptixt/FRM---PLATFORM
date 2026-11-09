"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
async function runMigrations() {
    try {
        logger_1.logger.info('Checking database schema status...');
        // 1. Create tables if not exist
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_rule_master (
        rule_id       BIGSERIAL PRIMARY KEY,
        rule_code     VARCHAR(60)  NOT NULL UNIQUE,
        rule_name     VARCHAR(255) NOT NULL,
        rule_type     VARCHAR(20)  NOT NULL CHECK (rule_type IN ('STATIC','AGGREGATION')),
        entity_scope  VARCHAR(30)  NOT NULL,
        condition_json JSONB        NOT NULL,
        risk_score    INT          NOT NULL DEFAULT 0,
        action        VARCHAR(10)  NOT NULL CHECK (action IN ('SCORE','BLOCK')),
        priority      INT          NOT NULL DEFAULT 100,
        status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
        version       INT          NOT NULL DEFAULT 1,
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_risk_entity (
        id            BIGSERIAL    PRIMARY KEY,
        entity_type   VARCHAR(30)  NOT NULL,
        entity_value  VARCHAR(255) NOT NULL,
        list_type     VARCHAR(15)  NOT NULL CHECK (list_type IN ('BLACKLIST','WATCHLIST')),
        risk_level    VARCHAR(10)  NOT NULL CHECK (risk_level IN ('HIGH','MEDIUM','LOW')),
        action        VARCHAR(10)  NOT NULL CHECK (action IN ('BLOCK','MONITOR')),
        source        VARCHAR(20)  NOT NULL DEFAULT 'INTERNAL',
        case_ref      VARCHAR(50),
        expiry_date   TIMESTAMP,
        remarks       TEXT,
        created_by    VARCHAR(50)  NOT NULL DEFAULT 'system',
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_transaction_log (
        txn_id          VARCHAR(100) PRIMARY KEY,
        merchant_id     VARCHAR(50)  NOT NULL,
        amount          NUMERIC(15,2) NOT NULL,
        currency        VARCHAR(5)   NOT NULL DEFAULT 'INR',
        payment_mode    VARCHAR(20),
        payer_mobile    VARCHAR(20),
        payer_email     VARCHAR(150),
        card_token      VARCHAR(100),
        card_bin        VARCHAR(10),
        card_last4      VARCHAR(4),
        vpa             VARCHAR(100),
        ip_address      VARCHAR(50),
        device_id       VARCHAR(100),
        risk_score      INT          NOT NULL DEFAULT 0,
        decision        VARCHAR(15)  NOT NULL,
        triggered_rules JSONB,
        screening_ms    BIGINT,
        received_at     TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_case (
        case_id         BIGSERIAL    PRIMARY KEY,
        case_ref        VARCHAR(30)  NOT NULL UNIQUE,
        txn_id          VARCHAR(100) NOT NULL,
        merchant_id     VARCHAR(50),
        risk_score      INT          NOT NULL,
        decision        VARCHAR(15)  NOT NULL,
        triggered_rules JSONB,
        case_status     VARCHAR(20)  NOT NULL DEFAULT 'OPEN' CHECK (case_status IN ('OPEN','REVIEWING','CLOSED')),
        assigned_to     VARCHAR(100),
        remarks         TEXT,
        created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_case_audit (
        id          BIGSERIAL    PRIMARY KEY,
        case_id     BIGINT       NOT NULL,
        case_ref    VARCHAR(30),
        changed_by  VARCHAR(100) NOT NULL DEFAULT 'system',
        old_status  VARCHAR(20),
        new_status  VARCHAR(20),
        assigned_to VARCHAR(100),
        remarks     TEXT,
        changed_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_decision_config (
        id              BIGSERIAL PRIMARY KEY,
        approve_below   INT NOT NULL DEFAULT 40,
        review_below    INT NOT NULL DEFAULT 70,
        block_from      INT NOT NULL DEFAULT 70,
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS frm_admin_user (
        user_id     BIGSERIAL    PRIMARY KEY,
        username    VARCHAR(60)  NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        full_name   VARCHAR(100),
        role        VARCHAR(20)  NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('ADMIN','REVIEWER','VIEWER')),
        status      VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
        // Create Indexes
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_rule_status ON frm_rule_master(status);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_risk_entity_lookup ON frm_risk_entity(entity_type, entity_value);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_risk_entity_expiry ON frm_risk_entity(expiry_date);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_txn_merchant ON frm_transaction_log(merchant_id);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_txn_decision ON frm_transaction_log(decision);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_txn_received ON frm_transaction_log(received_at DESC);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_case_status ON frm_case(case_status);`);
        await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_case_audit_case ON frm_case_audit(case_id);`);
        // Check if admin user exists; if not, seed default admin
        const adminCheck = await (0, database_1.query)(`SELECT COUNT(*) FROM frm_admin_user WHERE username = 'admin'`);
        if (parseInt(adminCheck.rows[0].count, 10) === 0) {
            // password is Admin@123 BCrypt
            await (0, database_1.query)(`
        INSERT INTO frm_admin_user (username, password, full_name, role)
        VALUES (
          'admin',
          '$2a$10$8LkhvxlovtrMe4wJ.BYzCeF75WNYYL0GGCtXK7DCdVMdKjsUg1jni',
          'FRM Administrator',
          'ADMIN'
        );
      `);
            logger_1.logger.info('Default admin user seeded: admin / Admin@123');
        }
        // Check if decision config exists; if not, seed default
        const configCheck = await (0, database_1.query)(`SELECT COUNT(*) FROM frm_decision_config`);
        if (parseInt(configCheck.rows[0].count, 10) === 0) {
            await (0, database_1.query)(`INSERT INTO frm_decision_config (approve_below, review_below, block_from) VALUES (40, 70, 70);`);
        }
        // Check if rules exist; if not, seed the 18 Phase 1 rules
        const rulesCheck = await (0, database_1.query)(`SELECT COUNT(*) FROM frm_rule_master`);
        if (parseInt(rulesCheck.rows[0].count, 10) === 0) {
            logger_1.logger.info('Seeding 18 Phase 1 fraud screening rules...');
            const rules = [
                // SECTION 1: BLACKLIST RULES
                ['BL_MOBILE', 'Payer mobile number in blacklist', 'STATIC', 'PAYER', '{"field":"payerMobile","operator":"IN_BLACKLIST","entityType":"MOBILE"}', 100, 'BLOCK', 10],
                ['BL_CARD_TOKEN', 'Card token in blacklist', 'STATIC', 'PAYER', '{"field":"cardToken","operator":"IN_BLACKLIST","entityType":"CARD_TOKEN"}', 100, 'BLOCK', 11],
                ['BL_IP', 'IP address in blacklist', 'STATIC', 'DEVICE', '{"field":"ipAddress","operator":"IN_BLACKLIST","entityType":"IP"}', 100, 'BLOCK', 12],
                ['BL_DEVICE', 'Device fingerprint in blacklist', 'STATIC', 'DEVICE', '{"field":"deviceId","operator":"IN_BLACKLIST","entityType":"DEVICE"}', 100, 'BLOCK', 13],
                // SECTION 2: STATIC RULES
                ['TXN_HIGH_VALUE', 'High value transaction — payer fraud signal', 'STATIC', 'TXN', '{"field":"amount","operator":">","value":"50000"}', 40, 'SCORE', 20],
                ['TXN_MICRO_AMOUNT_CARD', 'Micro amount on card — card testing pattern', 'STATIC', 'TXN', '{"field":"amount","operator":"<","value":"10","paymentModeIn":"CARD"}', 50, 'SCORE', 21],
                ['TXN_SUSPICIOUS_AMOUNT', 'Suspicious amount pattern — fraud evasion', 'STATIC', 'TXN', '{"field":"amount","operator":"ENDS_WITH","value":"999"}', 25, 'SCORE', 22],
                ['PAYER_DISPOSABLE_EMAIL', 'Payer using disposable or temporary email domain', 'STATIC', 'PAYER', '{"field":"payerEmail","operator":"CONTAINS_ANY","value":"tempmail.com,mailinator.com,guerrillamail.com,throwam.com,yopmail.com,sharklasers.com,trashmail.com"}', 30, 'SCORE', 23],
                ['CARD_FIRST_USE_HIGH_VALUE', 'First seen card token with high transaction value', 'STATIC', 'TXN', '{"field":"amount","operator":">","value":"25000","extra":"newCard"}', 35, 'SCORE', 24],
                ['TXN_BNPL_EMI_HIGH_VALUE', 'High value transaction on BNPL or EMI payment mode', 'STATIC', 'TXN', '{"field":"amount","operator":">","value":"100000","paymentModeIn":"BNPL,EMI"}', 35, 'SCORE', 25],
                ['TXN_ROUND_AMOUNT', 'Suspiciously round transaction amount', 'STATIC', 'TXN', '{"field":"amount","operator":"IS_ROUND","value":"10000"}', 20, 'SCORE', 26],
                // SECTION 3: AGGREGATION RULES
                ['PAYER_MOBILE_VELOCITY', 'Velocity check — transactions per mobile number', 'AGGREGATION', 'PAYER', '{"entity":"payerMobile","window":"5m","metric":"COUNT","operator":">","threshold":"5"}', 60, 'SCORE', 30],
                ['NETWORK_IP_VELOCITY', 'Velocity check — transactions per IP address', 'AGGREGATION', 'DEVICE', '{"entity":"ipAddress","window":"5m","metric":"COUNT","operator":">","threshold":"20"}', 75, 'BLOCK', 31],
                ['DEVICE_VELOCITY', 'Velocity check — transactions per device', 'AGGREGATION', 'DEVICE', '{"entity":"deviceId","window":"10m","metric":"COUNT","operator":">","threshold":"10"}', 55, 'SCORE', 32],
                ['PAYER_CARD_VELOCITY', 'Velocity check — transactions per card token', 'AGGREGATION', 'PAYER', '{"entity":"cardToken","window":"10m","metric":"COUNT","operator":">","threshold":"5"}', 65, 'SCORE', 33],
                ['MERCHANT_TXN_VELOCITY', 'Velocity check — transactions per merchant', 'AGGREGATION', 'MERCHANT', '{"entity":"merchantId","window":"1m","metric":"COUNT","operator":">","threshold":"500"}', 50, 'SCORE', 34],
                ['PAYER_MOBILE_AMOUNT_LIMIT', 'Cumulative amount limit — per mobile number', 'AGGREGATION', 'PAYER', '{"entity":"payerMobile","window":"1h","metric":"SUM","field":"amount","operator":">","threshold":"100000"}', 65, 'SCORE', 35],
                ['PAYER_CARD_AMOUNT_LIMIT', 'Cumulative amount limit — per card token', 'AGGREGATION', 'PAYER', '{"entity":"cardToken","window":"1h","metric":"SUM","field":"amount","operator":">","threshold":"50000"}', 55, 'SCORE', 36],
                ['DEVICE_AMOUNT_LIMIT', 'Cumulative amount limit — per device', 'AGGREGATION', 'DEVICE', '{"entity":"deviceId","window":"30m","metric":"SUM","field":"amount","operator":">","threshold":"25000"}', 45, 'SCORE', 37],
            ];
            for (const r of rules) {
                await (0, database_1.query)(`
          INSERT INTO frm_rule_master (rule_code, rule_name, rule_type, entity_scope, condition_json, risk_score, action, priority, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
          ON CONFLICT (rule_code) DO NOTHING;
        `, r);
            }
            logger_1.logger.info('18 Phase 1 rules seeded successfully.');
        }
        logger_1.logger.info('Database schema verified.');
    }
    catch (err) {
        logger_1.logger.warn(`Database migration skipped or deferred: ${err.message}`);
    }
}
