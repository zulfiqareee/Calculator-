/**
 * SmartHub - Real Android-Reliable Alarm Engine
 * Features:
 * - Persistent local storage (zero internet/Firebase dependency)
 * - Exact Android scheduling via @capacitor/local-notifications (allowWhileIdle: true)
 * - Restores schedules on app launch & boot
 * - Sorted alarms by next scheduled trigger time
 * - High-precision countdown calculation
 * - Web Audio API + synthesized WAV audio playback (works 100% offline)
 * - Haptic vibration and Screen WakeLock support
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Language } from '../types';

export type SoundToneType =
  | 'chime'
  | 'radar'
  | 'azan'
  | 'digital'
  | 'peaceful'
  | 'birds'
  | 'classic_bell'
  | 'custom';

export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" in 24-hour format
  labelBn: string;
  labelEn: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty array means "Once" (একবার)
  soundTone: SoundToneType;
  customSoundName?: string;
  vibrate?: boolean;
  snoozeEnabled?: boolean;
  snoozeDuration?: number; // minutes
  autoSilence?: number; // minutes (0 for never)
  ascendingVolume?: boolean;
  createdAt: number;
}

export interface GlobalAlarmSettings {
  defaultRingtone: SoundToneType;
  timerRingtone: string;
  volume: number; // 0.1 to 1.0
  autoSilenceMinutes: number; // 1, 5, 10, 15, 20, 30, 0 (never)
  snoozeDurationMinutes: number; // 5, 10, 15, 20
  vibrateWithAlarm: boolean;
  ascendingVolume: boolean;
  silenceOnFlip: boolean;
}

export const ALARMS_STORAGE_KEY = 'smarthub_alarms_v4';
export const ALARM_SETTINGS_KEY = 'smarthub_alarm_settings_v4';
export const ALARM_CUSTOM_SOUND_KEY = 'smarthub_custom_sound_v4';

export const DEFAULT_ALARM_SETTINGS: GlobalAlarmSettings = {
  defaultRingtone: 'chime',
  timerRingtone: 'bell_chime',
  volume: 0.85,
  autoSilenceMinutes: 10,
  snoozeDurationMinutes: 5,
  vibrateWithAlarm: true,
  ascendingVolume: false,
  silenceOnFlip: true,
};

export const INITIAL_DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-fajr-0500',
    time: '05:00',
    labelBn: 'ফজরের সালাত ও ভোর',
    labelEn: 'Fajr Prayer & Dawn',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    soundTone: 'azan',
    vibrate: true,
    snoozeEnabled: true,
    snoozeDuration: 5,
    autoSilence: 10,
    ascendingVolume: false,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'alarm-work-0830',
    time: '08:30',
    labelBn: 'সকালের রুটিন ও কাজ',
    labelEn: 'Morning Work Routine',
    enabled: false,
    repeatDays: [1, 2, 3, 4, 5], // Mon to Fri
    soundTone: 'chime',
    vibrate: true,
    snoozeEnabled: true,
    snoozeDuration: 5,
    autoSilence: 10,
    ascendingVolume: false,
    createdAt: Date.now() - 50000,
  },
];

// ==========================================
// 1. Settings Access
// ==========================================
export function getAlarmSettings(): GlobalAlarmSettings {
  try {
    const raw = localStorage.getItem(ALARM_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Error reading alarm settings:', err);
  }
  return DEFAULT_ALARM_SETTINGS;
}

export function saveAlarmSettings(patch: Partial<GlobalAlarmSettings>): GlobalAlarmSettings {
  try {
    const current = getAlarmSettings();
    const updated = { ...current, ...patch };
    localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving alarm settings:', err);
    return getAlarmSettings();
  }
}

// ==========================================
// 2. Next Trigger & Sorting Calculations
// ==========================================
export function calculateNextAlarmDate(alarm: AlarmItem): Date | null {
  if (!alarm.enabled) return null;

  const [hoursStr, minutesStr] = alarm.time.split(':');
  const targetHour = parseInt(hoursStr, 10);
  const targetMinute = parseInt(minutesStr, 10);

  const now = new Date();

  // If one-time alarm (empty repeatDays)
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(targetHour, targetMinute, 0, 0);
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  // If repeat days are set (0=Sun, 1=Mon, ..., 6=Sat)
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

export function sortAlarmsByNextFiring(alarms: AlarmItem[]): AlarmItem[] {
  return [...alarms].sort((a, b) => {
    // Enabled alarms first, sorted by next trigger time
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;

    if (a.enabled && b.enabled) {
      const nextA = calculateNextAlarmDate(a)?.getTime() ?? 0;
      const nextB = calculateNextAlarmDate(b)?.getTime() ?? 0;
      if (nextA !== nextB) return nextA - nextB;
    }

    return a.time.localeCompare(b.time);
  });
}

export function formatAlarmCountdown(nextDate: Date | null, lang: Language): string {
  if (!nextDate) {
    return lang === 'bn' ? 'অ্যালার্ম বন্ধ' : 'Alarm off';
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
// 3. Stored Alarms CRUD
// ==========================================
export function getStoredAlarms(): AlarmItem[] {
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (!raw) {
      saveStoredAlarms(INITIAL_DEFAULT_ALARMS);
      return sortAlarmsByNextFiring(INITIAL_DEFAULT_ALARMS);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sortAlarmsByNextFiring(parsed);
    }
    return sortAlarmsByNextFiring(INITIAL_DEFAULT_ALARMS);
  } catch (err) {
    console.warn('Error reading stored alarms:', err);
    return sortAlarmsByNextFiring(INITIAL_DEFAULT_ALARMS);
  }
}

export function saveStoredAlarms(alarms: AlarmItem[]): void {
  try {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
    // Synchronize native Android notifications immediately
    syncNativeAlarmSchedules(alarms).catch((err) => {
      console.warn('Native alarm schedule sync notice:', err);
    });
  } catch (err) {
    console.error('Failed to save alarms to localStorage:', err);
  }
}

export function addOrUpdateAlarm(alarm: AlarmItem): AlarmItem[] {
  const current = getStoredAlarms();
  const index = current.findIndex((a) => a.id === alarm.id);
  let updated: AlarmItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = alarm;
  } else {
    updated = [alarm, ...current];
  }
  const sorted = sortAlarmsByNextFiring(updated);
  saveStoredAlarms(sorted);
  return sorted;
}

export function deleteAlarm(id: string): AlarmItem[] {
  const current = getStoredAlarms();
  const updated = current.filter((a) => a.id !== id);
  const sorted = sortAlarmsByNextFiring(updated);
  saveStoredAlarms(sorted);
  return sorted;
}

export function toggleAlarm(id: string): AlarmItem[] {
  const current = getStoredAlarms();
  const updated = current.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
  const sorted = sortAlarmsByNextFiring(updated);
  saveStoredAlarms(sorted);
  return sorted;
}

// ==========================================
// 4. Native Capacitor Exact Alarm Scheduling
// ==========================================
let notificationChannelCreated = false;

export async function initAlarmNotificationChannel(): Promise<void> {
  if (notificationChannelCreated) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'alarm_ring_channel',
        name: 'স্মার্ট অ্যালার্ম হাই প্রায়োরিটি (High Priority)',
        description: 'ফুলস্ক্রিন অ্যালার্ম প্রদর্শন ও লক স্ক্রিনে সাউন্ডের চ্যানেল',
        importance: 5, // MAX importance - heads-up pop-up on lock screen
        visibility: 1, // Public visibility
        sound: undefined,
        vibration: true,
        lights: true,
        lightColor: '#0B63F6',
      });

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

      LocalNotifications.removeAllListeners();
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        if (action.actionId === 'DISMISS_ACTION') {
          dismissActiveAlarm();
        } else if (action.actionId === 'SNOOZE_ACTION') {
          snoozeActiveAlarm(5);
        } else {
          if (activeRingingAlarm) {
            listeners.forEach((l) => l(activeRingingAlarm));
          }
        }
      });

      notificationChannelCreated = true;
    } catch (e) {
      console.warn('Native channel initialization notice:', e);
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
    return Notification.requestPermission().then((p) => p === 'granted');
  }
  return false;
}

/**
 * Cancels outdated native alarm schedules and sets exact alarms
 * via @capacitor/local-notifications with allowWhileIdle: true
 */
export async function syncNativeAlarmSchedules(alarms: AlarmItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await initAlarmNotificationChannel();

    // Cancel existing scheduled alarms (IDs 1000..9998)
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter((n) => n.id >= 1000 && n.id < 9999)
      .map((n) => ({ id: n.id }));

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }

    // Schedule active alarms
    const toSchedule: any[] = [];
    let idCounter = 1000;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const nextDate = calculateNextAlarmDate(alarm);
      if (!nextDate) continue;

      toSchedule.push({
        id: idCounter++,
        title: `🔔 SmartHub Alarm (${alarm.time})`,
        body: `${alarm.labelBn} / ${alarm.labelEn}`,
        channelId: 'alarm_ring_channel',
        ongoing: true,
        autoCancel: false,
        actionTypeId: 'ALARM_ACTION_TYPE',
        extra: { alarmId: alarm.id },
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
    console.warn('syncNativeAlarmSchedules error:', err);
  }
}

async function sendRingingNotification(alarm: AlarmItem): Promise<void> {
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
            extra: { alarmId: alarm.id },
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      });
    } catch (e) {
      console.warn('Capacitor ringing notification error:', e);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔔 অ্যালার্ম বাজছে! (${alarm.time})`, {
          body: `${alarm.labelBn}\nবন্ধ করতে এখানে চাপ দিন।`,
          icon: '/logo.png',
          tag: 'smarthub-alarm-' + alarm.id,
          requireInteraction: true,
        });
        notif.onclick = () => window.focus();
      } catch (e) {
        console.warn('Web notification error:', e);
      }
    }
  }
}

export async function dismissSystemNotification(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });
    } catch (e) {
      console.warn('dismissSystemNotification error:', e);
    }
  }
}

// ==========================================
// 5. Centralized Ringing State & Event Bus
// ==========================================
type AlarmListener = (alarm: AlarmItem | null) => void;
const listeners = new Set<AlarmListener>();
let activeRingingAlarm: AlarmItem | null = null;
let lastTriggerMinute = '';
let autoSilenceTimer: number | null = null;
let wakeLockSentinel: any = null;

export function getActiveRingingAlarm(): AlarmItem | null {
  return activeRingingAlarm;
}

export function subscribeToAlarmTrigger(cb: AlarmListener): () => void {
  listeners.add(cb);
  cb(activeRingingAlarm);
  return () => {
    listeners.delete(cb);
  };
}

export async function requestScreenWakeLock(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
  } catch (err) {
    console.warn('WakeLock request error:', err);
  }
}

export function releaseScreenWakeLock(): void {
  try {
    if (wakeLockSentinel) {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.warn('WakeLock release error:', err);
  }
}

export function triggerAlarmRinging(alarm: AlarmItem): void {
  activeRingingAlarm = alarm;
  requestScreenWakeLock();

  const settings = getAlarmSettings();
  const shouldVibrate = alarm.vibrate !== undefined ? alarm.vibrate : settings.vibrateWithAlarm;
  const isAscending = alarm.ascendingVolume !== undefined ? alarm.ascendingVolume : settings.ascendingVolume;

  startAlarmAudioPlayback(alarm.soundTone, isAscending, shouldVibrate);
  sendRingingNotification(alarm);

  // Auto-silence setup
  const autoSilenceMins = alarm.autoSilence !== undefined ? alarm.autoSilence : settings.autoSilenceMinutes;
  if (autoSilenceTimer !== null) {
    clearTimeout(autoSilenceTimer);
    autoSilenceTimer = null;
  }
  if (autoSilenceMins > 0) {
    autoSilenceTimer = window.setTimeout(() => {
      dismissActiveAlarm();
    }, autoSilenceMins * 60 * 1000);
  }

  listeners.forEach((fn) => {
    try {
      fn(alarm);
    } catch (e) {
      console.warn('Error in alarm listener callback:', e);
    }
  });
}

export function dismissActiveAlarm(): void {
  if (autoSilenceTimer !== null) {
    clearTimeout(autoSilenceTimer);
    autoSilenceTimer = null;
  }
  if (activeRingingAlarm) {
    // If one-time alarm, turn it off so it doesn't fire next day
    if (!activeRingingAlarm.repeatDays || activeRingingAlarm.repeatDays.length === 0) {
      toggleAlarm(activeRingingAlarm.id);
    }
  }
  releaseScreenWakeLock();
  stopAlarmAudioPlayback();
  dismissSystemNotification();
  activeRingingAlarm = null;

  listeners.forEach((fn) => {
    try {
      fn(null);
    } catch (e) {
      console.warn('Error in alarm dismiss callback:', e);
    }
  });
}

export function snoozeActiveAlarm(customMinutes?: number): void {
  const settings = getAlarmSettings();
  const mins = customMinutes ?? activeRingingAlarm?.snoozeDuration ?? settings.snoozeDurationMinutes ?? 5;

  if (activeRingingAlarm) {
    const nextTime = new Date();
    nextTime.setMinutes(nextTime.getMinutes() + mins);
    const snoozeTimeStr = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}`;

    const snoozedAlarm: AlarmItem = {
      id: `snooze-${Date.now()}`,
      time: snoozeTimeStr,
      labelBn: `(স্নুজ ${mins}মি) ${activeRingingAlarm.labelBn}`,
      labelEn: `(Snoozed ${mins}m) ${activeRingingAlarm.labelEn || activeRingingAlarm.labelBn}`,
      enabled: true,
      repeatDays: [],
      soundTone: activeRingingAlarm.soundTone,
      vibrate: activeRingingAlarm.vibrate,
      snoozeEnabled: true,
      snoozeDuration: mins,
      createdAt: Date.now(),
    };
    addOrUpdateAlarm(snoozedAlarm);
  }
  dismissActiveAlarm();
}

/**
 * Evaluates stored alarms on timer tick and triggers when matching
 */
export function checkAndTriggerDueAlarms(): void {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const dayOfWeek = now.getDay();

  if (lastTriggerMinute === timeStr) return;

  const stored = getStoredAlarms();
  const matched = stored.find((a) => {
    if (!a.enabled) return false;
    if (a.time !== timeStr) return false;
    if (!a.repeatDays || a.repeatDays.length === 0) return true; // once
    return a.repeatDays.includes(dayOfWeek);
  });

  if (matched && !activeRingingAlarm) {
    lastTriggerMinute = timeStr;
    triggerAlarmRinging(matched);
  }
}

// ==========================================
// 6. Custom Audio Data
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

// ==========================================
// 7. Ultra-Reliable Dual Audio Player & Synthesizer
// ==========================================
let audioContextInstance: AudioContext | null = null;
let soundLoopInterval: number | null = null;
let vibrationLoopInterval: number | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let isAudioContextUnlocked = false;

export function unlockAudio(): void {
  if (isAudioContextUnlocked || typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const silent = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w==';
    const a = new Audio(silent);
    a.volume = 0.01;
    a.play().then(() => {
      a.pause();
      isAudioContextUnlocked = true;
    }).catch(() => {});
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  const onInteraction = () => unlockAudio();
  window.addEventListener('click', onInteraction, { passive: true });
  window.addEventListener('touchstart', onInteraction, { passive: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContextInstance || audioContextInstance.state === 'closed') {
    audioContextInstance = new AudioCtx();
  }
  if (audioContextInstance && audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(() => {});
  }
  return audioContextInstance;
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
    // Default sweet chime
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
    const vol = getAlarmSettings().volume;

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

export function startAlarmAudioPlayback(
  tone: SoundToneType = 'chime',
  ascendingVolume: boolean = false,
  shouldVibrate: boolean = true
) {
  stopAlarmAudioPlayback();
  unlockAudio();

  const targetVol = getAlarmSettings().volume;
  const startVol = ascendingVolume ? 0.2 : targetVol;

  if (tone === 'custom') {
    const custom = getCustomSoundData();
    if (custom && custom.url) {
      try {
        activeAudioElement = new Audio(custom.url);
        activeAudioElement.loop = true;
        activeAudioElement.volume = startVol;
        activeAudioElement.play().catch((err) => {
          console.warn('Custom audio playback issue, fallback to chime:', err);
          playWavAudio('chime', startVol);
        });
        if (shouldVibrate) triggerAlarmVibration();
        return;
      } catch (err) {
        console.warn('Custom audio playback failed:', err);
      }
    }
  }

  playWavAudio(tone, startVol);
  startSynthesizedNotes(tone);

  if (shouldVibrate) {
    triggerAlarmVibration();
  }

  if (ascendingVolume && activeAudioElement) {
    let currentV = startVol;
    const ascTimer = setInterval(() => {
      if (!activeAudioElement) {
        clearInterval(ascTimer);
        return;
      }
      currentV = Math.min(targetVol, currentV + 0.05);
      activeAudioElement.volume = currentV;
      if (currentV >= targetVol) {
        clearInterval(ascTimer);
      }
    }, 2000);
  }
}

function playWavAudio(tone: SoundToneType, volume: number) {
  try {
    const wavUri = getWavToneUri(tone);
    activeAudioElement = new Audio(wavUri);
    activeAudioElement.loop = true;
    activeAudioElement.volume = volume;
    activeAudioElement.play().catch((err) => {
      console.warn('WAV audio play blocked:', err);
    });
  } catch (err) {
    console.warn('WAV Audio setup error:', err);
  }
}

function startSynthesizedNotes(tone: SoundToneType) {
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
      playChimeNote(880, 'sine', 0.4, 0.4);
      setTimeout(() => playChimeNote(1174.66, 'sine', 0.5, 0.45), 220);
    }
  };

  playSequence();
  const interval = tone === 'azan' ? 3200 : tone === 'birds' ? 2200 : 1800;
  soundLoopInterval = window.setInterval(playSequence, interval);
}

function triggerAlarmVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([600, 300, 600, 300, 600, 300]);
      vibrationLoopInterval = window.setInterval(() => {
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

export function stopAlarmAudioPlayback() {
  if (soundLoopInterval !== null) {
    clearInterval(soundLoopInterval);
    soundLoopInterval = null;
  }
  if (vibrationLoopInterval !== null) {
    clearInterval(vibrationLoopInterval);
    vibrationLoopInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }
}
