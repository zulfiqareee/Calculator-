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
  triggerAlarmRinging,
  requestNotificationPermission,
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

  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [notificationGranted, setNotificationGranted] = useState<boolean>(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState<boolean>(false);
  const [countdownLockTest, setCountdownLockTest] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const testTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

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

  // Launch Full Alarm Ringing Screen immediately so user can see display, sound & dismiss buttons
  const handleTestFullAlarmDisplay = () => {
    unlockAudio();
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const testItem: AlarmItem = {
      id: 'test-' + Date.now(),
      time: `${h}:${m}`,
      labelBn: lang === 'bn' ? 'টেস্ট অ্যালার্ম (পূর্ণাঙ্গ ডিসপ্লে ও সাউন্ড পরীক্ষা)' : 'Test Alarm Display & Sound',
      labelEn: 'Test Alarm Display & Sound',
      enabled: true,
      repeatDays: [],
      soundTone: selectedTone || 'digital',
      createdAt: Date.now(),
    };
    triggerAlarmRinging(testItem);
  };

  // 5-second countdown test so user can lock screen or go to home screen and verify wake-up
  const start5sLockScreenTest = async () => {
    unlockAudio();
    await requestNotificationPermission();
    setNotificationGranted(true);
    setCountdownLockTest(5);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let count = 5;
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownLockTest(count);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdownLockTest(null);
        handleTestFullAlarmDisplay();
      }
    }, 1000);
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationGranted(granted);
    if (granted) {
      alert(lang === 'bn' ? 'সিস্টেম নোটিফিকেশন সফলভাবে চালু করা হয়েছে!' : 'System notification enabled!');
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
                : (lang === 'bn' ? 'অ্যালার্মের ডিসপ্লে ও সাউন্ড টেস্ট' : 'Test Alarm Display & Audio')}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'ডিসপ্লেতে অ্যালার্ম কেমন দেখাবে ও সাউন্ড কেমন বাজবে তা এখনই পরীক্ষা করুন'
                : 'Test how the alarm looks on screen and sounds'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {/* Instant Full Screen Alarm Display Test Button */}
          <button
            type="button"
            onClick={handleTestFullAlarmDisplay}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="ডিসপ্লেতে অ্যালার্ম কেমন দেখাবে এখনই টেস্ট করুন"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ডিসপ্লে টেস্ট' : 'Display Test'}</span>
          </button>

          {/* 5-second Lock Screen Test Button */}
          <button
            type="button"
            onClick={start5sLockScreenTest}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md bg-purple-600 hover:bg-purple-700 text-white active:scale-95 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="৫ সেকেন্ড পর বাজবে, পাওয়ার বাটন টিপে স্ক্রিন অফ করে পরীক্ষা করুন"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লক স্ক্রিন টেস্ট (৫ সে)' : 'Lock Test (5s)'}</span>
          </button>

          {/* Quick Sound Play Button */}
          <button
            type="button"
            onClick={handleToggleSoundTest}
            className={`px-3 py-2 rounded-2xl text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isTestingSound
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isTestingSound ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'bn' ? 'বন্ধ করুন' : 'Stop'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'bn' ? 'সাউন্ড' : 'Sound'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5-Second Countdown Alert Banner */}
      {countdownLockTest !== null && (
        <div className="p-4 rounded-3xl bg-purple-900 text-white border-2 border-purple-400 shadow-xl animate-pulse flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center font-black text-2xl text-white shadow-inner">
              {toBn(countdownLockTest)}
            </div>
            <div>
              <h5 className="font-bold text-sm text-purple-100">
                {lang === 'bn'
                  ? 'দ্রুত স্ক্রিন অফ বা লক করুন!'
                  : 'Turn off screen or lock phone now!'}
              </h5>
              <p className="text-xs text-purple-200">
                {lang === 'bn'
                  ? `${toBn(countdownLockTest)} সেকেন্ড পর অ্যালার্ম বাজবে এবং ডিসপ্লে অন হবে।`
                  : `Alarm will ring and wake up screen in ${countdownLockTest} seconds.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setCountdownLockTest(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-700 text-xs font-bold hover:bg-purple-600 transition"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Android & Xiaomi Device Permission Guidance Card */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
          <span className="text-lg">⚙️</span>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ডিসপ্লে বন্ধ বা লক থাকলে স্ক্রিন অন না হলে:' : 'If screen does not wake when locked:'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'শাওমি (Xiaomi/Redmi/Poco), অপ্পো ও ভিভো ফোনের ব্যাকগ্রাউন্ড পারমিশন অন করে নিন'
                : 'Enable lock screen display & background popup permission'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAndroidGuideModal(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 active:scale-95 transition cursor-pointer flex items-center gap-1 shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'নিয়ম দেখুন' : 'View Guide'}</span>
        </button>
      </div>

      {/* Optional Notification Permission Helper */}
      {!notificationGranted && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <span className="text-base">📱</span>
            <span>
              {lang === 'bn'
                ? 'স্ক্রিন লক বা ব্যাকগ্রাউন্ডে অ্যালার্মের ব্যানার নোটিফিকেশন পেতে অনুমতি দিন'
                : 'Enable system notifications for lockscreen alerts'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRequestNotification}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 active:scale-95 transition cursor-pointer"
          >
            {lang === 'bn' ? 'চালু করুন' : 'Enable'}
          </button>
        </div>
      )}

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

      {/* Android & Xiaomi Device Lockscreen Permission Guidance Modal */}
      {showAndroidGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl">
                  📱
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {lang === 'bn' ? 'লক স্ক্রিন ও ব্যাকগ্রাউন্ড ডিসপ্লে নির্দেশিকা' : 'Lock Screen & Background Guide'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'শাওমি (Xiaomi/Redmi/Poco), অপ্পো, ভিভো ও অ্যান্ড্রয়েড' : 'Xiaomi, Oppo, Vivo & Android devices'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuideModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {lang === 'bn'
                ? 'মোবাইলের স্ক্রিন লক থাকলে অথবা অন্য অ্যাপ ব্যবহারের সময় অ্যালার্মের পূর্ণাঙ্গ ডিসপ্লে ও বড় রিং স্ক্রিন স্বয়ংক্রিয়ভাবে ভেসে উঠতে নিচের পারমিশনগুলো অন রাখুন:'
                : 'To wake the screen and display the full alarm interface while locked or using other apps, ensure these permissions are active:'}
            </div>

            {/* Step-by-Step Guide */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">১</span>
                  <span>{lang === 'bn' ? 'অ্যাপ সেটিংসে যান' : 'Go to App Settings'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-7 text-[11px]">
                  {lang === 'bn'
                    ? 'ফোনের Settings > Apps > Manage Apps এ গিয়ে "Smart Utility Tools" সিলেক্ট করুন।'
                    : 'Open Phone Settings > Apps > Manage Apps > "Smart Utility Tools".'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">২</span>
                  <span>{lang === 'bn' ? 'লক স্ক্রিনে প্রদর্শন (Show on Lock screen)' : 'Show on Lock Screen'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-7 text-[11px]">
                  {lang === 'bn'
                    ? 'Permissions অথবা Other permissions এ গিয়ে "Show on Lock screen" অপশনটি টিক বা Always Allow করে দিন।'
                    : 'Under Permissions, toggle "Show on Lock screen" to Always Allow.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">৩</span>
                  <span>{lang === 'bn' ? 'ব্যাকগ্রাউন্ড পপ-আপ প্রদর্শন (Display pop-up windows)' : 'Display Pop-up Windows'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-7 text-[11px]">
                  {lang === 'bn'
                    ? '"Display pop-up windows while running in the background" চালু করুন। এর ফলে অন্য অ্যাপে থাকলেও অ্যালার্ম সরাসরি স্ক্রিনে চলে আসবে।'
                    : 'Enable "Display pop-up windows while running in the background" to show overlay while using other apps.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">৪</span>
                  <span>{lang === 'bn' ? 'ব্যাটারি সেভার (Battery Saver)' : 'Battery Optimization'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-7 text-[11px]">
                  {lang === 'bn'
                    ? 'Battery Saver অপশনে "No restrictions" নির্বাচন করুন, যাতে ব্যাকগ্রাউন্ডে অ্যালার্ম বন্ধ না হয়।'
                    : 'Set Battery Saver to "No restrictions" so the alarm service stays alive.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAndroidGuideModal(false)}
                className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 transition"
              >
                {lang === 'bn' ? 'বুঝেছি (বন্ধ করুন)' : 'Got it (Close)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
