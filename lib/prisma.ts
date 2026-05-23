import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  // Avoid initializing the adapter during the Next.js build phase
  // if environment variables are missing or during static analysis.
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' || 
    (!connectionString && process.env.NODE_ENV === 'production');

  if (!connectionString || isBuildTime) {
    // Return a standard client during build time if no URL is present.
    return new PrismaClient();
  }

  try {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool as any);
    return new PrismaClient({ adapter } as any);
  } catch (error) {
    console.error('Failed to initialize Prisma adapter:', error);
    return new PrismaClient();
  }
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;