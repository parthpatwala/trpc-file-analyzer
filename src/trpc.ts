import { initTRPC } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Request, Response } from 'express';

interface CustomContext {
  req: Request;
  res: Response;
}
// created for each request
export const createContext = ({ req, res }: CreateExpressContextOptions): CustomContext => {
  return { req, res };
}; // no context
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
