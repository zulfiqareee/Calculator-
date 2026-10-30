export type SoundToneType = 'azan' | 'birds' | 'chime' | 'peaceful' | 'digital' | 'radar' | 'custom';

export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" 24h
  labelBn: string;
  labelEn: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty array means "Once" (একবার)
  soundTone: SoundToneType;
  customSoundName?: string;
  createdAt: number;
}

export const ALARMS_STORAGE_KEY = 'smart_utility_alarms_v2';
export const ALARM_CUSTOM_SOUND_KEY = 'smart_utility_custom_sound_data';
export const ALARM_VOLUME_KEY = 'smart_utility_alarm_volume';

export const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-fajr',
    time: '05:00',
    labelBn: 'ফজরের সালাত ও ভোর',
    labelEn: 'Fajr Prayer & Dawn',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    soundTone: 'azan',
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
    createdAt: Date.now() - 50000,
  },
];

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
// Centralized Ringing Alarm State & Event Bus
// ==========================================
type AlarmTriggerCallback = (alarm: AlarmItem | null) => void;
const alarmListeners = new Set<AlarmTriggerCallback>();
let activeRingingAlarm: AlarmItem | null = null;
let lastTriggeredMinute = '';

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
  startAlarmSound(alarm.soundTone);
  trySendSystemNotification(alarm);

  alarmListeners.forEach((listener) => {
    try {
      listener(alarm);
    } catch (e) {
      console.warn('Error in alarm listener:', e);
    }
  });
}

export function dismissActiveAlarm(): void {
  if (activeRingingAlarm) {
    if (activeRingingAlarm.repeatDays.length === 0) {
      toggleAlarm(activeRingingAlarm.id);
    }
  }
  stopAlarmSound();
  activeRingingAlarm = null;
  alarmListeners.forEach((listener) => {
    try {
      listener(null);
    } catch (e) {
      console.warn('Error in alarm listener:', e);
    }
  });
}

export function snoozeActiveAlarm(minutes = 5): void {
  if (activeRingingAlarm) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const snoozedAlarm: AlarmItem = {
      id: `snooze-${Date.now()}`,
      time: snoozeTime,
      labelBn: `(স্নুজ) ${activeRingingAlarm.labelBn}`,
      labelEn: `(Snoozed) ${activeRingingAlarm.labelEn || activeRingingAlarm.labelBn}`,
      enabled: true,
      repeatDays: [],
      soundTone: activeRingingAlarm.soundTone,
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

export function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.requestPermission().then((perm) => perm === 'granted');
  }
  return Promise.resolve(false);
}

function trySendSystemNotification(alarm: AlarmItem): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(`🔔 অ্যালার্ম বাজছে! (${alarm.time})`, {
          body: `${alarm.labelBn}\nবন্ধ করতে এখানে চাপ দিন।`,
          icon: '/favicon.ico',
          tag: 'smart-alarm-' + alarm.id,
        });
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  }
}

// ==========================================
// Custom Sound (User's uploaded MP3 / Audio)
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

// Volume setting (0.1 to 1.0)
export function getAlarmVolume(): number {
  try {
    const v = localStorage.getItem(ALARM_VOLUME_KEY);
    if (v !== null) return Math.min(1, Math.max(0.1, Number(v)));
  } catch {
    // ignore
  }
  return 0.8;
}

export function setAlarmVolume(volume: number): void {
  try {
    localStorage.setItem(ALARM_VOLUME_KEY, String(volume));
  } catch {
    // ignore
  }
}

// ==========================================
// Ultra-Reliable Dual Audio Player & Synthesizer
// (HTML5 Audio with Base64 WAV + Web Audio API + Vibration)
// ==========================================

let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let vibrationIntervalId: number | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

/**
 * Pre-unlocks AudioContext and HTML5 audio on first user touch/click
 */
export function unlockAudio(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Silent micro audio to satisfy iOS / Android webview autoplay policies
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

// Auto-register touch & click listeners on window
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

/**
 * Creates 16-bit PCM Mono WAV Data URI
 */
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
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
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

// Cached WAV sound URIs for instant playback
const WAV_CACHE: Partial<Record<SoundToneType, string>> = {};

function getWavToneUri(tone: SoundToneType): string {
  if (WAV_CACHE[tone]) return WAV_CACHE[tone]!;

  const sampleRate = 22050;
  let uri = '';

  if (tone === 'digital') {
    // Loud classic electronic alarm: Beep-Beep-Beep-Beep
    uri = createWavDataUri(sampleRate, 1.8, (t) => {
      // 4 beeps in 1.8 seconds
      const cycle = t % 0.45;
      if (cycle < 0.2) {
        // High frequency piercing square/sine combo
        const f1 = Math.sin(2 * Math.PI * 960 * t);
        const f2 = Math.sin(2 * Math.PI * 1440 * t) * 0.5;
        return (f1 + f2) * 0.7;
      }
      return 0;
    });
  } else if (tone === 'radar') {
    // Sonar radar pulses: Ping - Ping
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
    // Morning birds chirping
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
    // Soft melodic bell chord
    uri = createWavDataUri(sampleRate, 2.5, (t) => {
      const d1 = Math.exp(-t * 1.5);
      const c5 = Math.sin(2 * Math.PI * 523.25 * t);
      const e5 = Math.sin(2 * Math.PI * 659.25 * t);
      const g5 = Math.sin(2 * Math.PI * 783.99 * t);
      return (c5 * 0.4 + e5 * 0.3 + g5 * 0.3) * d1 * 0.8;
    });
  } else if (tone === 'azan') {
    // Melodic spiritual harmonic prayer chime
    uri = createWavDataUri(sampleRate, 3.5, (t) => {
      const phase = Math.floor(t / 0.8);
      const subT = t % 0.8;
      const decay = Math.exp(-subT * 2.2);
      const freqs = [349.23, 440.0, 392.0, 349.23, 293.66]; // F4, A4, G4, F4, D4
      const f = freqs[phase % freqs.length];
      const s1 = Math.sin(2 * Math.PI * f * t);
      const s2 = Math.sin(2 * Math.PI * (f * 2) * t) * 0.3;
      return (s1 + s2) * decay * 0.85;
    });
  } else {
    // Default 'chime': Rich, loud, pleasant alarm chime
    uri = createWavDataUri(sampleRate, 2.0, (t) => {
      const cycle = t % 1.0;
      const decay = Math.exp(-cycle * 3.5);
      const f = cycle < 0.5 ? 880 : 1174.66; // A5 then D6
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

/**
 * Starts the alarm sound and device vibration with maximum reliability
 */
export function startAlarmSound(tone: SoundToneType = 'chime') {
  stopAlarmSound();
  unlockAudio();

  const vol = getAlarmVolume();

  // 1. Try Custom Audio if user uploaded one
  if (tone === 'custom') {
    const custom = getCustomSoundData();
    if (custom && custom.url) {
      try {
        activeHtmlAudio = new Audio(custom.url);
        activeHtmlAudio.loop = true;
        activeHtmlAudio.volume = vol;
        activeHtmlAudio.play().catch((err) => {
          console.warn('Custom audio failed, falling back to digital:', err);
          playWavAudio('digital', vol);
        });
        triggerAlarmVibration();
        return;
      } catch (err) {
        console.warn('Custom audio init failed:', err);
      }
    }
  }

  // 2. Play HTML5 Audio via generated high-volume WAV
  playWavAudio(tone, vol);

  // 3. Parallel Web Audio API synthesized notes for extra richness
  startSynthesizedTone(tone);

  // 4. Start haptic vibration
  triggerAlarmVibration();
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

/**
 * Triggers device vibration pattern (if supported by mobile device)
 */
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

/**
 * Stops alarm audio, synthesizer, and vibration completely
 */
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

