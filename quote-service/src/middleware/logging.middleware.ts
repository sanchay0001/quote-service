import morgan from 'morgan';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';

// Custom token for request ID
morgan.token('request-id', (req: Request) => req.headers['x-request-id'] as string || '-');

const morganFormat = ':request-id :method :url :status :res[content-length] - :response-time ms';

export const loggingMiddleware = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    },
  },
  skip: (_req: Request, res: Response) => {
    // In production, skip logging successful health checks
    return process.env.NODE_ENV === 'production' && res.statusCode < 400;
  },
});
