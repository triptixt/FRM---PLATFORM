"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const migrations_1 = require("./config/migrations");
const ruleEngine_1 = require("./core/engine/ruleEngine");
const blacklistService_1 = require("./services/blacklistService");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const screeningRoutes_1 = __importDefault(require("./routes/screeningRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const debugRoutes_1 = __importDefault(require("./routes/debugRoutes"));
async function bootstrap() {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Request logger
    app.use((req, res, next) => {
        logger_1.logger.debug(`${req.method} ${req.url}`);
        next();
    });
    // Health checks
    app.get(['/actuator/health', '/health'], (req, res) => {
        res.json({ status: 'UP', service: 'frm-backend', timestamp: new Date().toISOString() });
    });
    // Public routes
    app.use('/auth', authRoutes_1.default);
    app.use('/debug', debugRoutes_1.default);
    // Screening routes (handles /frm/screen and /frm/health)
    app.use('/frm', screeningRoutes_1.default);
    // Protected Admin routes
    app.use('/admin', auth_1.authenticateJwt, adminRoutes_1.default);
    // Global Error Handler
    app.use(errorHandler_1.errorHandler);
    // Connect to DB & Redis, run migrations and warm up caches
    logger_1.logger.info('Starting PayYantra FRM Platform (Node.js engine)...');
    await (0, database_1.initDatabaseConnection)();
    await (0, migrations_1.runMigrations)();
    await (0, redis_1.initRedis)();
    await ruleEngine_1.RuleEngineService.init();
    await blacklistService_1.BlacklistService.refreshBlacklist();
    // Start HTTP Server
    app.listen(env_1.config.port, () => {
        logger_1.logger.info(`FRM Backend is listening on port ${env_1.config.port} (http://localhost:${env_1.config.port})`);
        logger_1.logger.info(`Health check: http://localhost:${env_1.config.port}/frm/health`);
        logger_1.logger.info(`Screening endpoint: POST http://localhost:${env_1.config.port}/frm/screen`);
    });
}
bootstrap().catch((err) => {
    logger_1.logger.error('Fatal initialization error:', err);
    process.exit(1);
});
