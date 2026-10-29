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
// Web Audio API Synthesizer & Sound Player
// ==========================================
let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let customAudioElement: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChimeNote(
  freq: number,
  type: OscillatorType = 'sine',
  duration: number = 0.4,
  gainValue: number = 0.3
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
    gain.gain.setValueAtTime(actualGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Audio chime note error:', err);
  }
}

export function startAlarmSound(tone: SoundToneType = 'chime') {
  stopAlarmSound();

  // If user selected custom sound and has uploaded one
  if (tone === 'custom') {
    const custom = getCustomSoundData();
    if (custom && custom.url) {
      try {
        customAudioElement = new Audio(custom.url);
        customAudioElement.loop = true;
        customAudioElement.volume = getAlarmVolume();
        customAudioElement.play().catch((err) => {
          console.warn('Audio play failed, falling back to synthesizer:', err);
          startSynthesizedTone('azan');
        });
        return;
      } catch (err) {
        console.warn('Custom audio init failed:', err);
      }
    }
    // Fallback to azan if no custom sound uploaded
    startSynthesizedTone('azan');
    return;
  }

  startSynthesizedTone(tone);
}

function startSynthesizedTone(tone: SoundToneType) {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }

  const playSequence = () => {
    if (tone === 'azan') {
      // Spiritual harmonic Azan cadence (gentle, solemn, uplifting)
      // "Allahu Akbar" melodic motif
      playChimeNote(293.66, 'sine', 1.0, 0.4); // D4
      setTimeout(() => playChimeNote(349.23, 'sine', 0.9, 0.4), 600); // F4
      setTimeout(() => playChimeNote(440.0, 'sine', 1.4, 0.45), 1100); // A4
      setTimeout(() => playChimeNote(392.0, 'sine', 1.1, 0.4), 2100); // G4
      setTimeout(() => playChimeNote(349.23, 'sine', 1.5, 0.4), 2900); // F4
    } else if (tone === 'birds') {
      // Gentle morning birds chirping
      playChimeNote(1760, 'sine', 0.08, 0.25);
      setTimeout(() => playChimeNote(2349, 'sine', 0.09, 0.3), 80);
      setTimeout(() => playChimeNote(2637, 'sine', 0.12, 0.25), 170);

      setTimeout(() => {
        playChimeNote(1975, 'sine', 0.07, 0.25);
        setTimeout(() => playChimeNote(2793, 'sine', 0.1, 0.3), 90);
      }, 500);

      setTimeout(() => {
        playChimeNote(1567, 'sine', 0.1, 0.2);
        setTimeout(() => playChimeNote(2093, 'sine', 0.12, 0.25), 100);
      }, 1000);
    } else if (tone === 'peaceful') {
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
      // Default Chime (Sweet Bell)
      playChimeNote(659.25, 'sine', 0.35, 0.3); // E5
      setTimeout(() => playChimeNote(830.61, 'sine', 0.35, 0.3), 180); // G#5
      setTimeout(() => playChimeNote(987.77, 'sine', 0.5, 0.35), 360); // B5
    }
  };

  playSequence();
  const interval = tone === 'azan' ? 4200 : tone === 'birds' ? 2400 : 2000;
  alarmIntervalId = window.setInterval(playSequence, interval);
}

export function stopAlarmSound() {
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (customAudioElement) {
    try {
      customAudioElement.pause();
      customAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    customAudioElement = null;
  }
}
