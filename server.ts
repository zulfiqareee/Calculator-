import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Storage path for Tally Khata server backup
  const DATA_DIR = path.resolve('./data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const TALLY_DATA_FILE = path.join(DATA_DIR, 'tally_backup.json');
  const CUSTOM_TOOLS_FILE = path.join(DATA_DIR, 'custom_tools.json');
  const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
  const HEALTH_TIPS_FILE = path.join(DATA_DIR, 'health_tips.json');
  const NOTICE_FILE = path.join(DATA_DIR, 'public_notice.json');

  // Helper to read JSON safely
  const readJsonFile = (filePath: string, fallback: any = null) => {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return fallback;
  };

  // Helper to write JSON safely
  const writeJsonFile = (filePath: string, data: any) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  };

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'SmartHub Full-Stack Server',
      freeServer: true,
      features: ['custom_tools_sync', 'books_sync', 'health_tips_sync', 'tally_cloud_sync', 'public_notice'],
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // API: Custom Tools (Admin to all Customers Sync)
  app.get('/api/custom-tools', (req, res) => {
    const tools = readJsonFile(CUSTOM_TOOLS_FILE, []);
    res.json({ success: true, tools });
  });

  app.post('/api/custom-tools', (req, res) => {
    try {
      const { tools } = req.body;
      if (!Array.isArray(tools)) {
        return res.status(400).json({ success: false, error: 'tools must be an array' });
      }
      writeJsonFile(CUSTOM_TOOLS_FILE, tools);
      console.log(`[Server] Saved ${tools.length} custom tools from Admin.`);
      return res.json({ success: true, count: tools.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Books (Admin to all Customers Sync)
  app.get('/api/books', (req, res) => {
    const books = readJsonFile(BOOKS_FILE, null);
    res.json({ success: true, books });
  });

  app.post('/api/books', (req, res) => {
    try {
      const { books } = req.body;
      if (!Array.isArray(books)) {
        return res.status(400).json({ success: false, error: 'books must be an array' });
      }
      writeJsonFile(BOOKS_FILE, books);
      console.log(`[Server] Saved ${books.length} books from Admin.`);
      return res.json({ success: true, count: books.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Health Tips (Admin to all Customers Sync)
  app.get('/api/health-tips', (req, res) => {
    const tips = readJsonFile(HEALTH_TIPS_FILE, null);
    res.json({ success: true, tips });
  });

  app.post('/api/health-tips', (req, res) => {
    try {
      const { tips } = req.body;
      if (!Array.isArray(tips)) {
        return res.status(400).json({ success: false, error: 'tips must be an array' });
      }
      writeJsonFile(HEALTH_TIPS_FILE, tips);
      console.log(`[Server] Saved ${tips.length} health tips from Admin.`);
      return res.json({ success: true, count: tips.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Public Notice (Admin announcement to all app users)
  app.get('/api/notice', (req, res) => {
    const notice = readJsonFile(NOTICE_FILE, null);
    res.json({ success: true, notice });
  });

  app.post('/api/notice', (req, res) => {
    try {
      const { notice } = req.body;
      writeJsonFile(NOTICE_FILE, notice);
      return res.json({ success: true, notice, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Get Tally Khata Cloud Backup
  app.get('/api/tally/sync', (req, res) => {
    try {
      if (fs.existsSync(TALLY_DATA_FILE)) {
        const raw = fs.readFileSync(TALLY_DATA_FILE, 'utf-8');
        return res.json({ success: true, data: JSON.parse(raw) });
      }
      return res.json({ success: true, data: null });
    } catch (err: any) {
      console.error('[Tally Sync Read Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Post Tally Khata Cloud Backup
  app.post('/api/tally/sync', (req, res) => {
    try {
      const payload = req.body;
      fs.writeFileSync(TALLY_DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({
        success: true,
        message: 'সার্ভারে টালি খাতার ডেটা সফলভাবে ক্লাউড ব্যাকআপ হয়েছে',
        syncedAt: Date.now(),
        customersCount: payload?.customers?.length || 0,
        transactionsCount: payload?.transactions?.length || 0,
      });
    } catch (err: any) {
      console.error('[Tally Sync Write Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve Frontend
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('./dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SmartHub Full-Stack Server is running on port ${PORT}`);
  });
}

startServer();
