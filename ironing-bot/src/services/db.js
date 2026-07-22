const { PrismaClient } = require('@prisma/client');

const fallbackDbUrl = "postgresql://postgres.gblktnmhkslpiirnkifl:MyIroningPass2026!@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || fallbackDbUrl
    }
  }
});

module.exports = prisma;
