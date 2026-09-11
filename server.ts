import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/auth.js';
import apiRoutes from './server/routes.js';
import { UPLOADS_DIR } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with generous limits for JSON payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global Auth Middleware (populates req.user if session token is provided)
  app.use(authMiddleware);

  // Serve uploads directory safely
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', apiRoutes);

  // Vite middleware for development or Static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teacher Resource Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
