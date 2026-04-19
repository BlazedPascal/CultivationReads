import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import novelsRouter from './routes/novels.js';
import chaptersRouter from './routes/chapters.js';
import searchRouter from './routes/search.js';
import queueRouter from './routes/queue.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api/novels', novelsRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/search', searchRouter);
app.use('/api/queue', queueRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Serve built frontend in production
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CultivationReads API running on port ${PORT}`);
});
