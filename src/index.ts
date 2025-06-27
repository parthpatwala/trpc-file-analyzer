import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import { publicProcedure, router } from './trpc';

config();

const appRouter = router({
  hello: publicProcedure.query(() => {
    return {
      message: 'hello world',
    };
  }),
});

export type AppRouter = typeof appRouter;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    onError({ path, error }) {
      console.error(`Error on tRPC path ${path}:`, error);
    },
  }),
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
