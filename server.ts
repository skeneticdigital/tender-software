import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth.js';
import dashboardRoutes from './server/routes/dashboard.js';
import tendersRoutes from './server/routes/tenders.js';
import emdRoutes from './server/routes/emd.js';
import projectsRoutes from './server/routes/projects.js';
import materialsRoutes from './server/routes/materials.js';
import billingRoutes from './server/routes/billing.js';
import reportsRoutes from './server/routes/reports.js';
import notificationsRoutes from './server/routes/notifications.js';
import usersRoutes from './server/routes/users.js';
import settingsRoutes from './server/routes/settings.js';
import auditLogsRoutes from './server/routes/auditLogs.js';
import documentsRoutes from './server/routes/documents.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'TenderFlow ERP API' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/tenders', tendersRoutes);
  app.use('/api/emd', emdRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/audit-logs', auditLogsRoutes);
  app.use('/api/documents', documentsRoutes);

  // Vite middleware for development / Static fallback for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`🚀 TenderFlow ERP Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
