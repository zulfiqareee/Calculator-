/**
 * Permission Management Utility for SmartHub
 * Manages Geolocation, Notifications, and Media File Storage permissions
 * Fully Play-Store compliant
 */

export type PermissionStatusState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissionStatus {
  location: PermissionStatusState;
  notification: PermissionStatusState;
  audioStorage: PermissionStatusState;
}

export const PERMISSION_ONBOARDING_KEY = 'smarthub_permissions_onboarded_v2';
export const USER_GPS_COORDS_KEY = 'user_gps_coords';

/**
 * Checks whether user has gone through initial permission setup
 */
export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(PERMISSION_ONBOARDING_KEY) === 'true';
}

export function setOnboardingCompleted(completed: boolean = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERMISSION_ONBOARDING_KEY, completed ? 'true' : 'false');
}

/**
 * Get cached GPS coordinates if available
 */
export function getCachedGpsCoords(): { lat: number; lon: number; name?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_GPS_COORDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cache GPS coordinates
 */
export function setCachedGpsCoords(lat: number, lon: number, name?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      USER_GPS_COORDS_KEY,
      JSON.stringify({ lat, lon, name, updatedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

/**
 * Approximate magnetic declination based on Latitude & Longitude
 * Returns degree difference between Magnetic North and True North
 */
export function estimateMagneticDeclination(lat: number, lon: number): number {
  // Approximate World Magnetic Model (WMM) for South Asia & Global
  // Bangladesh is centered at ~23.8°N, 90.4°E (Declination ~ -0.1° to +0.3°)
  const dLat = lat - 23.8;
  const dLon = lon - 90.4;
  const declination = -0.15 + (dLon * 0.06) - (dLat * 0.02);
  return Math.round(declination * 10) / 10;
}

/**
 * Checks current browser / mobile permission states
 */
export async function checkAppPermissions(): Promise<AppPermissionStatus> {
  const result: AppPermissionStatus = {
    location: 'prompt',
    notification: 'prompt',
    audioStorage: 'granted',
  };

  // 1. Geolocation check
  if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
    try {
      const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
      result.location = geoPerm.state as PermissionStatusState;
    } catch {
      result.location = 'geolocation' in navigator ? 'prompt' : 'unsupported';
    }
  } else if (typeof navigator !== 'undefined') {
    result.location = 'geolocation' in navigator ? 'prompt' : 'unsupported';
  }

  // 2. Notification check
  if (typeof window !== 'undefined' && 'Notification' in window) {
    result.notification = Notification.permission as PermissionStatusState;
  } else {
    result.notification = 'unsupported';
  }

  // 3. Audio / File picker is supported via HTML5 File API and Android Storage
  result.audioStorage = typeof window !== 'undefined' && 'FileReader' in window ? 'granted' : 'unsupported';

  return result;
}

/**
 * Request Geolocation Permission with high accuracy coordinates
 */
export function requestLocationPermission(): Promise<{ lat: number; lon: number; locationName: string }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('ডিভাইসে জিপিএস সমর্থিত নয় (Geolocation not supported).'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const locationName = `GPS (${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E)`;
        
        // Cache for all tools to use
        setCachedGpsCoords(lat, lon, locationName);

        resolve({
          lat,
          lon,
          locationName,
        });
      },
      (err) => {
        let msg = 'লোকেশন পারমিশন পাওয়া যায়নি।';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'লোকেশন পারমিশন প্রত্যাখ্যাত। আপনার ফোন সেটিংসে গিয়ে জিপিএস এক্সেস দিন।';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'জিপিএস সিগন্যাল পাওয়া যাচ্ছে না। অনুগ্রহ করে খোলা জায়গায় বা ওয়াইফাই সংযোগে চেষ্টা করুন।';
        } else if (err.code === err.TIMEOUT) {
          msg = 'লোকেশন পেতে সময় বেশি লেগেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

/**
 * Request Notification Permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}
