/**
 * Permission Management Utility for SmartHub
 * Manages Geolocation, Notifications, and Media File Storage permissions
 */

export type PermissionStatusState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissionStatus {
  location: PermissionStatusState;
  notification: PermissionStatusState;
  audioStorage: PermissionStatusState;
}

/**
 * Checks current browser / mobile permission states
 */
export async function checkAppPermissions(): Promise<AppPermissionStatus> {
  const result: AppPermissionStatus = {
    location: 'prompt',
    notification: 'prompt',
    audioStorage: 'prompt',
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

  // 3. Audio / File picker is supported via HTML5 File API
  result.audioStorage = typeof window !== 'undefined' && 'FileReader' in window ? 'granted' : 'unsupported';

  return result;
}

/**
 * Request Geolocation Permission with high accuracy coordinates
 */
export function requestLocationPermission(): Promise<{ lat: number; lon: number; locationName?: string }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('ডিভাইসে জিপিএস সমর্থিত নয় (Geolocation not supported).'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          locationName: `GPS: ${pos.coords.latitude.toFixed(2)}° N, ${pos.coords.longitude.toFixed(2)}° E`,
        });
      },
      (err) => {
        let msg = 'লোকেশন পারমিশন পাওয়া যায়নি।';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'লোকেশন পারমিশন প্রত্যাখ্যান করা হয়েছে। ফোন সেটিংসে গিয়ে অনুমতি দিন।';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'জিপিএস সিগন্যাল পাওয়া যাচ্ছে না। খোলামেলা জায়গায় চেষ্টা করুন।';
        } else if (err.code === err.TIMEOUT) {
          msg = 'লোকেশন রিকোয়েস্টের সময়সীমা শেষ হয়েছে। আবার চেষ্টা করুন।';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
