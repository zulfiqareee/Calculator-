import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

if (process.argv.includes('--prod') && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Per-IP sliding-window rate limiter for AI endpoints
const aiRateLimitMap = new Map<string, number[]>();
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 15;

function aiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : '') ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const windowStart = now - AI_RATE_LIMIT_WINDOW_MS;

  // Periodic cleanup to avoid unbounded map growth
  if (aiRateLimitMap.size > 2000) {
    for (const [k, timestamps] of aiRateLimitMap.entries()) {
      const recent = timestamps.filter((t) => t > windowStart);
      if (recent.length === 0) aiRateLimitMap.delete(k);
      else aiRateLimitMap.set(k, recent);
    }
  }

  const timestamps = (aiRateLimitMap.get(ip) || []).filter((t) => t > windowStart);
  if (timestamps.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + AI_RATE_LIMIT_WINDOW_MS - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      error: `Too many AI requests. Please retry after ${retryAfterSec}s.`,
    });
  }

  timestamps.push(now);
  aiRateLimitMap.set(ip, timestamps);
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

  // Strict 32kb limit specifically on AI endpoints before general 10mb body parser
  app.use('/api/ai', express.json({ limit: '32kb' }));
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
      mode: isProd ? 'production' : 'development',
      freeServer: true,
      features: ['custom_tools_sync', 'books_sync', 'health_tips_sync', 'tally_cloud_sync', 'public_notice', 'ai_proxy'],
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // API: AI Configuration Status (boolean only — never exposes secret keys)
  app.get('/api/ai/status', (_req, res) => {
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    res.json({
      success: true,
      geminiConfigured,
    });
  });

  // API: Server-Side Gemini Proxy (keeps GEMINI_API_KEY strictly off client bundles)
  app.post('/api/ai/gemini', aiRateLimiter, async (req, res) => {
    try {
      // Optional server-side token enforcement when configured
      const requiredToken = process.env.AI_PROXY_TOKEN?.trim();
      if (requiredToken) {
        const authHeader = req.headers.authorization || '';
        const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        if (!provided || provided !== requiredToken) {
          return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            error: 'Authentication required for AI endpoint.',
          });
        }
      }

      const { task, payload } = req.body || {};
      const allowedTasks = new Set(['ping', 'script_generation', 'seo_metadata', 'tts']);
      if (typeof task !== 'string' || !allowedTasks.has(task)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_TASK',
          error: 'Unsupported AI task.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          code: 'GEMINI_NOT_CONFIGURED',
          error: 'Server GEMINI_API_KEY is not configured. Add GEMINI_API_KEY in backend environment secrets.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      if (task === 'ping') {
        const result = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'ping',
        });
        return res.json({
          success: true,
          ok: Boolean(result.text),
        });
      }

      if (task === 'script_generation') {
        const { topic, mode, language, durationSec, style, customInstructions } = payload || {};
        if (typeof topic !== 'string' || topic.trim().length === 0 || topic.length > 200) {
          return res.status(400).json({ success: false, error: 'Invalid topic (1-200 characters required).' });
        }
        const safeMode = mode === 'voiceless' ? 'voiceless' : 'voice';
        const isBn = language === 'bn';
        const allowedDurations = new Set([15, 30, 60, 90, 120]);
        const safeDuration = allowedDurations.has(Number(durationSec)) ? Number(durationSec) : 30;
        const safeStyle = typeof style === 'string' && style.length <= 40 ? style.replace(/[^\w\s-]/g, '') : 'cinematic';
        const safeInstructions =
          typeof customInstructions === 'string' ? customInstructions.slice(0, 500) : '';

        const sceneCount =
          safeDuration <= 15 ? 2 : safeDuration <= 30 ? 3 : safeDuration <= 60 ? 5 : safeDuration <= 90 ? 7 : 9;
        const sceneDuration = Math.round(safeDuration / sceneCount);
        const cleanTopic = topic.trim();

        const prompt = `You are a world-class viral video director and scriptwriter.
Generate a high-retention video script for YouTube Shorts / Facebook Reels / Landscape.
Topic: ${JSON.stringify(cleanTopic)}
Video Mode: ${safeMode === 'voiceless' ? 'VOICE-LESS (No narration speech, focus on punchy ON-SCREEN bold text and visual storytelling)' : 'VOICE NARRATED (High-engagement narration voiceover)'}
Target Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}
Total Duration: ${safeDuration}s across ${sceneCount} scenes (~${sceneDuration}s each).
Style: ${safeStyle}
Custom Instructions: ${safeInstructions || 'Create an intriguing hook, emotional connection, and high retention.'}

Return STRICT JSON:
{
  "topic": ${JSON.stringify(cleanTopic)},
  "mode": "${safeMode}",
  "hookOpening": "Punchy 3-second hook in ${isBn ? 'Bengali' : 'English'}",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": ${sceneDuration},
      "narrationText": "${safeMode === 'voiceless' ? '' : `Spoken narration in ${isBn ? 'Bengali' : 'English'}`}",
      "onScreenText": "Short bold 3-5 word headline for screen overlay in ${isBn ? 'Bengali' : 'English'}",
      "visualDescription": "Visual scene description",
      "imagePrompt": "Cinematic visual prompt, ${safeStyle} aesthetic, high detail",
      "transitionType": "fade",
      "cameraMotion": "zoom_in"
    }
  ],
  "closingStatement": "Final impactful thought in ${isBn ? 'Bengali' : 'English'}",
  "callToAction": "Call to action in ${isBn ? 'Bengali' : 'English'}",
  "sourcesAndReferences": ["Verified Fact / Source"],
  "totalEstimatedSeconds": ${safeDuration}
}`;

        const result = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const text = result.text?.trim() || '';
        const clean = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(clean);
        return res.json({ success: true, data: parsed });
      }

      if (task === 'seo_metadata') {
        const { topic, scriptText, language } = payload || {};
        if (typeof topic !== 'string' || topic.trim().length === 0 || topic.length > 200) {
          return res.status(400).json({ success: false, error: 'Invalid topic (1-200 characters required).' });
        }
        const safeScript = typeof scriptText === 'string' ? scriptText.slice(0, 400) : '';
        const isBn = language === 'bn';
        const cleanTopic = topic.trim();

        const prompt = `Generate viral, high-CTR YouTube & Facebook SEO metadata for:
Topic: ${JSON.stringify(cleanTopic)}
Script: ${JSON.stringify(safeScript)}
Language: ${isBn ? 'Bengali' : 'English'}

Strict JSON schema:
{
  "youtube": {
    "title": "High-CTR Title under 65 chars in ${isBn ? 'Bengali' : 'English'}",
    "description": "Rich keyword description with summary and tags",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "keywords": ["key1", "key2", "key3"],
    "hashtags": ["#Shorts", "#Trending", "#${cleanTopic.replace(/\s+/g, '')}"],
    "suggestedCategory": "Education",
    "thumbnailText": "3-word catchy punchline",
    "pinnedComment": "Question to engage audience"
  },
  "facebook": {
    "caption": "Catchy reel caption with emojis",
    "description": "Reel description",
    "hashtags": ["#Reels", "#Viral"],
    "hookSentence": "First line hook",
    "callToAction": "Follow page for more"
  }
}`;

        const result = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(result.text?.trim() || '{}');
        return res.json({ success: true, data: parsed });
      }

      if (task === 'tts') {
        const { text, gender } = payload || {};
        if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
          return res.status(400).json({ success: false, error: 'Invalid TTS text (1-500 characters required).' });
        }
        const voiceName = gender === 'female' ? 'Kore' : 'Puck';
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: text.slice(0, 300), speechMetadata: { style: 'Clear, engaging, articulate narrator' } } as any],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        return res.json({ success: true, audioData });
      }
    } catch (err: any) {
      const status = typeof err?.status === 'number' ? err.status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({
        success: false,
        error: err?.message || 'AI request failed',
      });
    }
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

  // Unknown API routes return clean JSON 404 before SPA fallback
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  });

  // Serve Frontend
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    // Development-only: intercept /@vite/client to disable WebSocket HMR connection in AI Studio preview sandbox
    app.use('/@vite/client', async (req, res, next) => {
      try {
        const result = await vite.transformRequest(req.originalUrl || '/@vite/client');
        if (result && result.code) {
          const cleanCode = result.code
            .replace(
              /await wsTransport\.connect\(handlers\);/g,
              '/* WebSocket HMR disabled in sandbox */'
            )
            .replace(/\bws\.send\(/g, 'ws?.send?.(')
            .replace(/\bsocket\.send\(/g, 'socket?.send?.(');
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store');
          return res.send(cleanCode);
        }
      } catch (err) {
        console.warn('Vite client transform error:', err);
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('./dist');
    const indexHtml = path.join(distDir, 'index.html');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      if (!fs.existsSync(indexHtml)) {
        return res.status(500).send('Production build not found. Run "npm run build" first.');
      }
      return res.sendFile(indexHtml);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SmartHub Full-Stack Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
  });
}

startServer();
