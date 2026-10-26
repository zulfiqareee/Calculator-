export const AUTHORIZED_ADMIN_EMAIL = 'zulfiqar1hasan@gmail.com';
const STORAGE_KEY_ADMIN_PASS = 'smart_utility_admin_secret_pass_v1';
const STORAGE_KEY_ADMIN_SESSION = 'smart_utility_admin_session_v1';
export const DEFAULT_ADMIN_PASSWORD = 'zulfiqar2026';

export interface AdminSession {
  email: string;
  loggedInAt: number;
}

export function getAdminPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PASS) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function setAdminPassword(newPass: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPass);
  } catch (err) {
    console.error('Failed to save admin pass', err);
  }
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email === AUTHORIZED_ADMIN_EMAIL) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAdminSession(email: string): void {
  try {
    const session: AdminSession = {
      email,
      loggedInAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to set admin session', err);
  }
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }
}

export function verifyAdminCredentials(email: string, pass: string): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const currentPass = getAdminPassword();

  if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase() || pass.trim() !== currentPass) {
    return {
      success: false,
      error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। প্রবেশাধিকার সংরক্ষিত।',
    };
  }

  setAdminSession(normalizedEmail);
  return { success: true };
}
