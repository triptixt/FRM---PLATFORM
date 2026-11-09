import { Router, Request, Response } from 'express';
import { ScreeningService } from '../services/screeningService';
import { ApiResponse } from '../utils/apiResponse';
import { authenticateJwt } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.post('/screen', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const { txnId, merchantId, amount } = req.body;

  if (!txnId || !merchantId || amount == null) {
    res.status(400).json(ApiResponse.error('Missing required fields: txnId, merchantId, amount'));
    return;
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json(ApiResponse.error('amount must be a positive number'));
    return;
  }

  try {
    const result = await ScreeningService.screen(req.body);
    res.json(ApiResponse.ok(result));
  } catch (err: any) {
    logger.error(`Screening failure for txn ${txnId}: ${err.message}`);
    res.status(500).json(ApiResponse.error(`Screening execution error: ${err.message}`));
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json(ApiResponse.ok('FRM service is running'));
});

export default router;

