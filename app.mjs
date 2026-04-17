import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import postRouter from './routers/postRouter.mjs';
import authRouter from './routers/authRouter.mjs';
import commentRouter from './routers/commentRouter.mjs';
import categoryRouter from './routers/categoryRouter.mjs';
import likeRouter from './routers/likeRouter.mjs';

const app = express();
const port = 4000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/posts', postRouter);
app.use('/auth', authRouter);
app.use('/comments', commentRouter);
app.use('/categories', categoryRouter);
app.use('/likes', likeRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
  });
}

export default app;
