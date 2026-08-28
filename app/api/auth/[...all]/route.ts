import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { ensureDbTables } from '@/db';

const handlers = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  await ensureDbTables();
  return handlers.GET(req);
};

export const POST = async (req: Request) => {
  await ensureDbTables();
  return handlers.POST(req);
};
