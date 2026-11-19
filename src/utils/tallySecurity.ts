// Security utilities for Tally Khata PIN Lock (salted SHA-256) and per-user Cloud Sync Auth

export const PIN_ENABLED_KEY = 'smarthub_tally_pin_enabled';
export const PIN_HASH_KEY = 'smarthub_tally_pin_hash_v2';
const LEGACY_PIN_KEY = 'smarthub_tally_pin_code';
const PIN_LOCKOUT_KEY = 'smarthub_tally_pin_lockout_v1';

const TALLY_CLOUD_TOKEN_KEY = 'smarthub_tally_cloud_token_v1';
const TALLY_CLOUD_ACCOUNT_KEY = 'smarthub_tally_cloud_account_v1';

export interface StoredPinRecord {
  salt: string;
  hash: string;
  updatedAt: number;
}

export interface TallyCloudAccount {
  userId: string;
  accountId: string;
  shopName?: string;
  expiresAt?: number;
}

// Remove any insecure legacy plaintext PIN on startup if a hashed record already exists,
// or migrate a custom non-default PIN seamlessly on next check
export function hasConfiguredPin(): boolean {
  try {
    if (localStorage.getItem(PIN_HASH_KEY)) return true;
    const legacy = localStorage.getItem(LEGACY_PIN_KEY);
    return Boolean(legacy && /^\d{4}$/.test(legacy) && legacy !== '1234');
  } catch {
    return false;
  }
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback for restricted non-secure contexts
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0');
}

function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

export async function saveHashedTallyPin(pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) return false;
  try {
    const salt = generateSalt();
    const hash = await sha256Hex(`${salt}:${pin}`);
    const record: StoredPinRecord = { salt, hash, updatedAt: Date.now() };
    localStorage.setItem(PIN_HASH_KEY, JSON.stringify(record));
    localStorage.removeItem(LEGACY_PIN_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function verifyTallyPin(pin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) return false;
  try {
    const raw = localStorage.getItem(PIN_HASH_KEY);
    if (raw) {
      const record = JSON.parse(raw) as StoredPinRecord;
      if (!record?.salt || !record?.hash) return false;
      const candidateHash = await sha256Hex(`${record.salt}:${pin}`);
      return candidateHash === record.hash;
    }

    // One-time transparent migration for custom user PINs saved before hashing was added (never accepts hardcoded 1234 fallback when unset)
    const legacy = localStorage.getItem(LEGACY_PIN_KEY);
    if (legacy && /^\d{4}$/.test(legacy) && legacy !== '1234' && pin === legacy) {
      await saveHashedTallyPin(legacy);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function clearTallyPin(): void {
  try {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(LEGACY_PIN_KEY);
    localStorage.setItem(PIN_ENABLED_KEY, 'false');
    localStorage.removeItem(PIN_LOCKOUT_KEY);
  } catch {
    // ignore
  }
}

export function getPinLockoutState(): { failedAttempts: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(PIN_LOCKOUT_KEY);
    if (!raw) return { failedAttempts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw);
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: 0 };
  }
}

export function recordFailedPinAttempt(): { failedAttempts: number; lockedUntil: number } {
  const current = getPinLockoutState();
  const nextAttempts = current.failedAttempts + 1;
  const lockedUntil = nextAttempts >= 5 ? Date.now() + 30_000 : 0;
  const state = { failedAttempts: nextAttempts, lockedUntil };
  try {
    localStorage.setItem(PIN_LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  return state;
}

export function resetPinLockout(): void {
  try {
    localStorage.removeItem(PIN_LOCKOUT_KEY);
  } catch {
    // ignore
  }
}

// =========================================================================
// PER-USER TALLY CLOUD ACCOUNT AUTHENTICATION
// =========================================================================
export function getTallyCloudToken(): string | null {
  try {
    const token = sessionStorage.getItem(TALLY_CLOUD_TOKEN_KEY);
    const acc = getTallyCloudAccount();
    if (!token || !acc) return null;
    if (acc.expiresAt && Date.now() > acc.expiresAt) {
      clearTallyCloudSession();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function getTallyCloudAccount(): TallyCloudAccount | null {
  try {
    const raw = sessionStorage.getItem(TALLY_CLOUD_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TallyCloudAccount;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearTallyCloudSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getTallyCloudAuthHeaders(): Record<string, string> {
  const token = getTallyCloudToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearTallyCloudSession(): void {
  const token = (() => {
    try {
      return sessionStorage.getItem(TALLY_CLOUD_TOKEN_KEY);
    } catch {
      return null;
    }
  })();

  try {
    sessionStorage.removeItem(TALLY_CLOUD_TOKEN_KEY);
    sessionStorage.removeItem(TALLY_CLOUD_ACCOUNT_KEY);
  } catch {
    // ignore
  }

  if (token) {
    fetch('/api/tally/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export async function registerTallyCloudAccount(
  accountId: string,
  passcode: string,
  shopName: string
): Promise<{ success: boolean; account?: TallyCloudAccount; error?: string }> {
  try {
    const res = await fetch('/api/tally/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, passcode, shopName }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.token) {
      return { success: false, error: data?.error || 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।' };
    }
    sessionStorage.setItem(TALLY_CLOUD_TOKEN_KEY, data.token);
    sessionStorage.setItem(TALLY_CLOUD_ACCOUNT_KEY, JSON.stringify(data.account));
    return { success: true, account: data.account };
  } catch {
    return { success: false, error: 'সার্ভারের সাথে সংযোগ করা যায়নি। অফলাইন মোডে স্থানীয় হিসাব নিরাপদ আছে।' };
  }
}

export async function loginTallyCloudAccount(
  accountId: string,
  passcode: string
): Promise<{ success: boolean; account?: TallyCloudAccount; error?: string }> {
  try {
    const res = await fetch('/api/tally/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, passcode }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.token) {
      return { success: false, error: data?.error || 'লগইন ব্যর্থ হয়েছে।' };
    }
    sessionStorage.setItem(TALLY_CLOUD_TOKEN_KEY, data.token);
    sessionStorage.setItem(TALLY_CLOUD_ACCOUNT_KEY, JSON.stringify(data.account));
    return { success: true, account: data.account };
  } catch {
    return { success: false, error: 'সার্ভারের সাথে সংযোগ করা যায়নি।' };
  }
}
