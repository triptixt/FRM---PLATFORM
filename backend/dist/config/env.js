"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '8081', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'frm_user',
        password: process.env.DB_PASSWORD || 'frm_pass123',
        database: process.env.DB_NAME || 'frm_db',
        fallbackPort: parseInt(process.env.DB_FALLBACK_PORT || '5432', 10),
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'frm:',
        failOpen: process.env.REDIS_FAIL_OPEN !== 'false',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'frm-super-secret-jwt-key-change-this-in-production-2026',
        expiresIn: process.env.JWT_EXPIRY_MS ? Math.floor(parseInt(process.env.JWT_EXPIRY_MS, 10) / 1000) : 86400,
    },
    frm: {
        approveBelow: parseInt(process.env.APPROVE_BELOW || '40', 10),
        reviewBelow: parseInt(process.env.REVIEW_BELOW || '70', 10),
        blockFrom: parseInt(process.env.BLOCK_FROM || '70', 10),
        ruleCacheIntervalMs: parseInt(process.env.RULE_CACHE_INTERVAL_MS || '60000', 10),
    },
};
