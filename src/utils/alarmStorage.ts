import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Language } from '../types';

export type SoundToneType = 'azan' | 'birds' | 'chime' | 'peaceful' | 'digital' | 'radar' | 'classic_bell' | 'custom';

export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" 24h
  labelBn: string;
  labelEn: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty array means "Once" (একবার)
  soundTone: SoundToneType;
  customSoundName?: string;
  vibrate?: boolean;
  snoozeDuration?: number; // in minutes
  autoSilence?: number; // in minutes (0 for never)
  ascendingVolume?: boolean;
  createdAt: number;
}

export interface GlobalAlarmSettings {
  defaultRingtone: SoundToneType;
  timerRingtone: string;
  volume: number; // 0.1 to 1.0
  autoSilenceMinutes: number; // 1, 5, 10, 15, 20, 0 (never)
  snoozeDurationMinutes: number; // 5, 10, 15, 20, 30
  snoozeRepeatLimit: number; // 3, 5, 10, 0 (unlimited)
  vibrateWithAlarm: boolean;
  ascendingVolume: boolean;
  silenceOnFlip: boolean;
}

export const ALARMS_STORAGE_KEY = 'smart_utility_alarms_v2';
export const ALARM_CUSTOM_SOUND_KEY = 'smart_utility_custom_sound_data';
export const ALARM_SETTINGS_KEY = 'smart_utility_alarm_settings_v2';

export const DEFAULT_ALARM_SETTINGS: GlobalAlarmSettings = {
  defaultRingtone: 'chime',
  timerRingtone: 'bell_chime',
  volume: 0.85,
  autoSilenceMinutes: 10,
  snoozeDurationMinutes: 5,
  snoozeRepeatLimit: 3,
  vibrateWithAlarm: true,
  ascendingVolume: false,
  silenceOnFlip: true,
};

export const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-fajr',
    time: '05:00',
    labelBn: 'ফজরের সালাত ও ভোর',
    labelEn: 'Fajr Prayer & Dawn',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    soundTone: 'azan',
    vibrate: true,
    snoozeDuration: 5,
    autoSilence: 10,
    ascendingVolume: false,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'alarm-work',
    time: '08:30',
    labelBn: 'সকালের রুটিন ও কাজ',
    labelEn: 'Morning Work Routine',
    enabled: false,
    repeatDays: [0, 1, 2, 3, 4], // Weekdays
    soundTone: 'chime',
    vibrate: true,
    snoozeDuration: 5,
    autoSilence: 10,
    ascendingVolume: false,
    createdAt: Date.now() - 50000,
  },
];

// ==========================================
// Settings Storage
// ==========================================
export function getAlarmSettings(): GlobalAlarmSettings {
  try {
    const raw = localStorage.getItem(ALARM_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ALARM_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to get alarm settings:', e);
  }
  return DEFAULT_ALARM_SETTINGS;
}

export function saveAlarmSettings(settings: Partial<GlobalAlarmSettings>): GlobalAlarmSettings {
  try {
    const current = getAlarmSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save alarm settings:', e);
    return getAlarmSettings();
  }
}

// ==========================================
// Alarms Storage & Native Scheduling
// ==========================================
export function getStoredAlarms(): AlarmItem[] {
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (!raw) {
      saveStoredAlarms(DEFAULT_ALARMS);
      return DEFAULT_ALARMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ALARMS;
  } catch (e) {
    console.error('Failed to get alarms:', e);
    return DEFAULT_ALARMS;
  }
}

export function saveStoredAlarms(alarms: AlarmItem[]): void {
  try {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
    // Trigger background native schedule sync
    syncNativeAlarmSchedules(alarms).catch((err) => console.warn('Native alarm sync warning:', err));
  } catch (e) {
    console.error('Failed to save alarms:', e);
  }
}

export function addOrUpdateAlarm(alarm: AlarmItem): AlarmItem[] {
  const current = getStoredAlarms();
  const idx = current.findIndex((a) => a.id === alarm.id);
  let updated: AlarmItem[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = alarm;
  } else {
    updated = [alarm, ...current];
  }
  // Sort by time
  updated.sort((a, b) => a.time.localeCompare(b.time));
  saveStoredAlarms(updated);
  return updated;
}

export function deleteAlarm(id: string): AlarmItem[] {
  const current = getStoredAlarms();
  const updated = current.filter((a) => a.id !== id);
  saveStoredAlarms(updated);
  return updated;
}

export function toggleAlarm(id: string): AlarmItem[] {
  const current = getStoredAlarms();
  const updated = current.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
  saveStoredAlarms(updated);
  return updated;
}

// ==========================================
// Next Trigger Calculation & Countdown
// ==========================================
export function calculateNextAlarmDate(alarm: AlarmItem): Date | null {
  if (!alarm.enabled) return null;

  const [hoursStr, minutesStr] = alarm.time.split(':');
  const targetHour = parseInt(hoursStr, 10);
  const targetMinute = parseInt(minutesStr, 10);

  const now = new Date();

  // If one-time alarm (repeatDays empty)
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(targetHour, targetMinute, 0, 0);
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  // If repeat days are set
  // Check the next 7 days for the earliest matching day of week
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(targetHour, targetMinute, 0, 0);

    const dayOfWeek = candidate.getDay();
    if (alarm.repeatDays.includes(dayOfWeek)) {
      if (candidate.getTime() > now.getTime()) {
        return candidate;
      }
    }
  }

  // Fallback next day
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(targetHour, targetMinute, 0, 0);
  return fallback;
}

export function formatAlarmCountdown(nextDate: Date | null, lang: Language): string {
  if (!nextDate) {
    return lang === 'bn' ? 'বন্ধ আছে' : 'Alarm off';
  }

  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return lang === 'bn' ? 'এখনই বাজবে' : 'Ringing now';
  }

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  if (hours === 0 && minutes === 0) {
    return lang === 'bn' ? '১ মিনিটের কম সময়ে বাজবে' : 'Rings in less than a minute';
  }

  if (hours === 0) {
    return lang === 'bn' ? `${toBn(minutes)} মিনিট পর বাজবে` : `Rings in ${minutes} minutes`;
  }

  if (minutes === 0) {
    return lang === 'bn' ? `${toBn(hours)} ঘণ্টা পর বাজবে` : `Rings in ${hours} hours`;
  }

  return lang === 'bn'
    ? `${toBn(hours)} ঘণ্টা ${toBn(minutes)} মিনিট পর বাজবে`
    : `Rings in ${hours} hours ${minutes} minutes`;
}

// ==========================================
// Screen Wake Lock API
// ==========================================
let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
  } catch (err) {
    console.warn('Screen WakeLock error:', err);
  }
}

export function releaseScreenWakeLock(): void {
  try {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.warn('Release WakeLock error:', err);
  }
}

// ==========================================
// Centralized Ringing Alarm State & Event Bus
// ==========================================
type AlarmTriggerCallback = (alarm: AlarmItem | null) => void;
const alarmListeners = new Set<AlarmTriggerCallback>();
let activeRingingAlarm: AlarmItem | null = null;
let lastTriggeredMinute = '';
let autoSilenceTimeoutId: number | null = null;

export function getActiveRingingAlarm(): AlarmItem | null {
  return activeRingingAlarm;
}

export function subscribeToAlarmTrigger(cb: AlarmTriggerCallback): () => void {
  alarmListeners.add(cb);
  cb(activeRingingAlarm);
  return () => {
    alarmListeners.delete(cb);
  };
}

export function triggerAlarmRinging(alarm: AlarmItem): void {
  activeRingingAlarm = alarm;
  requestScreenWakeLock();
  
  const settings = getAlarmSettings();
  const shouldVibrate = alarm.vibrate !== undefined ? alarm.vibrate : settings.vibrateWithAlarm;
  const isAscending = alarm.ascendingVolume !== undefined ? alarm.ascendingVolume : settings.ascendingVolume;

  startAlarmSound(alarm.soundTone, isAscending, shouldVibrate);
  trySendSystemNotification(alarm);

  // Setup auto-silence
  const autoSilenceMins = alarm.autoSilence !== undefined ? alarm.autoSilence : settings.autoSilenceMinutes;
  if (autoSilenceTimeoutId !== null) {
    clearTimeout(autoSilenceTimeoutId);
    autoSilenceTimeoutId = null;
  }
  if (autoSilenceMins > 0) {
    autoSilenceTimeoutId = window.setTimeout(() => {
      dismissActiveAlarm();
    }, autoSilenceMins * 60 * 1000);
  }

  alarmListeners.forEach((listener) => {
    try {
      listener(alarm);
    } catch (e) {
      console.warn('Error in alarm listener:', e);
    }
  });
}

export function dismissActiveAlarm(): void {
  if (autoSilenceTimeoutId !== null) {
    clearTimeout(autoSilenceTimeoutId);
    autoSilenceTimeoutId = null;
  }
  if (activeRingingAlarm) {
    if (activeRingingAlarm.repeatDays.length === 0) {
      toggleAlarm(activeRingingAlarm.id);
    }
  }
  releaseScreenWakeLock();
  stopAlarmSound();
  dismissSystemNotification();
  activeRingingAlarm = null;
  alarmListeners.forEach((listener) => {
    try {
      listener(null);
    } catch (e) {
      console.warn('Error in alarm listener:', e);
    }
  });
}

export function snoozeActiveAlarm(customMinutes?: number): void {
  const settings = getAlarmSettings();
  const minutes = customMinutes ?? activeRingingAlarm?.snoozeDuration ?? settings.snoozeDurationMinutes ?? 5;

  if (activeRingingAlarm) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const snoozedAlarm: AlarmItem = {
      id: `snooze-${Date.now()}`,
      time: snoozeTime,
      labelBn: `(স্নুজ ${minutes}মি) ${activeRingingAlarm.labelBn}`,
      labelEn: `(Snoozed ${minutes}m) ${activeRingingAlarm.labelEn || activeRingingAlarm.labelBn}`,
      enabled: true,
      repeatDays: [],
      soundTone: activeRingingAlarm.soundTone,
      vibrate: activeRingingAlarm.vibrate,
      snoozeDuration: minutes,
      createdAt: Date.now(),
    };
    addOrUpdateAlarm(snoozedAlarm);
  }
  dismissActiveAlarm();
}

/**
 * Checks all stored alarms against current time and triggers if due
 */
export function checkAndTriggerDueAlarms(): void {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const dayOfWeek = now.getDay();

  if (lastTriggeredMinute === timeStr) return;

  const stored = getStoredAlarms();
  const matched = stored.find((a) => {
    if (!a.enabled) return false;
    if (a.time !== timeStr) return false;
    if (a.repeatDays.length === 0) return true; // once
    return a.repeatDays.includes(dayOfWeek);
  });

  if (matched && !activeRingingAlarm) {
    lastTriggeredMinute = timeStr;
    triggerAlarmRinging(matched);
  }
}

// ==========================================
// Capacitor Native Notification & Exact Alarm Synchronization
// ==========================================
let notificationChannelCreated = false;

export async function initAlarmNotificationChannel(): Promise<void> {
  if (notificationChannelCreated) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'alarm_ring_channel',
        name: 'স্মার্ট অ্যালার্ম রিং চ্যানেল (High Priority)',
        description: 'ডিসপ্লে ও লক স্ক্রিনে অ্যালার্ম পপ-আপ প্রদর্শনের চ্যানেল',
        importance: 5, // MAX importance (Heads-up pop up banner on top of other apps & lock screen)
        visibility: 1, // VISIBILITY_PUBLIC (shows on lock screen)
        sound: undefined,
        vibration: true,
        lights: true,
        lightColor: '#EF4444',
      });

      // Register notification actions
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'ALARM_ACTION_TYPE',
            actions: [
              {
                id: 'DISMISS_ACTION',
                title: '🛑 বন্ধ করুন (DISMISS)',
                destructive: true,
              },
              {
                id: 'SNOOZE_ACTION',
                title: '⏰ ৫ মিনিট স্নুজ (SNOOZE)',
              },
            ],
          },
        ],
      });

      // Add click listener
      LocalNotifications.removeAllListeners();
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        if (notificationAction.actionId === 'DISMISS_ACTION') {
          dismissActiveAlarm();
        } else if (notificationAction.actionId === 'SNOOZE_ACTION') {
          snoozeActiveAlarm(5);
        } else {
          // Opened via tapping notification body
          if (activeRingingAlarm) {
            alarmListeners.forEach((listener) => listener(activeRingingAlarm));
          }
        }
      });

      notificationChannelCreated = true;
    } catch (e) {
      console.warn('LocalNotifications setup error:', e);
    }
  }
}

if (typeof window !== 'undefined') {
  initAlarmNotificationChannel();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocalNotifications.requestPermissions();
      await initAlarmNotificationChannel();
      return res.display === 'granted';
    } catch (e) {
      console.warn('Native requestPermissions error:', e);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.requestPermission().then((perm) => perm === 'granted');
  }
  return Promise.resolve(false);
}

/**
 * Synchronizes all active alarms into native Capacitor LocalNotifications
 * using exact scheduling so Android system triggers it even in Doze mode
 */
export async function syncNativeAlarmSchedules(alarms: AlarmItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await initAlarmNotificationChannel();

    // 1. Get pending notifications and cancel old alarm schedules (IDs starting from 1000)
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter((n) => n.id >= 1000 && n.id < 9999)
      .map((n) => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }

    // 2. Schedule upcoming notifications for enabled alarms
    const toSchedule: any[] = [];
    let notifIdCounter = 1000;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const nextDate = calculateNextAlarmDate(alarm);
      if (!nextDate) continue;

      toSchedule.push({
        id: notifIdCounter++,
        title: `🔔 SmartHub Alarm (${alarm.time})`,
        body: `${alarm.labelBn} / ${alarm.labelEn}`,
        channelId: 'alarm_ring_channel',
        ongoing: true,
        autoCancel: false,
        actionTypeId: 'ALARM_ACTION_TYPE',
        extra: {
          alarmId: alarm.id,
        },
        schedule: {
          at: nextDate,
          allowWhileIdle: true,
        },
      });
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch (err) {
    console.warn('Failed to sync native alarm schedules:', err);
  }
}

async function trySendSystemNotification(alarm: AlarmItem): Promise<void> {
  await initAlarmNotificationChannel();

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `🔔 অ্যালার্ম বাজছে! (${alarm.time})`,
            body: `${alarm.labelBn}\nবন্ধ করতে বা স্ক্রিনে দেখতে এখানে চাপ দিন।`,
            id: 9999,
            channelId: 'alarm_ring_channel',
            ongoing: true,
            autoCancel: false,
            actionTypeId: 'ALARM_ACTION_TYPE',
            extra: {
              alarmId: alarm.id,
            },
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      });
    } catch (e) {
      console.warn('Capacitor LocalNotification schedule error:', e);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔔 অ্যালার্ম বাজছে! (${alarm.time})`, {
          body: `${alarm.labelBn}\nবন্ধ করতে বা স্ক্রিনে দেখতে এখানে চাপ দিন।`,
          icon: '/favicon.ico',
          tag: 'smart-alarm-' + alarm.id,
          requireInteraction: true,
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  }
}

export async function dismissSystemNotification(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });
    } catch (e) {
      console.warn('Failed to cancel native notification:', e);
    }
  }
}

// ==========================================
// Custom Sound Storage
// ==========================================
export function getCustomSoundData(): { name: string; url: string } | null {
  try {
    const raw = localStorage.getItem(ALARM_CUSTOM_SOUND_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read custom sound:', e);
  }
  return null;
}

export function saveCustomSoundData(name: string, url: string): void {
  try {
    localStorage.setItem(ALARM_CUSTOM_SOUND_KEY, JSON.stringify({ name, url }));
  } catch (e) {
    console.error('Failed to save custom sound:', e);
  }
}

export function clearCustomSoundData(): void {
  localStorage.removeItem(ALARM_CUSTOM_SOUND_KEY);
}

// Volume helpers
export function getAlarmVolume(): number {
  return getAlarmSettings().volume;
}

export function setAlarmVolume(volume: number): void {
  saveAlarmSettings({ volume: Math.min(1, Math.max(0.1, volume)) });
}

// ==========================================
// Ultra-Reliable Dual Audio Player & Synthesizer
// (WAV synthesis + Web Audio API + Vibration)
// ==========================================
let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let vibrationIntervalId: number | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

export function unlockAudio(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const silentWav =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';
    const a = new Audio(silentWav);
    a.volume = 0.01;
    a.play().then(() => {
      a.pause();
      isAudioUnlocked = true;
    }).catch(() => {});
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  const onUserInteraction = () => {
    unlockAudio();
  };
  window.addEventListener('click', onUserInteraction, { passive: true });
  window.addEventListener('touchstart', onUserInteraction, { passive: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function createWavDataUri(sampleRate: number, durationSec: number, sampleFn: (t: number) => number): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const rawVal = Math.max(-1, Math.min(1, sampleFn(t)));
    const int16 = rawVal < 0 ? rawVal * 0x8000 : rawVal * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

const WAV_CACHE: Partial<Record<SoundToneType, string>> = {};

function getWavToneUri(tone: SoundToneType): string {
  if (WAV_CACHE[tone]) return WAV_CACHE[tone]!;

  const sampleRate = 22050;
  let uri = '';

  if (tone === 'digital') {
    uri = createWavDataUri(sampleRate, 1.8, (t) => {
      const cycle = t % 0.45;
      if (cycle < 0.2) {
        const f1 = Math.sin(2 * Math.PI * 960 * t);
        const f2 = Math.sin(2 * Math.PI * 1440 * t) * 0.5;
        return (f1 + f2) * 0.7;
      }
      return 0;
    });
  } else if (tone === 'radar') {
    uri = createWavDataUri(sampleRate, 1.6, (t) => {
      const cycle = t % 0.8;
      if (cycle < 0.35) {
        const decay = Math.exp(-cycle * 7);
        const freq = 1200 - cycle * 500;
        return Math.sin(2 * Math.PI * freq * t) * decay * 0.85;
      }
      return 0;
    });
  } else if (tone === 'birds') {
    uri = createWavDataUri(sampleRate, 2.0, (t) => {
      const cycle = t % 1.0;
      if (cycle < 0.5) {
        const chirpFreq = 2200 + Math.sin(cycle * 30) * 800;
        const decay = Math.sin((cycle / 0.5) * Math.PI);
        return Math.sin(2 * Math.PI * chirpFreq * t) * decay * 0.6;
      }
      return 0;
    });
  } else if (tone === 'peaceful') {
    uri = createWavDataUri(sampleRate, 2.5, (t) => {
      const d1 = Math.exp(-t * 1.5);
      const c5 = Math.sin(2 * Math.PI * 523.25 * t);
      const e5 = Math.sin(2 * Math.PI * 659.25 * t);
      const g5 = Math.sin(2 * Math.PI * 783.99 * t);
      return (c5 * 0.4 + e5 * 0.3 + g5 * 0.3) * d1 * 0.8;
    });
  } else if (tone === 'azan') {
    uri = createWavDataUri(sampleRate, 3.5, (t) => {
      const phase = Math.floor(t / 0.8);
      const subT = t % 0.8;
      const decay = Math.exp(-subT * 2.2);
      const freqs = [349.23, 440.0, 392.0, 349.23, 293.66];
      const f = freqs[phase % freqs.length];
      const s1 = Math.sin(2 * Math.PI * f * t);
      const s2 = Math.sin(2 * Math.PI * (f * 2) * t) * 0.3;
      return (s1 + s2) * decay * 0.85;
    });
  } else if (tone === 'classic_bell') {
    uri = createWavDataUri(sampleRate, 2.0, (t) => {
      const cycle = t % 0.66;
      const decay = Math.exp(-cycle * 4.5);
      const f1 = Math.sin(2 * Math.PI * 784 * t);
      const f2 = Math.sin(2 * Math.PI * 1568 * t) * 0.4;
      return (f1 + f2) * decay * 0.8;
    });
  } else {
    // Default chime
    uri = createWavDataUri(sampleRate, 2.0, (t) => {
      const cycle = t % 1.0;
      const decay = Math.exp(-cycle * 3.5);
      const f = cycle < 0.5 ? 880 : 1174.66;
      const s1 = Math.sin(2 * Math.PI * f * t);
      const s2 = Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.4;
      return (s1 + s2) * decay * 0.85;
    });
  }

  WAV_CACHE[tone] = uri;
  return uri;
}

export function playChimeNote(
  freq: number,
  type: OscillatorType = 'sine',
  duration: number = 0.4,
  gainValue: number = 0.4
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = getAlarmVolume();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const actualGain = gainValue * vol;
    gain.gain.setValueAtTime(Math.max(0.01, actualGain), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Audio chime note error:', err);
  }
}

export function startAlarmSound(
  tone: SoundToneType = 'chime',
  ascendingVolume: boolean = false,
  shouldVibrate: boolean = true
) {
  stopAlarmSound();
  unlockAudio();

  let targetVol = getAlarmVolume();
  let startVol = ascendingVolume ? 0.2 : targetVol;

  // Custom audio
  if (tone === 'custom') {
    const custom = getCustomSoundData();
    if (custom && custom.url) {
      try {
        activeHtmlAudio = new Audio(custom.url);
        activeHtmlAudio.loop = true;
        activeHtmlAudio.volume = startVol;
        activeHtmlAudio.play().catch((err) => {
          console.warn('Custom audio failed, falling back:', err);
          playWavAudio('chime', startVol);
        });
        if (shouldVibrate) triggerAlarmVibration();
        return;
      } catch (err) {
        console.warn('Custom audio init failed:', err);
      }
    }
  }

  playWavAudio(tone, startVol);
  startSynthesizedTone(tone);

  if (shouldVibrate) {
    triggerAlarmVibration();
  }

  // Handle gradual volume ascension
  if (ascendingVolume && activeHtmlAudio) {
    let currentV = startVol;
    const ascInterval = setInterval(() => {
      if (!activeHtmlAudio) {
        clearInterval(ascInterval);
        return;
      }
      currentV = Math.min(targetVol, currentV + 0.05);
      activeHtmlAudio.volume = currentV;
      if (currentV >= targetVol) {
        clearInterval(ascInterval);
      }
    }, 2000);
  }
}

function playWavAudio(tone: SoundToneType, volume: number) {
  try {
    const wavUri = getWavToneUri(tone);
    activeHtmlAudio = new Audio(wavUri);
    activeHtmlAudio.loop = true;
    activeHtmlAudio.volume = volume;
    activeHtmlAudio.play().catch((err) => {
      console.warn('HTML5 audio play blocked/failed:', err);
    });
  } catch (err) {
    console.warn('HTML5 Audio setup error:', err);
  }
}

function startSynthesizedTone(tone: SoundToneType) {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const playSequence = () => {
    if (tone === 'digital') {
      playChimeNote(960, 'square', 0.15, 0.4);
      setTimeout(() => playChimeNote(960, 'square', 0.15, 0.4), 160);
      setTimeout(() => playChimeNote(1440, 'square', 0.18, 0.45), 320);
      setTimeout(() => playChimeNote(1440, 'square', 0.22, 0.45), 480);
    } else if (tone === 'radar') {
      playChimeNote(1200, 'triangle', 0.25, 0.45);
      setTimeout(() => playChimeNote(1450, 'triangle', 0.28, 0.45), 250);
    } else if (tone === 'azan') {
      playChimeNote(349.23, 'sine', 0.8, 0.45);
      setTimeout(() => playChimeNote(440.0, 'sine', 0.9, 0.5), 650);
      setTimeout(() => playChimeNote(392.0, 'sine', 0.9, 0.45), 1400);
      setTimeout(() => playChimeNote(349.23, 'sine', 1.2, 0.45), 2100);
    } else if (tone === 'birds') {
      playChimeNote(2200, 'sine', 0.1, 0.35);
      setTimeout(() => playChimeNote(2600, 'sine', 0.12, 0.35), 100);
      setTimeout(() => playChimeNote(2900, 'sine', 0.14, 0.35), 220);
    } else if (tone === 'peaceful') {
      playChimeNote(523.25, 'sine', 0.7, 0.35);
      setTimeout(() => playChimeNote(659.25, 'sine', 0.7, 0.35), 300);
      setTimeout(() => playChimeNote(783.99, 'sine', 0.9, 0.35), 600);
    } else if (tone === 'classic_bell') {
      playChimeNote(784, 'triangle', 0.3, 0.45);
      setTimeout(() => playChimeNote(1046.5, 'triangle', 0.35, 0.5), 200);
    } else {
      // Default Chime
      playChimeNote(880, 'sine', 0.4, 0.4);
      setTimeout(() => playChimeNote(1174.66, 'sine', 0.5, 0.45), 220);
    }
  };

  playSequence();
  const interval = tone === 'azan' ? 3200 : tone === 'birds' ? 2200 : 1800;
  alarmIntervalId = window.setInterval(playSequence, interval);
}

function triggerAlarmVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([600, 300, 600, 300, 600, 300]);
      vibrationIntervalId = window.setInterval(() => {
        try {
          navigator.vibrate([600, 300, 600, 300, 600, 300]);
        } catch {
          // ignore
        }
      }, 2500);
    } catch {
      // ignore
    }
  }
}

export function stopAlarmSound() {
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (vibrationIntervalId !== null) {
    clearInterval(vibrationIntervalId);
    vibrationIntervalId = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeHtmlAudio = null;
  }
}
