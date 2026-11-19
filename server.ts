import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { evaluateSafeMath } from './src/utils/safeMathParser';

if (process.argv.includes('--prod') && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const DEFAULT_AUTHORIZED_ADMIN_EMAIL = 'zulfiqar1hasan@gmail.com';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const TALLY_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for offline-capable user sync

interface RateLimitEntry {
  timestamps: number[];
}

function createRateLimiter(windowMs: number, maxRequests: number, code: string, messagePrefix: string) {
  const map = new Map<string, RateLimitEntry>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : '') ||
      req.socket?.remoteAddress ||
      'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (map.size > 2000) {
      for (const [k, entry] of map.entries()) {
        const recent = entry.timestamps.filter((t) => t > windowStart);
        if (recent.length === 0) map.delete(k);
        else map.set(k, { timestamps: recent });
      }
    }

    const recent = (map.get(ip)?.timestamps || []).filter((t) => t > windowStart);
    if (recent.length >= maxRequests) {
      const oldest = recent[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        code,
        error: `${messagePrefix} Retry after ${retryAfterSec}s.`,
      });
    }

    recent.push(now);
    map.set(ip, { timestamps: recent });
    next();
  };
}

const generalApiLimiter = createRateLimiter(60_000, 120, 'RATE_LIMITED', 'Too many API requests.');
const authRateLimiter = createRateLimiter(5 * 60_000, 10, 'AUTH_RATE_LIMITED', 'Too many login attempts.');
const aiRateLimiter = createRateLimiter(60_000, 15, 'RATE_LIMITED', 'Too many AI requests.');

function hashPasswordScrypt(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  try {
    const expectedBuf = Buffer.from(hexDigest, 'hex');
    const actualBuf = crypto.scryptSync(password, salt, expectedBuf.length);
    if (actualBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

interface SessionTokenPayload {
  jti: string;
  role: 'admin' | 'tally_user';
  sub: string;
  email?: string;
  iat: number;
  exp: number;
}

function signToken(payload: SessionTokenPayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function verifyToken(token: string, secret: string, revokedJtis: Map<string, number>): SessionTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encodedPayload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encodedPayload || !sig) return null;

  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(encodedPayload).digest();
    const actualSig = Buffer.from(sig, 'base64url');
    if (expectedSig.length !== actualSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;

    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as SessionTokenPayload;
    if (!decoded || typeof decoded.exp !== 'number' || Date.now() > decoded.exp) {
      return null;
    }
    if (decoded.jti && revokedJtis.has(decoded.jti)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function extractBearerToken(req: express.Request): string {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
}

interface TallyAccountRecord {
  userId: string;
  accountId: string;
  shopName: string;
  passcodeHash: string;
  createdAt: number;
}

interface AuthedRequest extends express.Request {
  authSession?: SessionTokenPayload;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

  // Data directory & server-side secrets directory
  const DATA_DIR = path.resolve('./data');
  const TALLY_USERS_DIR = path.join(DATA_DIR, 'tally_users');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  if (!fs.existsSync(TALLY_USERS_DIR)) {
    fs.mkdirSync(TALLY_USERS_DIR, { recursive: true, mode: 0o700 });
  }

  const LEGACY_TALLY_DATA_FILE = path.join(DATA_DIR, 'tally_backup.json');
  const TALLY_ACCOUNTS_FILE = path.join(DATA_DIR, 'tally_accounts.json');
  const CUSTOM_TOOLS_FILE = path.join(DATA_DIR, 'custom_tools.json');
  const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
  const HEALTH_TIPS_FILE = path.join(DATA_DIR, 'health_tips.json');
  const NOTICE_FILE = path.join(DATA_DIR, 'public_notice.json');
  const ADMIN_OVERRIDE_FILE = path.join(DATA_DIR, '.admin_override.json');
  const SERVER_SECRET_FILE = path.join(DATA_DIR, '.server_secret');

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
  const writeJsonFile = (filePath: string, data: any, mode = 0o600) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode });
  };

  // Obtain signing secret without hardcoding any secret in source code
  const getSigningSecret = (): string => {
    const envSecret = process.env.SESSION_SECRET?.trim();
    if (envSecret && envSecret.length >= 32) return envSecret;

    try {
      if (fs.existsSync(SERVER_SECRET_FILE)) {
        const existing = fs.readFileSync(SERVER_SECRET_FILE, 'utf-8').trim();
        if (existing.length >= 64) return existing;
      }
      const generated = crypto.randomBytes(48).toString('hex');
      fs.writeFileSync(SERVER_SECRET_FILE, generated, { encoding: 'utf-8', mode: 0o600 });
      return generated;
    } catch (err) {
      console.warn('[Server] Could not persist server secret file; using ephemeral memory secret.');
      return crypto.randomBytes(48).toString('hex');
    }
  };

  const SIGNING_SECRET = getSigningSecret();
  const revokedTokens = new Map<string, number>();

  const cleanupRevokedTokens = () => {
    const now = Date.now();
    for (const [jti, exp] of revokedTokens.entries()) {
      if (exp < now) revokedTokens.delete(jti);
    }
  };

  // Safe migration check for legacy global tally_backup.json
  try {
    if (fs.existsSync(LEGACY_TALLY_DATA_FILE)) {
      const legacy = readJsonFile(LEGACY_TALLY_DATA_FILE, null);
      const hasRealRecords =
        legacy &&
        ((Array.isArray(legacy.customers) && legacy.customers.length > 0) ||
          (Array.isArray(legacy.transactions) && legacy.transactions.length > 0));
      if (hasRealRecords) {
        const backupPath = path.join(DATA_DIR, `tally_legacy_backup_${Date.now()}.json`);
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(LEGACY_TALLY_DATA_FILE, backupPath);
          console.log(`[Migration] Backed up legacy tally data to ${path.basename(backupPath)}`);
        }
      }
    }
  } catch (err) {
    console.warn('[Migration] Legacy tally backup check skipped:', err);
  }

  // Derive env-configured admin hash once into memory (never hardcode any default password!)
  const ENV_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || DEFAULT_AUTHORIZED_ADMIN_EMAIL).trim().toLowerCase();
  const ENV_ADMIN_PASSWORD_HASH = (() => {
    const rawHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (rawHash && rawHash.startsWith('scrypt:')) return rawHash;
    const rawPlain = process.env.ADMIN_PASSWORD?.trim();
    if (rawPlain && rawPlain.length > 0) return hashPasswordScrypt(rawPlain);
    return null;
  })();

  const getActiveAdminCredentials = (): { email: string; passwordHash: string | null } => {
    const override = readJsonFile(ADMIN_OVERRIDE_FILE, null);
    if (override && typeof override.passwordHash === 'string' && override.passwordHash.startsWith('scrypt:')) {
      return {
        email: (typeof override.email === 'string' ? override.email : ENV_ADMIN_EMAIL).trim().toLowerCase(),
        passwordHash: override.passwordHash,
      };
    }
    return {
      email: ENV_ADMIN_EMAIL,
      passwordHash: ENV_ADMIN_PASSWORD_HASH,
    };
  };

  // Security headers across all responses (keeps iframe preview working while hardening MIME/referrer)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), payment=(), usb=()');
    next();
  });

  // Strict CORS handling on API routes
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    const hostHeader = req.headers.host;
    const allowedOrigins = new Set<string>([
      'capacitor://localhost',
      'https://localhost',
      'http://localhost',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    if (process.env.APP_URL) {
      try {
        allowedOrigins.add(new URL(process.env.APP_URL).origin);
      } catch {
        // ignore invalid APP_URL
      }
    }
    if (hostHeader) {
      allowedOrigins.add(`https://${hostHeader}`);
      allowedOrigins.add(`http://${hostHeader}`);
    }

    if (origin) {
      if (allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      } else {
        return res.status(403).json({
          success: false,
          code: 'ORIGIN_NOT_ALLOWED',
          error: 'Cross-origin request blocked.',
        });
      }
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use('/api', generalApiLimiter);

  // Scoped JSON body size limits
  app.use('/api/ai', express.json({ limit: '32kb' }));
  app.use('/api/auth', express.json({ limit: '16kb' }));
  app.use('/api/tally/auth', express.json({ limit: '16kb' }));
  app.use('/api/tally/sync', express.json({ limit: '5mb' }));
  app.use('/api/custom-tools', express.json({ limit: '1mb' }));
  app.use('/api/books', express.json({ limit: '4mb' }));
  app.use('/api/health-tips', express.json({ limit: '2mb' }));
  app.use('/api/notice', express.json({ limit: '64kb' }));
  app.use(express.json({ limit: '1mb' }));

  // Auth middlewares
  const requireAdminAuth = (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    cleanupRevokedTokens();
    const token = extractBearerToken(req);
    const session = verifyToken(token, SIGNING_SECRET, revokedTokens);
    if (!session) {
      return res.status(401).json({
        success: false,
        code: 'ADMIN_AUTH_REQUIRED',
        error: 'Admin authentication required.',
      });
    }
    if (session.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        error: 'Admin role required.',
      });
    }
    req.authSession = session;
    next();
  };

  const requireTallyUserAuth = (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    cleanupRevokedTokens();
    const token = extractBearerToken(req);
    const session = verifyToken(token, SIGNING_SECRET, revokedTokens);
    if (!session) {
      return res.status(401).json({
        success: false,
        code: 'TALLY_AUTH_REQUIRED',
        error: 'Tally Khata cloud account login required.',
      });
    }
    if (session.role !== 'tally_user' || !/^u_[a-f0-9]{16}$/.test(session.sub)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        error: 'Valid Tally Khata account required.',
      });
    }
    req.authSession = session;
    next();
  };

  const requireAiAuth = (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    cleanupRevokedTokens();
    const provided = extractBearerToken(req);
    const staticProxyToken = process.env.AI_PROXY_TOKEN?.trim();
    if (staticProxyToken && provided) {
      const a = Buffer.from(provided, 'utf-8');
      const b = Buffer.from(staticProxyToken, 'utf-8');
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return next();
      }
    }

    const session = verifyToken(provided, SIGNING_SECRET, revokedTokens);
    if (session && (session.role === 'admin' || session.role === 'tally_user')) {
      req.authSession = session;
      return next();
    }

    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Authentication required for AI endpoint. Sign in to Admin Panel or Tally Cloud Account first.',
    });
  };

  // API: Health Check
  app.get('/api/health', (_req, res) => {
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

  // API: Admin Auth Status & Login
  app.get('/api/auth/admin/status', (_req, res) => {
    const creds = getActiveAdminCredentials();
    res.json({
      success: true,
      configured: Boolean(creds.passwordHash),
      authorizedEmail: creds.email,
    });
  });

  app.post('/api/auth/admin/login', authRateLimiter, (req, res) => {
    const creds = getActiveAdminCredentials();
    if (!creds.passwordHash) {
      return res.status(503).json({
        success: false,
        code: 'ADMIN_NOT_CONFIGURED',
        error:
          'Server Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in backend environment variables.',
      });
    }

    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordMatches = verifyPasswordScrypt(password, creds.passwordHash);
    if (normalizedEmail !== creds.email || !passwordMatches) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। প্রবেশাধিকার সংরক্ষিত।',
      });
    }

    const now = Date.now();
    const exp = now + TOKEN_TTL_MS;
    const token = signToken(
      {
        jti: crypto.randomUUID(),
        role: 'admin',
        sub: normalizedEmail,
        email: normalizedEmail,
        iat: now,
        exp,
      },
      SIGNING_SECRET
    );

    return res.json({
      success: true,
      token,
      session: {
        email: normalizedEmail,
        loggedInAt: now,
        expiresAt: exp,
      },
    });
  });

  app.get('/api/auth/admin/session', requireAdminAuth, (req: AuthedRequest, res) => {
    res.json({
      success: true,
      authenticated: true,
      session: {
        email: req.authSession!.email || req.authSession!.sub,
        loggedInAt: req.authSession!.iat,
        expiresAt: req.authSession!.exp,
      },
    });
  });

  app.post('/api/auth/admin/logout', (req, res) => {
    const token = extractBearerToken(req);
    const session = verifyToken(token, SIGNING_SECRET, revokedTokens);
    if (session?.jti) {
      revokedTokens.set(session.jti, session.exp);
    }
    res.json({ success: true });
  });

  app.post('/api/auth/admin/change-password', authRateLimiter, requireAdminAuth, (req: AuthedRequest, res) => {
    const creds = getActiveAdminCredentials();
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'বর্তমান এবং নতুন পাসওয়ার্ড উভয়ই প্রয়োজন।' });
    }
    if (!creds.passwordHash || !verifyPasswordScrypt(currentPassword, creds.passwordHash)) {
      return res.status(401).json({ success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
    }
    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 8 || trimmedNew.length > 128) {
      return res.status(400).json({ success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ থেকে ১২৮ অক্ষরের হতে হবে।' });
    }

    const nextHash = hashPasswordScrypt(trimmedNew);
    writeJsonFile(ADMIN_OVERRIDE_FILE, {
      email: creds.email,
      passwordHash: nextHash,
      updatedAt: Date.now(),
    });
    return res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' });
  });

  // API: AI Configuration Status (boolean only — never exposes secret keys)
  app.get('/api/ai/status', (_req, res) => {
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    res.json({
      success: true,
      geminiConfigured,
    });
  });

  // API: Server-Side Gemini Proxy (authenticated, rate-limited, schema-validated)
  app.post('/api/ai/gemini', aiRateLimiter, requireAiAuth, async (req, res) => {
    try {
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

  // API: Custom Tools (Public GET, Admin-protected POST with formula validation)
  app.get('/api/custom-tools', (_req, res) => {
    const tools = readJsonFile(CUSTOM_TOOLS_FILE, []);
    res.json({ success: true, tools });
  });

  app.post('/api/custom-tools', requireAdminAuth, (req, res) => {
    try {
      const { tools } = req.body || {};
      if (!Array.isArray(tools) || tools.length > 200) {
        return res.status(400).json({ success: false, error: 'tools must be an array of at most 200 items' });
      }
      for (const tool of tools) {
        if (!tool || typeof tool.id !== 'string' || typeof tool.formula !== 'string' || tool.formula.length > 500) {
          return res.status(400).json({ success: false, error: 'Invalid custom tool payload.' });
        }
        const vars: Record<string, number> = {};
        if (Array.isArray(tool.inputs)) {
          for (const inp of tool.inputs) {
            if (inp && typeof inp.variable === 'string') {
              vars[inp.variable] = typeof inp.defaultValue === 'number' && Number.isFinite(inp.defaultValue) ? inp.defaultValue : 1;
            }
          }
        }
        const check = evaluateSafeMath(tool.formula, { variables: vars, angleUnit: 'rad', percentageMode: 'modulo', logBase: 'e' });
        if (!check.success && check.error && !check.error.toLowerCase().includes('divide') && !check.error.toLowerCase().includes('zero')) {
          return res.status(400).json({ success: false, error: `Unsafe or invalid formula in tool "${tool.id}": ${check.error}` });
        }
      }
      writeJsonFile(CUSTOM_TOOLS_FILE, tools);
      console.log(`[Server] Saved ${tools.length} custom tools from Admin.`);
      return res.json({ success: true, count: tools.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Books (Public GET, Admin-protected POST)
  app.get('/api/books', (_req, res) => {
    const books = readJsonFile(BOOKS_FILE, null);
    res.json({ success: true, books });
  });

  app.post('/api/books', requireAdminAuth, (req, res) => {
    try {
      const { books } = req.body || {};
      if (!Array.isArray(books) || books.length > 100) {
        return res.status(400).json({ success: false, error: 'books must be an array of at most 100 items' });
      }
      writeJsonFile(BOOKS_FILE, books);
      console.log(`[Server] Saved ${books.length} books from Admin.`);
      return res.json({ success: true, count: books.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Health Tips (Public GET, Admin-protected POST)
  app.get('/api/health-tips', (_req, res) => {
    const tips = readJsonFile(HEALTH_TIPS_FILE, null);
    res.json({ success: true, tips });
  });

  app.post('/api/health-tips', requireAdminAuth, (req, res) => {
    try {
      const { tips } = req.body || {};
      if (!Array.isArray(tips) || tips.length > 500) {
        return res.status(400).json({ success: false, error: 'tips must be an array of at most 500 items' });
      }
      writeJsonFile(HEALTH_TIPS_FILE, tips);
      console.log(`[Server] Saved ${tips.length} health tips from Admin.`);
      return res.json({ success: true, count: tips.length, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Public Notice (Public GET, Admin-protected POST)
  app.get('/api/notice', (_req, res) => {
    const notice = readJsonFile(NOTICE_FILE, null);
    res.json({ success: true, notice });
  });

  app.post('/api/notice', requireAdminAuth, (req, res) => {
    try {
      const { notice } = req.body || {};
      if (notice !== null && typeof notice !== 'string' && typeof notice !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid notice payload' });
      }
      writeJsonFile(NOTICE_FILE, notice);
      return res.json({ success: true, notice, updatedAt: Date.now() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Per-User Tally Khata Cloud Authentication & Data Isolation
  const readTallyAccounts = (): Record<string, TallyAccountRecord> => {
    const data = readJsonFile(TALLY_ACCOUNTS_FILE, {});
    return data && typeof data === 'object' ? data : {};
  };

  app.post('/api/tally/auth/register', authRateLimiter, (req, res) => {
    const { accountId, passcode, shopName } = req.body || {};
    if (typeof accountId !== 'string' || typeof passcode !== 'string') {
      return res.status(400).json({ success: false, error: 'অ্যাকাউন্ট আইডি (মোবাইল/ইমেইল) এবং পাসকোড দিন।' });
    }
    const normalizedId = accountId.trim().toLowerCase().replace(/\s+/g, '');
    if (normalizedId.length < 5 || normalizedId.length > 80) {
      return res.status(400).json({ success: false, error: 'অ্যাকাউন্ট আইডি কমপক্ষে ৫ থেকে ৮০ অক্ষরের হতে হবে।' });
    }
    const cleanPasscode = passcode.trim();
    if (cleanPasscode.length < 4 || cleanPasscode.length > 64) {
      return res.status(400).json({ success: false, error: 'ক্লাউড পাসকোড কমপক্ষে ৪ অক্ষরের হতে হবে।' });
    }

    const accounts = readTallyAccounts();
    if (accounts[normalizedId]) {
      return res.status(409).json({
        success: false,
        code: 'ACCOUNT_EXISTS',
        error: 'এই অ্যাকাউন্টটি আগে থেকেই নিবন্ধিত আছে। অনুগ্রহ করে লগইন করুন।',
      });
    }

    const userId = 'u_' + crypto.createHash('sha256').update(`${normalizedId}:${crypto.randomBytes(16).toString('hex')}`).digest('hex').slice(0, 16);
    const now = Date.now();
    accounts[normalizedId] = {
      userId,
      accountId: normalizedId,
      shopName: typeof shopName === 'string' ? shopName.trim().slice(0, 100) : '',
      passcodeHash: hashPasswordScrypt(cleanPasscode),
      createdAt: now,
    };
    writeJsonFile(TALLY_ACCOUNTS_FILE, accounts);

    const exp = now + TALLY_TOKEN_TTL_MS;
    const token = signToken(
      {
        jti: crypto.randomUUID(),
        role: 'tally_user',
        sub: userId,
        email: normalizedId,
        iat: now,
        exp,
      },
      SIGNING_SECRET
    );

    return res.status(201).json({
      success: true,
      token,
      account: {
        userId,
        accountId: normalizedId,
        shopName: accounts[normalizedId].shopName,
        expiresAt: exp,
      },
    });
  });

  app.post('/api/tally/auth/login', authRateLimiter, (req, res) => {
    const { accountId, passcode } = req.body || {};
    if (typeof accountId !== 'string' || typeof passcode !== 'string') {
      return res.status(400).json({ success: false, error: 'অ্যাকাউন্ট আইডি এবং পাসকোড দিন।' });
    }
    const normalizedId = accountId.trim().toLowerCase().replace(/\s+/g, '');
    const accounts = readTallyAccounts();
    const record = accounts[normalizedId];
    if (!record || !verifyPasswordScrypt(passcode.trim(), record.passcodeHash)) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'অ্যাকাউন্ট আইডি অথবা পাসকোড সঠিক নয়।',
      });
    }

    const now = Date.now();
    const exp = now + TALLY_TOKEN_TTL_MS;
    const token = signToken(
      {
        jti: crypto.randomUUID(),
        role: 'tally_user',
        sub: record.userId,
        email: record.accountId,
        iat: now,
        exp,
      },
      SIGNING_SECRET
    );

    return res.json({
      success: true,
      token,
      account: {
        userId: record.userId,
        accountId: record.accountId,
        shopName: record.shopName,
        expiresAt: exp,
      },
    });
  });

  app.get('/api/tally/auth/session', requireTallyUserAuth, (req: AuthedRequest, res) => {
    res.json({
      success: true,
      authenticated: true,
      account: {
        userId: req.authSession!.sub,
        accountId: req.authSession!.email,
        expiresAt: req.authSession!.exp,
      },
    });
  });

  app.post('/api/tally/auth/logout', (req, res) => {
    const token = extractBearerToken(req);
    const session = verifyToken(token, SIGNING_SECRET, revokedTokens);
    if (session?.jti && session.role === 'tally_user') {
      revokedTokens.set(session.jti, session.exp);
    }
    res.json({ success: true });
  });

  const getUserTallyFile = (userId: string): string => {
    const safeId = path.basename(userId);
    if (!/^u_[a-f0-9]{16}$/.test(safeId)) {
      throw new Error('Invalid user workspace identifier');
    }
    return path.join(TALLY_USERS_DIR, `${safeId}.json`);
  };

  // API: Get Per-User Tally Khata Cloud Backup (strictly isolated by userId)
  app.get('/api/tally/sync', requireTallyUserAuth, (req: AuthedRequest, res) => {
    try {
      const userFile = getUserTallyFile(req.authSession!.sub);
      if (fs.existsSync(userFile)) {
        const raw = fs.readFileSync(userFile, 'utf-8');
        return res.json({ success: true, data: JSON.parse(raw) });
      }
      return res.json({ success: true, data: null });
    } catch (err: any) {
      console.error('[Tally Sync Read Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API: Post Per-User Tally Khata Cloud Backup (strictly isolated by userId)
  app.post('/api/tally/sync', requireTallyUserAuth, (req: AuthedRequest, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ success: false, error: 'Invalid Tally backup payload.' });
      }
      const customers = Array.isArray(payload.customers) ? payload.customers : [];
      const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
      const products = Array.isArray(payload.products) ? payload.products : [];
      if (customers.length > 5000 || transactions.length > 50000 || products.length > 5000) {
        return res.status(400).json({ success: false, error: 'Tally backup exceeds maximum supported record counts.' });
      }

      const isolatedRecord = {
        ownerUserId: req.authSession!.sub,
        shop: payload.shop && typeof payload.shop === 'object' ? payload.shop : {},
        customers,
        transactions,
        products,
        syncedAt: Date.now(),
      };
      const userFile = getUserTallyFile(req.authSession!.sub);
      writeJsonFile(userFile, isolatedRecord);

      return res.json({
        success: true,
        message: 'আপনার নিজস্ব টালি খাতার ডেটা সার্ভারের সুরক্ষিত অ্যাকাউন্টে ব্যাকআপ হয়েছে',
        syncedAt: isolatedRecord.syncedAt,
        customersCount: customers.length,
        transactionsCount: transactions.length,
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
