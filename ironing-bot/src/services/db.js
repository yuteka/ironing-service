const { PrismaClient } = require('@prisma/client');

const fallbackDbUrl = "postgresql://postgres.gblktnmhkslpiirnkifl:MyIroningPass2026!@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const activeDbUrl = (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) 
  ? process.env.DATABASE_URL 
  : fallbackDbUrl;

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl
      }
    }
  });
};

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
