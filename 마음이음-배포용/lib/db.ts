import { PrismaClient } from '@prisma/client';
import {databaseOptions} from './database-config';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient(databaseOptions());
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
