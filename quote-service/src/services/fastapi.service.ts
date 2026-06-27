import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { FastAPIError } from '../utils/errors';

interface AnalysisResponse {
  risk: string;
  missing_items: string[];
  confidence: number;
}

// Mock data for when FastAPI is unavailable and MOCK_FASTAPI=true
function getMockAnalysis(quoteId: string): AnalysisResponse {
  const risks = ['Low', 'Medium', 'High'];
  const risk = risks[Math.floor(Math.random() * risks.length)];
  return {
    risk,
    missing_items: ['Structural drawings', 'Load requirements', 'Site survey'].slice(
      0,
      Math.floor(Math.random() * 3)
    ),
    confidence: Math.floor(Math.random() * 30) + 70,
  };
}

export const fastApiService = {
  async analyze(quoteId: string): Promise<AnalysisResponse> {
    // Use mock if MOCK_FASTAPI env is set (useful during development/testing)
    if (process.env.MOCK_FASTAPI === 'true') {
      logger.info(`[MOCK] FastAPI analyze called for quote ${quoteId}`);
      return getMockAnalysis(quoteId);
    }

    const url = `${process.env.FASTAPI_URL}/analyze`;

    try {
      const response = await axios.post<AnalysisResponse>(
        url,
        { quote_id: quoteId },
        { timeout: 10000 } // 10 second timeout; long-running should be async (Q2)
      );

      // Validate response shape
      const { risk, missing_items, confidence } = response.data;
      if (
        typeof risk !== 'string' ||
        !Array.isArray(missing_items) ||
        typeof confidence !== 'number'
      ) {
        logger.error('FastAPI returned unexpected JSON shape', { data: response.data });
        throw new FastAPIError('FastAPI returned invalid response format');
      }

      return { risk, missing_items, confidence };
    } catch (err) {
      if (err instanceof FastAPIError) throw err;

      const axiosErr = err as AxiosError;

      if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ENOTFOUND') {
        logger.error(`FastAPI service unreachable at ${url}`);
        throw new FastAPIError('FastAPI service is unreachable');
      }

      if (axiosErr.code === 'ETIMEDOUT' || axiosErr.code === 'ECONNABORTED') {
        logger.error(`FastAPI request timed out for quote ${quoteId}`);
        throw new FastAPIError('FastAPI service timed out');
      }

      if (axiosErr.response?.data && typeof axiosErr.response.data !== 'object') {
        logger.error('FastAPI returned invalid JSON', { raw: axiosErr.response.data });
        throw new FastAPIError('FastAPI returned invalid JSON');
      }

      logger.error('Unexpected FastAPI error', { message: axiosErr.message });
      throw new FastAPIError();
    }
  },
};
