import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string;

  if (err instanceof AppError) {
    // Operational errors — safe to expose message
    if (!err.isOperational) {
      logger.error(`Operational-false error [${requestId}]: ${err.message}`, { stack: err.stack });
    } else {
      logger.warn(`AppError [${requestId}]: ${err.message}`);
    }

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        requestId,
      },
    });
  }

  // Unexpected / programming errors
  logger.error(`Unhandled error [${requestId}]: ${err.message}`, { stack: err.stack });

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500,
      requestId,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
}
