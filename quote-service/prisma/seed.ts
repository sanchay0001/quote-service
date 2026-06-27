/**
 * prisma/seed.ts
 * Run with: npx ts-node prisma/seed.ts
 * Seeds the database with sample quote requests.
 */

// In a real env after `prisma generate`:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// async function main() { ... }
// main().catch(console.error).finally(() => prisma.$disconnect());

const sampleQuotes = [
  { customer: 'ABC Corp', project: 'Office Renovation', status: 'New', estimated_value: 150000 },
  { customer: 'XYZ Ltd', project: 'Warehouse Construction', status: 'In Review', estimated_value: 500000 },
  { customer: 'Startup Inc', project: 'Server Room Setup', status: 'Needs Info', estimated_value: 75000 },
  { customer: 'MegaCorp', project: 'Factory Expansion', status: 'Completed', estimated_value: 2000000 },
];

console.log('Sample seed data:');
console.table(sampleQuotes);
console.log('\nTo seed: uncomment the Prisma code above after running `npx prisma generate`');
