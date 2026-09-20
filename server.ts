import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { backOfficeRouter, hiveRouter } from './server/backoffice';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json());

  // CORS and Security Headers for API
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID, X-User-Role, X-User-ID, X-User-Name, X-User-Category');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BLUENILLA Hybrid POS & Enterprise Backend',
      version: '2.5.0',
      timestamp: new Date().toISOString()
    });
  });

  // Hive Central Platform API (Restricted to Hive Master / System Host)
  app.use('/api/hive', hiveRouter);

  // Tenant Back Office API (Scoped per Tenant with RBAC)
  app.use('/api/tenant/:tenantId/backoffice', backOfficeRouter);

  // Fallback for non-nested tenant route
  app.use('/api/backoffice', backOfficeRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BLUENILLA Enterprise Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[BLUENILLA Enterprise Server] Tenant Back Office API mounted at /api/tenant/:tenantId/backoffice`);
  });
}

startServer().catch((err) => {
  console.error('[BLUENILLA Enterprise Server] Failed to start server:', err);
  process.exit(1);
});
