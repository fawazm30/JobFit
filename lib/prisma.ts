/**
 * @file prisma.ts
 * @description Prisma client singleton for use across the Next.js app.
 * Reuses a single PrismaClient instance across hot reloads in development
 * to prevent exhausting database connections.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;