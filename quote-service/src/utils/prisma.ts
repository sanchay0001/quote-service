// NOTE: Run `npx prisma generate` once before starting the server.
// This generates the typed PrismaClient from prisma/schema.prisma.
//
// This singleton pattern prevents multiple PrismaClient instances
// during hot-reload in development (common Next.js / ts-node gotcha).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

type PrismaClientType = InstanceType<typeof PrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined;
}

const prisma: PrismaClientType =
  global.__prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
