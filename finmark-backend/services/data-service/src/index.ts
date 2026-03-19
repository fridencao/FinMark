import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import { authRouter, scenarioRouter, atomRouter, userRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { checkDatabaseHealth } from './config/database.js';

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  if (dbHealthy) {
    res.json({ status: 'ok', service: 'data-service', database: 'connected' });
  } else {
    res.status(503).json({ status: 'error', service: 'data-service', database: 'disconnected' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/scenarios', scenarioRouter);
app.use('/api/atoms', atomRouter);
app.use('/api/users', userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Data Service running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
