import express from 'express';
import quoteRoutes from './routes/quote.routes';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

// Core middleware
app.use(express.json());
app.use(requestIdMiddleware);
app.use(loggingMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/quotes', quoteRoutes);

// 404 and error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info(`Quote service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.MOCK_FASTAPI === 'true') {
    logger.warn('FastAPI is MOCKED — set MOCK_FASTAPI=false to use real service');
  }
});

export default app;
