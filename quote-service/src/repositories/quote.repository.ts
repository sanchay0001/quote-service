import prisma from '../utils/prisma';
import { CreateQuoteDTO, PaginationQuery } from '../models/quote.model';
import { DatabaseError } from '../utils/errors';

export const quoteRepository = {
  async findAll(query: PaginationQuery) {
    try {
      const { page, limit, search, status } = query;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (status) where.status = status;

      if (search) {
        where.OR = [
          { customer: { contains: search } },
          { project: { contains: search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.quoteRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_date: 'desc' },
          include: { analysis: true },
        }),
        prisma.quoteRequest.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      throw new DatabaseError();
    }
  },

  async findById(id: string) {
    try {
      return await prisma.quoteRequest.findUnique({
        where: { id },
        include: { analysis: true },
      });
    } catch {
      throw new DatabaseError();
    }
  },

  async create(data: CreateQuoteDTO) {
    try {
      return await prisma.quoteRequest.create({ data });
    } catch {
      throw new DatabaseError();
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      return await prisma.quoteRequest.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new DatabaseError();
    }
  },

  async upsertAnalysis(quoteId: string, result: { risk: string; confidence: number; missing_items: string[] }) {
    try {
      return await prisma.analysisResult.upsert({
        where: { quote_id: quoteId },
        create: {
          quote_id: quoteId,
          risk: result.risk,
          confidence: result.confidence,
          missing_items: JSON.stringify(result.missing_items),
        },
        update: {
          risk: result.risk,
          confidence: result.confidence,
          missing_items: JSON.stringify(result.missing_items),
          analyzed_at: new Date(),
        },
      });
    } catch {
      throw new DatabaseError();
    }
  },
};
