import {getConnectionString} from '@netlify/database';
import type {Prisma} from '@prisma/client';

export function databaseOptions(): Prisma.PrismaClientOptions {
  return process.env.NETLIFY === 'true' ? {datasourceUrl:getConnectionString()} : {};
}
