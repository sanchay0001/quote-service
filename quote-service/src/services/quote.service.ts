import { quoteRepository } from '../repositories/quote.repository';
import { fastApiService } from './fastapi.service';
import { CreateQuoteDTO, PaginationQuery, UpdateStatusDTO } from '../models/quote.model';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

interface RawAnalysis {
  missing_items: string;
  [key: string]: unknown;
}

function deserializeAnalysis(analysis: RawAnalysis | null) {
  if (!analysis) return null;
  return {
    ...analysis,
    missing_items: JSON.parse(analysis.missing_items) as string[],
  };
}

export const quoteService = {
  async getAllQuotes(query: PaginationQuery) {
    const result = await quoteRepository.findAll(query);
    return {
      ...result,
      data: result.data.map((q: { analysis: RawAnalysis | null; [key: string]: unknown }) => ({
        ...q,
        analysis: deserializeAnalysis(q.analysis),
      })),
    };
  },

  async getQuoteById(id: string) {
    const quote = await quoteRepository.findById(id);
    if (!quote) throw new NotFoundError('Quote', id);
    return {
      ...quote,
      analysis: deserializeAnalysis(quote.analysis as RawAnalysis | null),
    };
  },

  async createQuote(data: CreateQuoteDTO) {
    const quote = await quoteRepository.create(data);
    logger.info(`Quote created: ${quote.id}`);
    return quote;
  },

  async analyzeQuote(id: string) {
    const quote = await quoteRepository.findById(id);
    if (!quote) throw new NotFoundError('Quote', id);

    logger.info(`Triggering FastAPI analysis for quote ${id}`);
    const analysisResult = await fastApiService.analyze(id);

    const saved = await quoteRepository.upsertAnalysis(id, analysisResult);

    logger.info(`Analysis saved for quote ${id}, risk=${analysisResult.risk}`);

    return {
      quote,
      analysis: {
        ...saved,
        missing_items: JSON.parse(saved.missing_items) as string[],
      },
    };
  },

  async updateStatus(id: string, dto: UpdateStatusDTO) {
    const quote = await quoteRepository.findById(id);
    if (!quote) throw new NotFoundError('Quote', id);

    const updated = await quoteRepository.updateStatus(id, dto.status);
    logger.info(`Quote ${id} status updated to '${dto.status}'`);
    return updated;
  },
};
