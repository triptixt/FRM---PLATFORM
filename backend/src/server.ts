import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { initDatabaseConnection } from './config/database';
import { initRedis } from './config/redis';
import { runMigrations } from './config/migrations';
import { RuleEngineService } from './core/engine/ruleEngine';
import { BlacklistService } from './services/blacklistService';
import { authenticateJwt } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/authRoutes';
import screeningRoutes from './routes/screeningRoutes';
import adminRoutes from './routes/adminRoutes';
import debugRoutes from './routes/debugRoutes';

async function bootstrap() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });

  // Health checks
  app.get(['/actuator/health', '/health'], (req, res) => {
    res.json({ status: 'UP', service: 'frm-backend', timestamp: new Date().toISOString() });
  });

  // Public routes
  app.use('/auth', authRoutes);
  app.use('/debug', debugRoutes);

  // Screening routes (handles /frm/screen and /frm/health)
  app.use('/frm', screeningRoutes);

  // Protected Admin routes
  app.use('/admin', authenticateJwt, adminRoutes);

  // Global Error Handler
  app.use(errorHandler);

  // Connect to DB & Redis, run migrations and warm up caches
  logger.info('Starting PayYantra FRM Platform (Node.js engine)...');
  await initDatabaseConnection();
  await runMigrations();
  await initRedis();
  await RuleEngineService.init();
  await BlacklistService.refreshBlacklist();

  // Start HTTP Server
  app.listen(config.port, () => {
    logger.info(`FRM Backend is listening on port ${config.port} (http://localhost:${config.port})`);
    logger.info(`Health check: http://localhost:${config.port}/frm/health`);
    logger.info(`Screening endpoint: POST http://localhost:${config.port}/frm/screen`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});

