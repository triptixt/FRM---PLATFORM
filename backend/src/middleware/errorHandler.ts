import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Error handling request [${req.method} ${req.url}]: ${err.message}`, err.stack);

  if (err.name === 'ZodError') {
    const errorDetails = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json(ApiResponse.error(`Validation failed: ${errorDetails}`));
    return;
  }

  if (err.status) {
    res.status(err.status).json(ApiResponse.error(err.message));
    return;
  }

  res.status(500).json(ApiResponse.error(err.message || 'Internal Server Error'));
}

