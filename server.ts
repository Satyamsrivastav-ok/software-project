import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/index';
import { dbStore } from './server/db/database';
import { seedDemoData } from './server/seed/seedData';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Database & Seed demo data if first run
  await dbStore.init();
  await seedDemoData(false);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'DocPulse Doctor Appointment API',
      database: dbStore.isMongo ? 'MongoDB (Remote/Atlas)' : 'DocPulse High-Performance Engine'
    });
  });

  // Mount main API routes
  app.use('/api', apiRoutes);

  // Development: Vite Middleware / Production: Static Files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DocPulse Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[DocPulse Server] Fatal startup error:', err);
  process.exit(1);
});
