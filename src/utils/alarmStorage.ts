export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" 24h
  labelBn: string;
  labelEn: string;
  enabled: boolean;
  repeatDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Empty array means "Once" (একবার)
  soundTone: 'chime' | 'digital' | 'peaceful' | 'radar';
  createdAt: number;
}

export const ALARMS_STORAGE_KEY = 'smart_utility_alarms_v1';

export const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-fajr',
    time: '05:00',
    labelBn: 'ফজরের সালাত ও ভোর',
    labelEn: 'Fajr Prayer & Dawn',
    enabled: true,
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    soundTone: 'peaceful',
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
    if (Array.isArray(parsed)) {
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
// Web Audio API Synthesizer (100% Offline)
// ==========================================
let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChimeNote(freq: number, type: OscillatorType = 'sine', duration: number = 0.4, gainValue: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Audio chime note error:', err);
  }
}

export function startAlarmSound(tone: AlarmItem['soundTone'] = 'chime') {
  stopAlarmSound();
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }

  const playSequence = () => {
    if (tone === 'peaceful') {
      // Gentle chord notes
      playChimeNote(523.25, 'sine', 0.6, 0.25); // C5
      setTimeout(() => playChimeNote(659.25, 'sine', 0.6, 0.25), 250); // E5
      setTimeout(() => playChimeNote(783.99, 'sine', 0.8, 0.25), 500); // G5
      setTimeout(() => playChimeNote(1046.5, 'sine', 1.0, 0.3), 750); // C6
    } else if (tone === 'digital') {
      // Classic electronic beep-beep-beep
      playChimeNote(880, 'square', 0.12, 0.2);
      setTimeout(() => playChimeNote(880, 'square', 0.12, 0.2), 160);
      setTimeout(() => playChimeNote(880, 'square', 0.12, 0.2), 320);
      setTimeout(() => playChimeNote(1174, 'square', 0.25, 0.25), 480);
    } else if (tone === 'radar') {
      // Urgent radar pulses
      playChimeNote(950, 'triangle', 0.18, 0.3);
      setTimeout(() => playChimeNote(1200, 'triangle', 0.22, 0.35), 200);
      setTimeout(() => playChimeNote(1450, 'triangle', 0.3, 0.35), 400);
    } else {
      // Default Chime (Bell)
      playChimeNote(659.25, 'sine', 0.35, 0.3); // E5
      setTimeout(() => playChimeNote(830.61, 'sine', 0.35, 0.3), 180); // G#5
      setTimeout(() => playChimeNote(987.77, 'sine', 0.5, 0.35), 360); // B5
    }
  };

  playSequence();
  alarmIntervalId = window.setInterval(playSequence, 2000);
}

export function stopAlarmSound() {
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}
