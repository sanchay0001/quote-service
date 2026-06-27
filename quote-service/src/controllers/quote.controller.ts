import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../services/quote.service';
import { createQuoteSchema, updateStatusSchema, paginationSchema } from '../models/quote.model';
import { ValidationError } from '../utils/errors';
import { z, ZodError } from 'zod/v4';

function parseValidation<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = z.prettifyError(err);
      throw new ValidationError(messages);
    }
    throw err;
  }
}

export const quoteController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseValidation(paginationSchema, req.query);
      const result = await quoteService.getAllQuotes(query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await quoteService.getQuoteById(req.params['id'] as string);
      res.json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = parseValidation(createQuoteSchema, req.body);
      const quote = await quoteService.createQuote(dto);
      res.status(201).json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  },

  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quoteService.analyzeQuote(req.params['id'] as string);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = parseValidation(updateStatusSchema, req.body);
      const quote = await quoteService.updateStatus(req.params['id'] as string, dto);
      res.json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  },
};
