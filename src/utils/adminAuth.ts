export const AUTHORIZED_ADMIN_EMAIL = 'zulfiqar1hasan@gmail.com';
const STORAGE_KEY_ADMIN_SESSION = 'smart_utility_admin_session_v2';
const STORAGE_KEY_ADMIN_TOKEN = 'smart_utility_admin_token_v2';

// Clean up any legacy plaintext password key saved by older builds
try {
  localStorage.removeItem('smart_utility_admin_secret_pass_v1');
  localStorage.removeItem('smart_utility_admin_session_v1');
  localStorage.removeItem('smart_utility_admin_pin_v1');
  sessionStorage.removeItem('smart_ai_studio_auth');
} catch {
  // ignore storage errors
}

export interface AdminSession {
  email: string;
  loggedInAt: number;
  expiresAt?: number;
}

export interface AdminStatusInfo {
  configured: boolean;
  authorizedEmail: string;
  offlineFallback?: boolean;
}

export function getAdminToken(): string | null {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    const session = getAdminSession();
    if (!token || !session) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearAdminSession();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed || !parsed.email) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearAdminSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(email: string, token: string, expiresAt?: number): void {
  try {
    const session: AdminSession = {
      email,
      loggedInAt: Date.now(),
      expiresAt,
    };
    sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, token);
  } catch (err) {
    console.error('Failed to set admin session', err);
  }
}

export function clearAdminSession(): void {
  const token = (() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    } catch {
      return null;
    }
  })();

  try {
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }

  if (token) {
    fetch('/api/auth/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export async function fetchAdminStatus(): Promise<AdminStatusInfo> {
  try {
    const res = await fetch('/api/auth/admin/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      configured: Boolean(data?.configured),
      authorizedEmail: data?.authorizedEmail || AUTHORIZED_ADMIN_EMAIL,
    };
  } catch {
    return {
      configured: false,
      authorizedEmail: AUTHORIZED_ADMIN_EMAIL,
      offlineFallback: true,
    };
  }
}

export async function verifyAdminSessionWithServer(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) clearAdminSession();
      return false;
    }
    return true;
  } catch {
    return Boolean(getAdminSession());
  }
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  if (!cleanEmail || !cleanPass) {
    return {
      success: false,
      error: 'ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।',
    };
  }

  try {
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.token) {
      return {
        success: false,
        code: data?.code,
        error:
          data?.code === 'ADMIN_NOT_CONFIGURED'
            ? 'সার্ভার এনভায়রনমেন্টে ADMIN_PASSWORD সেট করা নেই। অনুগ্রহ করে .env অথবা সার্ভার Secrets-এ ADMIN_EMAIL ও ADMIN_PASSWORD কনফিগার করুন।'
            : data?.error || 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। প্রবেশাধিকার সংরক্ষিত।',
      };
    }

    setAdminSession(data.session?.email || cleanEmail, data.token, data.session?.expiresAt);
    return { success: true };
  } catch {
    return {
      success: false,
      code: 'SERVER_UNREACHABLE',
      error: 'অ্যাডমিন অথেনটিকেশন সার্ভারের সাথে সংযোগ করা যাচ্ছে না। অনলাইন অবস্থায় পুনরায় চেষ্টা করুন।',
    };
  }
}

export async function changeAdminPasswordOnServer(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, error: 'পাসওয়ার্ড পরিবর্তন করতে পুনরায় লগইন করুন।' };
  }
  try {
    const res = await fetch('/api/auth/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { success: false, error: data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
    }
    return { success: true, message: data?.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' };
  } catch {
    return { success: false, error: 'সার্ভারের সাথে সংযোগ করা যায়নি।' };
  }
}
