import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Music,
  Upload,
  Sliders,
  Play,
  Square,
  HelpCircle,
  FileMusic,
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  SoundToneType,
  getStoredAlarms,
  saveStoredAlarms,
  addOrUpdateAlarm,
  deleteAlarm,
  toggleAlarm,
  startAlarmSound,
  stopAlarmSound,
  playChimeNote,
  getCustomSoundData,
  saveCustomSoundData,
  clearCustomSoundData,
  getAlarmVolume,
  setAlarmVolume,
  unlockAudio,
} from '../../utils/alarmStorage';

interface Props {
  lang: Language;
}

const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SmartAlarmClock: React.FC<Props> = ({ lang }) => {
  const [alarms, setAlarms] = useState<AlarmItem[]>(getStoredAlarms());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);

  // Form states
  const [inputTime, setInputTime] = useState<string>('06:00');
  const [inputLabel, setInputLabel] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedTone, setSelectedTone] = useState<SoundToneType>('azan');

  // Sound settings state
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(getAlarmVolume());
  const [customSound, setCustomSound] = useState<{ name: string; url: string } | null>(getCustomSoundData());
  const [previewingTone, setPreviewingTone] = useState<SoundToneType | null>(null);
  const [soundSuccessMsg, setSoundSuccessMsg] = useState<string | null>(null);

  // Triggered alarm state
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const testTimerRef = useRef<number | null>(null);
  const lastTriggeredMinuteRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleSoundTest = () => {
    unlockAudio();
    if (isTestingSound) {
      stopAlarmSound();
      setIsTestingSound(false);
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
    } else {
      setIsTestingSound(true);
      startAlarmSound(selectedTone || 'digital');
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      testTimerRef.current = window.setTimeout(() => {
        stopAlarmSound();
        setIsTestingSound(false);
      }, 7000);
    }
  };

  const handleSetQuick1MinAlarm = () => {
    const testDate = new Date();
    testDate.setMinutes(testDate.getMinutes() + 1);
    const h = String(testDate.getHours()).padStart(2, '0');
    const m = String(testDate.getMinutes()).padStart(2, '0');
    setInputTime(`${h}:${m}`);
    setInputLabel(lang === 'bn' ? 'টেস্ট অ্যালার্ম (১ মিনিট পর)' : 'Test Alarm (1m later)');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check alarms
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;
      const dayOfWeek = now.getDay();

      if (lastTriggeredMinuteRef.current !== timeStr) {
        // Find if any alarm matches
        const matched = alarms.find((a) => {
          if (!a.enabled) return false;
          if (a.time !== timeStr) return false;
          if (a.repeatDays.length === 0) return true; // once
          return a.repeatDays.includes(dayOfWeek);
        });

        if (matched && !ringingAlarm) {
          lastTriggeredMinuteRef.current = timeStr;
          setRingingAlarm(matched);
          startAlarmSound(matched.soundTone);
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      stopAlarmSound();
    };
  }, [alarms, ringingAlarm]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopAlarmSound();
    };
  }, []);

  const handleDismiss = () => {
    stopAlarmSound();
    if (ringingAlarm && ringingAlarm.repeatDays.length === 0) {
      // Disable one-time alarm
      const updated = toggleAlarm(ringingAlarm.id);
      setAlarms(updated);
    }
    setRingingAlarm(null);
  };

  const handleSnooze = (minutes = 5) => {
    stopAlarmSound();
    if (ringingAlarm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const snoozedAlarm: AlarmItem = {
        id: `snooze-${Date.now()}`,
        time: snoozeTime,
        labelBn: `(স্নুজ) ${ringingAlarm.labelBn}`,
        labelEn: `(Snoozed) ${ringingAlarm.labelEn || ringingAlarm.labelBn}`,
        enabled: true,
        repeatDays: [],
        soundTone: ringingAlarm.soundTone,
        createdAt: Date.now(),
      };

      const updated = addOrUpdateAlarm(snoozedAlarm);
      setAlarms(updated);
    }
    setRingingAlarm(null);
  };

  const openCreateModal = () => {
    setEditingAlarm(null);
    setInputTime('06:00');
    setInputLabel('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setSelectedTone('azan');
    setShowAddModal(true);
  };

  const openEditModal = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    setInputTime(alarm.time);
    setInputLabel(alarm.labelBn);
    setSelectedDays(alarm.repeatDays);
    setSelectedTone(alarm.soundTone);
    setShowAddModal(true);
  };

  const handleSaveAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlarm: AlarmItem = {
      id: editingAlarm ? editingAlarm.id : `alarm-${Date.now()}`,
      time: inputTime,
      labelBn: inputLabel.trim() || (lang === 'bn' ? 'অ্যালার্ম' : 'Alarm'),
      labelEn: inputLabel.trim() || 'Alarm',
      enabled: true,
      repeatDays: selectedDays,
      soundTone: selectedTone,
      createdAt: editingAlarm ? editingAlarm.createdAt : Date.now(),
    };

    const updated = addOrUpdateAlarm(newAlarm);
    setAlarms(updated);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAlarm(id);
    setAlarms(updated);
  };

  const handleToggle = (id: string) => {
    const updated = toggleAlarm(id);
    setAlarms(updated);
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const selectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  const clearDays = () => setSelectedDays([]); // Once

  // Sound preview controller
  const handlePlayTonePreview = (tone: SoundToneType) => {
    if (previewingTone === tone) {
      stopAlarmSound();
      setPreviewingTone(null);
      return;
    }
    stopAlarmSound();
    setPreviewingTone(tone);
    startAlarmSound(tone);
    // Auto stop preview after 5 seconds
    setTimeout(() => {
      setPreviewingTone((prev) => (prev === tone ? null : prev));
      stopAlarmSound();
    }, 5000);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    setAlarmVolume(newVol);
    playChimeNote(659.25, 'sine', 0.25, 0.3);
  };

  // Upload Custom Sound from Phone
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(lang === 'bn' ? 'ফাইলটি ৮ মেগাবাইটের চেয়ে ছোট হতে হবে।' : 'File size must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        saveCustomSoundData(file.name, result);
        setCustomSound({ name: file.name, url: result });
        setSelectedTone('custom');
        setSoundSuccessMsg(
          lang === 'bn'
            ? `মাশাআল্লাহ! "${file.name}" রিংটোন হিসেবে সফলভাবে সেভ হয়েছে।`
            : `"${file.name}" saved as custom ringtone.`
        );
        setTimeout(() => setSoundSuccessMsg(null), 4000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustomSound = () => {
    clearCustomSoundData();
    setCustomSound(null);
    if (selectedTone === 'custom') setSelectedTone('azan');
  };

  // Convert numbers to Bengali
  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  // Format 12-hour AM/PM
  const formatTime12h = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? (lang === 'bn' ? 'অপরাহ্ন' : 'PM') : (lang === 'bn' ? 'পূর্বাহ্ন' : 'AM');
    h = h % 12 || 12;
    return {
      time: `${h}:${m}`,
      period,
    };
  };

  const getToneName = (tone: SoundToneType) => {
    switch (tone) {
      case 'azan':
        return lang === 'bn' ? 'ফজর আযান' : 'Fajr Azan';
      case 'birds':
        return lang === 'bn' ? 'পাখির ডাক' : 'Morning Birds';
      case 'chime':
        return lang === 'bn' ? 'মধুর ঘণ্টা' : 'Sweet Chime';
      case 'peaceful':
        return lang === 'bn' ? 'প্রশান্তিময়' : 'Peaceful';
      case 'digital':
        return lang === 'bn' ? 'ডিজিটাল বিপ' : 'Digital Beep';
      case 'radar':
        return lang === 'bn' ? 'রাডার সংকেত' : 'Radar Pulse';
      case 'custom':
        return customSound?.name || (lang === 'bn' ? 'নিজস্ব অডিও' : 'Custom Sound');
      default:
        return 'Chime';
    }
  };

  // Find next upcoming alarm
  const nextAlarm = alarms.find((a) => a.enabled);

  const TONES_LIST: { id: SoundToneType; nameBn: string; nameEn: string; icon: string; descBn: string }[] = [
    { id: 'azan', nameBn: 'ফজর আযান সুর', nameEn: 'Fajr Azan Motifs', icon: '🕌', descBn: 'সুমধুর আধ্যাত্মিক আযানের সুর' },
    { id: 'birds', nameBn: 'পাখির কলকাকলি', nameEn: 'Morning Birds', icon: '🐦', descBn: 'স্নিগ্ধ সকালের মিষ্টি পাখির ডাক' },
    { id: 'chime', nameBn: 'মধুর ঘণ্টা', nameEn: 'Sweet Chime', icon: '🔔', descBn: 'মনোরম মিষ্টি বেলের সুর' },
    { id: 'peaceful', nameBn: 'প্রশান্তিময় মেলোডি', nameEn: 'Peaceful Chord', icon: '🎵', descBn: 'মারিম্বার প্রশান্তিময় সুর' },
    { id: 'digital', nameBn: 'ডিজিটাল বিপ বিপ', nameEn: 'Digital Beep', icon: '⏰', descBn: 'ক্লাসিক ডিজিটাল ঘড়ির অ্যালার্ম' },
    { id: 'radar', nameBn: 'জরুরি রাডার', nameEn: 'Radar Pulse', icon: '🚨', descBn: 'দ্রুত ঘুম ভাঙানোর রাডার সংকেত' },
  ];

  return (
    <div className="space-y-4">
      {/* Active Ringing Full Modal */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl p-6 text-center animate-bounce-subtle">
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shadow-inner animate-pulse">
              <BellRing className="w-10 h-10 text-indigo-600 animate-spin-slow" />
            </div>

            <span className="text-xs font-black uppercase text-indigo-500 tracking-wider mt-4 block">
              {lang === 'bn' ? 'অ্যালার্ম বাজছে!' : 'Alarm Ringing!'}
            </span>

            <h3 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1 font-mono">
              {toBn(formatTime12h(ringingAlarm.time).time)}{' '}
              <span className="text-xl font-bold text-indigo-600">{formatTime12h(ringingAlarm.time).period}</span>
            </h3>

            <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mt-2">
              {lang === 'bn' ? ringingAlarm.labelBn : ringingAlarm.labelEn}
            </p>

            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-xs font-semibold">
              🎵 {getToneName(ringingAlarm.soundTone)}
            </span>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => handleSnooze(5)}
                className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 active:scale-95 transition"
              >
                {lang === 'bn' ? 'স্নুজ (৫ মিনিট)' : 'Snooze (5m)'}
              </button>
              <button
                onClick={handleDismiss}
                className="py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md transition"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Live Clock Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white p-5 shadow-lg border border-indigo-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                {lang === 'bn' ? 'স্মার্ট ডিজিটাল ঘড়ি ও অ্যালার্ম' : 'Smart Clock & Alarm'}
              </h2>
              <span className="text-[11px] text-indigo-200">
                {currentTime.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSoundSettings(!showSoundSettings)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5"
              title={lang === 'bn' ? 'সাউন্ড ও রিংটোন সেট করুন' : 'Sound Settings'}
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'সাউন্ড' : 'Sound'}</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white text-indigo-800 font-bold text-xs shadow-md active:scale-95 transition hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন অ্যালার্ম' : 'New Alarm'}</span>
            </button>
          </div>
        </div>

        {/* Big Live Digital Clock Display */}
        <div className="mt-4 text-center py-2">
          <div className="inline-flex items-baseline gap-2 font-black tracking-tight">
            <span className="text-4xl sm:text-5xl font-mono">
              {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))}
            </span>
          </div>

          {nextAlarm && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-medium">
              <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                {lang === 'bn' ? 'পরবর্তী সক্রিয়:' : 'Next active:'}{' '}
                <strong className="text-white font-bold">
                  {toBn(formatTime12h(nextAlarm.time).time)} {formatTime12h(nextAlarm.time).period}
                </strong>{' '}
                ({lang === 'bn' ? nextAlarm.labelBn : nextAlarm.labelEn}) •{' '}
                <span className="text-amber-200">🎵 {getToneName(nextAlarm.soundTone)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Test Sound & Speaker Verification Banner */}
      <div className={`p-4 rounded-3xl border transition shadow-xs flex items-center justify-between gap-3 ${
        isTestingSound
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
          : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isTestingSound ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}>
            {isTestingSound ? <BellRing className="w-5 h-5 animate-spin-slow" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {isTestingSound
                ? (lang === 'bn' ? 'অ্যালার্ম সাউন্ড বাজছে...' : 'Alarm Sound is Playing...')
                : (lang === 'bn' ? 'ফোনের স্পিকার ও সাউন্ড টেস্ট করুন' : 'Test Alarm Sound & Speaker')}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isTestingSound
                ? (lang === 'bn' ? 'সাউন্ড শুনতে পেলে স্পিকার ঠিক আছে' : 'If hearing sound, audio is working')
                : (lang === 'bn' ? '১ ক্লিকেই অ্যালার্ম সাউন্ড বেজে উঠবে' : 'Click to test alarm ringtone now')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSoundTest}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 shadow-md active:scale-95 transition flex items-center gap-1.5 ${
            isTestingSound
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isTestingSound ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{lang === 'bn' ? 'বন্ধ করুন' : 'Stop Test'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{lang === 'bn' ? 'সাউন্ড বাজান' : 'Test Sound'}</span>
            </>
          )}
        </button>
      </div>

      {/* Prominent Sound & Ringtone Settings Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'অ্যালার্ম সাউন্ড ও রিংটোন সেটিংস' : 'Alarm Ringtone & Sound Settings'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn'
                  ? 'পছন্দের সুর শুনে নির্বাচন করুন বা মোবাইলের নিজস্ব অডিও আপলোড করুন'
                  : 'Choose a melody or upload custom ringtone from phone'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSoundSettings(!showSoundSettings)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showSoundSettings ? (lang === 'bn' ? 'সংক্ষিপ্ত করুন' : 'Collapse') : (lang === 'bn' ? 'বিস্তারিত দেখুন' : 'Expand')}
          </button>
        </div>

        {/* Success toast */}
        {soundSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{soundSuccessMsg}</span>
          </div>
        )}

        {/* Volume Slider Control */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'bn' ? 'অ্যালার্মের সাউন্ড ভলিউম:' : 'Alarm Sound Volume:'}</span>
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {toBn(Math.round(volume * 100))}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Tone Selection Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
            {lang === 'bn' ? 'বিল্ট-ইন মধুর সুরসমূহ (প্লে করে শুনুন):' : 'Built-in Tones (Click to test):'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TONES_LIST.map((tone) => {
              const isPlaying = previewingTone === tone.id;
              return (
                <div
                  key={tone.id}
                  className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-center justify-between group bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{tone.icon}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {lang === 'bn' ? tone.nameBn : tone.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{tone.descBn}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlayTonePreview(tone.id)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition shrink-0 active:scale-95 ${
                      isPlaying
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                    title={isPlaying ? 'বন্ধ করুন' : 'প্লে করুন'}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{isPlaying ? (lang === 'bn' ? 'স্টপ' : 'Stop') : (lang === 'bn' ? 'শুনুন' : 'Play')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Phone Ringtone / MP3 Section */}
        <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileMusic className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'মোবাইলের নিজস্ব রিংটোন / অডিও MP3' : 'Custom Audio from Device'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'আপনার মেমোরির যেকোনো আযান, নাত বা রিংটোন ফাইল সরাসরি যুক্ত করুন'
                    : 'Use any Azan or ringtone audio file from your mobile storage'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ ফাইল আপলোড করুন' : '+ Upload File'}</span>
              </button>
            </div>
          </div>

          {customSound && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {customSound.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                  {lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={() => handlePlayTonePreview('custom')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    previewingTone === 'custom' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title="শুনুন"
                >
                  {previewingTone === 'custom' ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleRemoveCustomSound}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How to use guide banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === 'bn'
              ? '💡 সাউন্ড সেট করার নিয়ম: নতুন অ্যালার্ম তৈরি করার সময় অথবা বিদ্যমান অ্যালার্মের ওপর ট্যাপ করে পছন্দের সুর সিলেক্ট করুন। নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে সেই সুরেই অ্যালার্ম বেজে উঠবে।'
              : '💡 How to set: Select your preferred tone when creating or editing an alarm. It will automatically ring with that tone at the set time.'}
          </p>
        </div>
      </div>

      {/* Alarms List Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {lang === 'bn' ? `সেট করা অ্যালার্মসমূহ (${alarms.length})` : `Saved Alarms (${alarms.length})`}
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {lang === 'bn' ? 'অফলাইনে শতভাগ কাজ করে' : '100% Offline Reliable'}
          </span>
        </div>

        {alarms.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
            <p className="text-xs font-medium">
              {lang === 'bn' ? 'কোনো অ্যালার্ম সেট করা নেই' : 'No alarms set yet'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-4"
            >
              {lang === 'bn' ? '+ প্রথম অ্যালার্ম তৈরি করুন' : '+ Create your first alarm'}
            </button>
          </div>
        ) : (
          alarms.map((alarm) => {
            const time12 = formatTime12h(alarm.time);
            return (
              <div
                key={alarm.id}
                className={`p-4 rounded-2xl border transition shadow-xs flex items-center justify-between ${
                  alarm.enabled
                    ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className="min-w-0 cursor-pointer flex-1"
                  onClick={() => openEditModal(alarm)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                      {toBn(time12.time)}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {time12.period}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {alarm.labelBn}
                    </span>

                    {/* Tone Badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
                      <span>🎵</span>
                      <span>{getToneName(alarm.soundTone)}</span>
                    </span>

                    {/* Days info */}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {alarm.repeatDays.length === 7
                        ? lang === 'bn' ? 'প্রতিদিন' : 'Everyday'
                        : alarm.repeatDays.length === 0
                        ? lang === 'bn' ? 'একবার' : 'Once'
                        : alarm.repeatDays.map((d) => (lang === 'bn' ? DAYS_BN[d] : DAYS_EN[d])).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {/* Test Sound Button */}
                  <button
                    onClick={() => handlePlayTonePreview(alarm.soundTone)}
                    title={lang === 'bn' ? 'সুরটি শুনুন' : 'Preview tone'}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Toggle On/Off Switch */}
                  <button
                    onClick={() => handleToggle(alarm.id)}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative flex items-center ${
                      alarm.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleDelete(alarm.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Alarm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">
                  {editingAlarm
                    ? lang === 'bn'
                      ? 'অ্যালার্ম পরিবর্তন করুন'
                      : 'Edit Alarm'
                    : lang === 'bn'
                    ? 'নতুন অ্যালার্ম সেট করুন'
                    : 'Set New Alarm'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlarm} className="mt-4 space-y-4">
              {/* Time Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যালার্মের সময় (২৪ ঘণ্টা ফরম্যাট)' : 'Alarm Time'}
                </label>
                <input
                  type="time"
                  required
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="w-full px-4 py-3 text-3xl font-black font-mono text-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleSetQuick1MinAlarm}
                  className="mt-2 w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{lang === 'bn' ? '⚡ এখনই ১ মিনিট পর টেস্ট এলার্ম সেট করুন' : '⚡ Set alarm for 1 min later to test'}</span>
                </button>
              </div>

              {/* Label & Quick Suggestions */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যালার্মের নাম / লেবেল' : 'Alarm Label'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: ফজরের সালাত, ঔষধ, পড়াশোনা' : 'e.g. Fajr prayer, Medicine'}
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    lang === 'bn' ? 'ফজরের সালাত' : 'Fajr Prayer',
                    lang === 'bn' ? 'ঔষধ খাওয়ার সময়' : 'Take Medicine',
                    lang === 'bn' ? 'সকালের ব্যায়াম' : 'Morning Workout',
                    lang === 'bn' ? 'কাজ শুরু' : 'Start Work',
                    lang === 'bn' ? 'পড়ালেখা' : 'Study Time',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setInputLabel(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat Days Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'পুনরাবৃত্তি (দিনসমূহ)' : 'Repeat Days'}
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllDays}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {lang === 'bn' ? 'সবদিন' : 'Daily'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearDays}
                      className="text-slate-500 hover:underline"
                    >
                      {lang === 'bn' ? 'একবার' : 'Once'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const active = selectedDays.includes(dayIdx);
                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => toggleDay(dayIdx)}
                        className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <span>{lang === 'bn' ? DAYS_BN[dayIdx] : DAYS_EN[dayIdx]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Tone Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যালার্মের সুর / রিংটোন পছন্দ করুন:' : 'Choose Alarm Ringtone:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES_LIST.map((tone) => {
                    const isSelected = selectedTone === tone.id;
                    const isPlaying = previewingTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          setSelectedTone(tone.id);
                          handlePlayTonePreview(tone.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{tone.icon}</span>
                          <span className="truncate">{lang === 'bn' ? tone.nameBn : tone.nameEn}</span>
                        </div>
                        <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isPlaying ? 'text-indigo-600 animate-pulse' : 'opacity-40'}`} />
                      </button>
                    );
                  })}

                  {/* Custom option in modal if available */}
                  {customSound && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTone('custom');
                        handlePlayTonePreview('custom');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between col-span-2 transition ${
                        selectedTone === 'custom'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>📁</span>
                        <span className="truncate">
                          {lang === 'bn' ? `নিজস্ব: ${customSound.name}` : `Custom: ${customSound.name}`}
                        </span>
                      </div>
                      <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
