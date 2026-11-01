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
  MoreVertical,
  Settings as SettingsIcon,
  Smartphone,
  Vibrate,
  Volume1,
  Timer,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  SoundToneType,
  GlobalAlarmSettings,
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
  getAlarmSettings,
  saveAlarmSettings,
  calculateNextAlarmDate,
  formatAlarmCountdown,
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
  const [settings, setSettings] = useState<GlobalAlarmSettings>(getAlarmSettings());

  // Navigation & Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'general' | 'ringtone' | 'timer' | 'volume' | 'silence' | 'advanced'>('general');
  const [showSystemTimeDialog, setShowSystemTimeDialog] = useState<boolean>(false);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState<boolean>(false);

  // Add/Edit Form states
  const [selectedHour, setSelectedHour] = useState<number>(6);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [inputLabel, setInputLabel] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedTone, setSelectedTone] = useState<SoundToneType>('chime');
  const [alarmVibrate, setAlarmVibrate] = useState<boolean>(true);
  const [alarmSnoozeDuration, setAlarmSnoozeDuration] = useState<number>(5);
  const [alarmAutoSilence, setAlarmAutoSilence] = useState<number>(10);
  const [alarmAscendingVol, setAlarmAscendingVol] = useState<boolean>(false);

  // Sound preview & test states
  const [previewingTone, setPreviewingTone] = useState<SoundToneType | null>(null);
  const [customSound, setCustomSound] = useState<{ name: string; url: string } | null>(getCustomSoundData());
  const [soundSuccessMsg, setSoundSuccessMsg] = useState<string | null>(null);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [countdownLockTest, setCountdownLockTest] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const testTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close 3-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThreeDotMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  // Convert 24h string to 12h display
  const formatTime12h = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: m,
      period,
      formattedBn: `${toBn(String(h).padStart(2, '0'))}:${toBn(m)} ${period === 'AM' ? (lang === 'bn' ? 'পূর্বাহ্ন' : 'AM') : (lang === 'bn' ? 'অপরাহ্ন' : 'PM')}`,
    };
  };

  // Helper to get repeat schedule text
  const getRepeatScheduleText = (repeatDays: number[]) => {
    if (!repeatDays || repeatDays.length === 0) {
      return lang === 'bn' ? 'একবার বাজবে' : 'Ring once';
    }
    if (repeatDays.length === 7) {
      return lang === 'bn' ? 'প্রতিদিন' : 'Daily';
    }
    // Check weekdays (Mon to Fri = 1,2,3,4,5 or Sun to Thu = 0,1,2,3,4)
    const isStandardWeekdays = repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d));
    if (isStandardWeekdays) {
      return lang === 'bn' ? 'সোম - শুক্র' : 'Mon - Fri';
    }
    return repeatDays.map((d) => (lang === 'bn' ? DAYS_BN[d] : DAYS_EN[d])).join(', ');
  };

  // Open Add modal with default fields
  const handleOpenAddModal = () => {
    setEditingAlarm(null);
    const nextHour = (currentTime.getHours() + 1) % 24;
    const p = nextHour >= 12 ? 'PM' : 'AM';
    const h12 = nextHour % 12 || 12;
    setSelectedHour(h12);
    setSelectedMinute(0);
    setSelectedPeriod(p);
    setInputLabel('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setSelectedTone(settings.defaultRingtone || 'chime');
    setAlarmVibrate(settings.vibrateWithAlarm);
    setAlarmSnoozeDuration(settings.snoozeDurationMinutes);
    setAlarmAutoSilence(settings.autoSilenceMinutes);
    setAlarmAscendingVol(settings.ascendingVolume);
    setShowAddModal(true);
  };

  // Open Edit modal with alarm fields
  const handleOpenEditModal = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    const [h24Str, mStr] = alarm.time.split(':');
    let h24 = parseInt(h24Str, 10);
    const p: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;

    setSelectedHour(h12);
    setSelectedMinute(parseInt(mStr, 10));
    setSelectedPeriod(p);
    setInputLabel(alarm.labelBn);
    setSelectedDays(alarm.repeatDays || []);
    setSelectedTone(alarm.soundTone || 'chime');
    setAlarmVibrate(alarm.vibrate !== undefined ? alarm.vibrate : settings.vibrateWithAlarm);
    setAlarmSnoozeDuration(alarm.snoozeDuration || settings.snoozeDurationMinutes);
    setAlarmAutoSilence(alarm.autoSilence !== undefined ? alarm.autoSilence : settings.autoSilenceMinutes);
    setAlarmAscendingVol(alarm.ascendingVolume || false);
    setShowAddModal(true);
  };

  // Save Add/Edit
  const handleSaveAlarm = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert 12h to 24h
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
    if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
    const time24 = `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

    const label = inputLabel.trim() || (lang === 'bn' ? 'অ্যালার্ম' : 'Alarm');

    const newAlarm: AlarmItem = {
      id: editingAlarm ? editingAlarm.id : `alarm-${Date.now()}`,
      time: time24,
      labelBn: label,
      labelEn: label,
      enabled: true,
      repeatDays: selectedDays,
      soundTone: selectedTone,
      vibrate: alarmVibrate,
      snoozeDuration: alarmSnoozeDuration,
      autoSilence: alarmAutoSilence,
      ascendingVolume: alarmAscendingVol,
      createdAt: editingAlarm ? editingAlarm.createdAt : Date.now(),
    };

    const updated = addOrUpdateAlarm(newAlarm);
    setAlarms(updated);
    setShowAddModal(false);
  };

  const handleToggle = (id: string) => {
    const updated = toggleAlarm(id);
    setAlarms(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAlarm(id);
    setAlarms(updated);
  };

  // Sound tone preview
  const handlePlayTonePreview = (tone: SoundToneType) => {
    unlockAudio();
    if (previewingTone === tone) {
      stopAlarmSound();
      setPreviewingTone(null);
      return;
    }
    stopAlarmSound();
    setPreviewingTone(tone);
    startAlarmSound(tone, false, false);
    setTimeout(() => {
      setPreviewingTone((prev) => (prev === tone ? null : prev));
      stopAlarmSound();
    }, 4500);
  };

  // Three-dot menu handlers
  const handleMenuAction = (action: string) => {
    setShowThreeDotMenu(false);
    switch (action) {
      case 'settings':
        setSettingsActiveTab('general');
        setShowSettingsModal(true);
        break;
      case 'edit_time':
        setShowSystemTimeDialog(true);
        break;
      case 'ringtone':
        setSettingsActiveTab('ringtone');
        setShowSettingsModal(true);
        break;
      case 'timer_ringtone':
        setSettingsActiveTab('timer');
        setShowSettingsModal(true);
        break;
      case 'volume':
        setSettingsActiveTab('volume');
        setShowSettingsModal(true);
        break;
      case 'auto_silence':
        setSettingsActiveTab('silence');
        setShowSettingsModal(true);
        break;
      case 'additional':
        setSettingsActiveTab('advanced');
        setShowSettingsModal(true);
        break;
      default:
        break;
    }
  };

  // Test full screen ringing overlay
  const handleTestFullAlarmDisplay = () => {
    unlockAudio();
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const testItem: AlarmItem = {
      id: 'test-' + Date.now(),
      time: `${h}:${m}`,
      labelBn: lang === 'bn' ? 'সকালের রুটিন ও কাজ' : 'Morning Work Routine',
      labelEn: 'Morning Work Routine',
      enabled: true,
      repeatDays: [],
      soundTone: settings.defaultRingtone || 'chime',
      vibrate: settings.vibrateWithAlarm,
      snoozeDuration: settings.snoozeDurationMinutes,
      autoSilence: settings.autoSilenceMinutes,
      createdAt: Date.now(),
    };
    triggerAlarmRinging(testItem);
  };

  // 5-sec Lock Screen Countdown Test
  const start5sLockScreenTest = async () => {
    unlockAudio();
    await requestNotificationPermission();
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

  // Tone definitions
  const TONES_LIST: { id: SoundToneType; nameBn: string; nameEn: string; icon: string; desc: string }[] = [
    { id: 'chime', nameBn: 'মধুর ঘণ্টা (Chime)', nameEn: 'Sweet Chime', icon: '🔔', desc: 'Melodic gentle chime' },
    { id: 'radar', nameBn: 'জরুরি রাডার (Radar Pulse)', nameEn: 'Radar Pulse', icon: '🚨', desc: 'Alert sonar radar pulses' },
    { id: 'azan', nameBn: 'ফজর আযান ও সুর', nameEn: 'Fajr Azan Motifs', icon: '🕌', desc: 'Spiritual dawn harmonic melody' },
    { id: 'digital', nameBn: 'ডিজিটাল বিপ বিপ (Digital Beep)', nameEn: 'Digital Beep', icon: '⏰', desc: 'Piercing digital clock beep' },
    { id: 'peaceful', nameBn: 'প্রশান্তিময় মারিম্বা', nameEn: 'Peaceful Chord', icon: '🎵', desc: 'Calming marimba chord' },
    { id: 'birds', nameBn: 'ভোরের পাখির মিষ্টি ডাক', nameEn: 'Morning Birds', icon: '🐦', desc: 'Peaceful morning birds chirping' },
    { id: 'classic_bell', nameBn: 'ক্লাসিক টুইন বেল', nameEn: 'Classic Twin Bell', icon: '🛎️', desc: 'Traditional ringing alarm bell' },
  ];

  const TIMER_TONES = [
    { id: 'bell_chime', nameBn: 'টাইমার বেল', nameEn: 'Timer Bell' },
    { id: 'digital_beep', nameBn: 'ডিজিটাল বিপ', nameEn: 'Digital Beep' },
    { id: 'kitchen_ding', nameBn: 'কিচেন ডিং', nameEn: 'Kitchen Ding' },
  ];

  // File upload for custom sound
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
          lang === 'bn' ? `"${file.name}" রিংটোন হিসেবে সংরক্ষিত হয়েছে!` : `"${file.name}" saved as custom sound!`
        );
        setTimeout(() => setSoundSuccessMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-slate-100">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & THREE-DOT MENU                           */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0B63F6]/20 border border-[#0B63F6]/40 flex items-center justify-center text-[#0B63F6]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              {lang === 'bn' ? 'অ্যালার্ম' : 'Alarm'}
            </h2>
            <p className="text-xs text-slate-400">
              {currentTime.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {' • '}
              <span className="font-mono text-slate-300">
                {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls & Three-Dot Menu */}
        <div className="flex items-center gap-2">
          {/* Add Alarm Header Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-900/40 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন অ্যালার্ম' : 'Add Alarm'}</span>
          </button>

          {/* 3-Dot Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showThreeDotMenu && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-[#0F1E36] border border-slate-700/90 shadow-2xl py-2 text-xs font-semibold backdrop-blur-xl animate-fade-in divide-y divide-slate-800/80">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('settings')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '১. অ্যালার্ম সেটিংস' : '1. Alarm Settings'}</span>
                    <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('edit_time')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '২. সিস্টেম সময় পরিবর্তন' : '2. Edit System Time'}</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('ringtone')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৩. অ্যালার্ম রিংটোন' : '3. Alarm Ringtone'}</span>
                    <Music className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('timer_ringtone')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৪. টাইমার রিংটোন' : '4. Timer Ringtone'}</span>
                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('volume')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৫. রিংটোন ভলিউম' : '5. Ringtone Volume'}</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('auto_silence')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৬. অটো-সাইলেন্স' : '6. Auto-silence'}</span>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('additional')}
                    className="w-full px-4 py-2.5 text-left text-blue-400 hover:bg-[#0B63F6]/20 hover:text-blue-300 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৭. অতিরিক্ত অ্যালার্ম সেটিংস' : '7. Additional Alarm Settings'}</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LIVE CLOCK HERO DISPLAY                               */}
      {/* ======================================================== */}
      <div className="p-5 rounded-3xl bg-[#091527] border border-slate-800/80 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0B63F6]/10 rounded-full blur-2xl pointer-events-none"></div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B63F6]">
          {lang === 'bn' ? 'বর্তমান ঘড়ির সময়' : 'Current Time'}
        </span>

        <h1 className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white my-1.5 drop-shadow-md">
          {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))}
        </h1>

        <p className="text-xs text-slate-400 font-medium">
          {currentTime.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {/* Quick Diagnostic Test Row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleTestFullAlarmDisplay}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0B63F6]/20 hover:bg-[#0B63F6]/30 text-blue-300 border border-[#0B63F6]/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ডিসপ্লেতে পূর্ণাঙ্গ অ্যালার্মের স্ক্রিন ও সাউন্ড টেস্ট করুন"
          >
            <BellRing className="w-3.5 h-3.5 text-[#0B63F6]" />
            <span>{lang === 'bn' ? 'ডিসপ্লে টেস্ট' : 'Display Test'}</span>
          </button>

          <button
            type="button"
            onClick={start5sLockScreenTest}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="৫ সেকেন্ড পর বাজবে, পাওয়ার বাটন টিপে স্ক্রিন অফ করে পরীক্ষা করুন"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'bn' ? 'লক স্ক্রিন টেস্ট (৫ সে)' : 'Lock Test (5s)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAndroidGuideModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'bn' ? 'লকস্ক্রিন নির্দেশিকা' : 'Lockscreen Guide'}</span>
          </button>
        </div>
      </div>

      {/* 5s Countdown Toast if active */}
      {countdownLockTest !== null && (
        <div className="p-4 rounded-3xl bg-purple-950/90 text-white border-2 border-purple-500 shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-2xl text-white">
              {toBn(countdownLockTest)}
            </div>
            <div>
              <h5 className="font-bold text-sm text-purple-100">
                {lang === 'bn' ? 'দ্রুত স্ক্রিন অফ বা লক করুন!' : 'Turn off screen or lock phone now!'}
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
            className="px-3 py-1.5 rounded-xl bg-purple-800 text-xs font-bold hover:bg-purple-700"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ALARM LIST (MATCHING EXACT REFERENCE SCREENSHOT)       */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === 'bn' ? `সেট করা অ্যালার্মসমূহ (${alarms.length})` : `Alarms (${alarms.length})`}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {alarms.filter((a) => a.enabled).length} {lang === 'bn' ? 'টি সক্রিয়' : 'active'}
          </span>
        </div>

        {alarms.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#091527] border border-slate-800 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              {lang === 'bn' ? 'কোনো অ্যালার্ম সেট করা নেই' : 'No alarms set'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-3 text-xs font-bold text-[#0B63F6] hover:underline"
            >
              {lang === 'bn' ? '+ নতুন অ্যালার্ম যুক্ত করুন' : '+ Add an alarm'}
            </button>
          </div>
        ) : (
          alarms.map((alarm) => {
            const time12 = formatTime12h(alarm.time);
            const nextTrigger = calculateNextAlarmDate(alarm);
            const countdownText = formatAlarmCountdown(nextTrigger, lang);
            const scheduleText = getRepeatScheduleText(alarm.repeatDays);

            return (
              <div
                key={alarm.id}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-md flex items-center justify-between ${
                  alarm.enabled
                    ? 'bg-[#091527] border-slate-700/80 hover:border-[#0B63F6]/50'
                    : 'bg-[#060e1b] border-slate-800/60 opacity-60'
                }`}
              >
                {/* Left: Time & Information */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleOpenEditModal(alarm)}
                >
                  {/* Large Time Display matching screenshot */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                      {toBn(time12.hour)}:{toBn(time12.minute)}
                    </span>
                    <span className="text-sm font-bold text-[#0B63F6]">
                      {time12.period}
                    </span>
                  </div>

                  {/* Alarm Label and Schedule */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {scheduleText}
                    </span>
                  </div>

                  {/* Countdown line: "Rings in X hours Y minutes" */}
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{countdownText}</span>
                  </div>
                </div>

                {/* Right: Actions & Blue Toggle Switch */}
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(alarm)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit alarm'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(alarm.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete alarm'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Blue ON/OFF Toggle Switch matching screenshot */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={alarm.enabled}
                    onClick={() => handleToggle(alarm.id)}
                    className={`w-13 h-7.5 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer ${
                      alarm.enabled ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Alarm Action Button (+) */}
      <div className="fixed bottom-22 right-5 z-30">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-14 h-14 rounded-full bg-[#0B63F6] hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-900/60 active:scale-95 transition border-2 border-blue-400/30 cursor-pointer"
          title={lang === 'bn' ? 'নতুন অ্যালার্ম যুক্ত করুন' : 'Add Alarm'}
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. ADD / EDIT ALARM MODAL (PHASE 3)                       */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#0B63F6]/20 text-[#0B63F6] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base sm:text-lg text-white">
                  {editingAlarm
                    ? lang === 'bn'
                      ? 'অ্যালার্ম পরিবর্তন করুন'
                      : 'Edit Alarm'
                    : lang === 'bn'
                    ? 'নতুন অ্যালার্ম যোগ করুন'
                    : 'Add Alarm'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlarm} className="mt-4 space-y-4">
              {/* Modern Time Selector (Hour, Minute, AM/PM) */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  {lang === 'bn' ? 'সময় নির্বাচন করুন' : 'Select Alarm Time'}
                </span>

                <div className="flex items-center justify-center gap-3">
                  {/* Hour Selector */}
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-slate-400 mb-1">{lang === 'bn' ? 'ঘণ্টা' : 'Hour'}</label>
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-3xl font-black font-mono text-white text-center focus:ring-2 focus:ring-[#0B63F6] outline-hidden cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h} className="bg-slate-900 text-white text-base">
                          {toBn(String(h).padStart(2, '0'))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-3xl font-black font-mono text-[#0B63F6] mt-5">:</span>

                  {/* Minute Selector */}
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-slate-400 mb-1">{lang === 'bn' ? 'মিনিট' : 'Minute'}</label>
                    <select
                      value={selectedMinute}
                      onChange={(e) => setSelectedMinute(parseInt(e.target.value, 10))}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-3xl font-black font-mono text-white text-center focus:ring-2 focus:ring-[#0B63F6] outline-hidden cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m} className="bg-slate-900 text-white text-base">
                          {toBn(String(m).padStart(2, '0'))}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AM/PM Toggle */}
                  <div className="flex flex-col items-center mt-5">
                    <div className="inline-flex rounded-2xl bg-slate-900 p-1 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod('AM')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                          selectedPeriod === 'AM'
                            ? 'bg-[#0B63F6] text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPeriod('PM')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                          selectedPeriod === 'PM'
                            ? 'bg-[#0B63F6] text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Minute Later Test Button */}
                <button
                  type="button"
                  onClick={() => {
                    const testD = new Date();
                    testD.setMinutes(testD.getMinutes() + 1);
                    const h24 = testD.getHours();
                    setSelectedHour(h24 % 12 || 12);
                    setSelectedMinute(testD.getMinutes());
                    setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
                    setInputLabel(lang === 'bn' ? 'টেস্ট অ্যালার্ম (১ মিনিট পর)' : 'Test Alarm (1m later)');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-[#0B63F6]/20 text-[#0B63F6] hover:bg-[#0B63F6]/30 text-xs font-bold border border-[#0B63F6]/40 inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '⚡ এখনই ১ মিনিট পর টেস্ট এলার্ম সেট করুন' : '⚡ Quick 1-min test alarm'}</span>
                </button>
              </div>

              {/* Alarm Label */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যালার্মের নাম / লেবেল' : 'Alarm Label'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: ফজরের সালাত, ঔষধ, অফিসের কাজ' : 'e.g. Fajr prayer, Medicine'}
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F1E36] border border-slate-700 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#0B63F6]"
                />

                {/* Quick label chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    lang === 'bn' ? 'ফজরের সালাত' : 'Fajr Prayer',
                    lang === 'bn' ? 'সকালের রুটিন' : 'Morning Routine',
                    lang === 'bn' ? 'ঔষধ খাওয়ার সময়' : 'Medicine',
                    lang === 'bn' ? 'অফিস / কাজ' : 'Work',
                    lang === 'bn' ? 'পড়াশোনা' : 'Study',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setInputLabel(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:bg-[#0B63F6]/30 hover:text-white transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat Schedule */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'পুনরাবৃত্তি (দিনসমূহ)' : 'Repeat Days'}
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                      className="text-[#0B63F6] font-bold hover:underline"
                    >
                      {lang === 'bn' ? 'প্রতিদিন' : 'Daily'}
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([])}
                      className="text-slate-400 hover:underline"
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
                        onClick={() => {
                          if (selectedDays.includes(dayIdx)) {
                            setSelectedDays(selectedDays.filter((d) => d !== dayIdx));
                          } else {
                            setSelectedDays([...selectedDays, dayIdx].sort());
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition flex flex-col items-center justify-center cursor-pointer ${
                          active
                            ? 'bg-[#0B63F6] text-white shadow-xs'
                            : 'bg-[#0F1E36] text-slate-400 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <span>{lang === 'bn' ? DAYS_BN[dayIdx] : DAYS_EN[dayIdx]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ringtone Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? 'রিংটোন নির্বাচন করুন' : 'Select Ringtone'}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {TONES_LIST.map((tone) => {
                    const isSelected = selectedTone === tone.id;
                    const isPlaying = previewingTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white ring-1 ring-[#0B63F6]'
                            : 'border-slate-800 bg-[#0F1E36] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{tone.icon}</span>
                          <span className="truncate">{lang === 'bn' ? tone.nameBn : tone.nameEn}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTonePreview(tone.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-white"
                          title="Preview"
                        >
                          {isPlaying ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}

                  {/* Custom upload sound if present */}
                  {customSound && (
                    <div
                      onClick={() => setSelectedTone('custom')}
                      className={`p-2.5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between col-span-2 cursor-pointer transition ${
                        selectedTone === 'custom'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-800 bg-[#0F1E36] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>🎵</span>
                        <span className="truncate">{customSound.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayTonePreview('custom');
                        }}
                        className="p-1"
                      >
                        {previewingTone === 'custom' ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vibration & Snooze Duration */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Vibration Toggle */}
                <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold">{lang === 'bn' ? 'ভাইব্রেশন' : 'Vibrate'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlarmVibrate(!alarmVibrate)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                      alarmVibrate ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        alarmVibrate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Snooze Duration Selector */}
                <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{lang === 'bn' ? 'স্নুজ' : 'Snooze'}</span>
                  <select
                    value={alarmSnoozeDuration}
                    onChange={(e) => setAlarmSnoozeDuration(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                  >
                    <option value={5}>5 {lang === 'bn' ? 'মি.' : 'min'}</option>
                    <option value={10}>10 {lang === 'bn' ? 'মি.' : 'min'}</option>
                    <option value={15}>15 {lang === 'bn' ? 'মি.' : 'min'}</option>
                    <option value={20}>20 {lang === 'bn' ? 'মি.' : 'min'}</option>
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl font-black text-xs bg-[#0B63F6] hover:bg-blue-600 text-white shadow-xl shadow-blue-950/60 transition"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ALARM SETTINGS MODAL (PHASE 4)                        */}
      {/* ======================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#0B63F6]/20 text-[#0B63F6] flex items-center justify-center">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">
                    {lang === 'bn' ? 'অ্যালার্ম সেটিংস' : 'Alarm Settings'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'রিংটোন, ভলিউম, অটো-সাইলেন্স ও আচরণ' : 'Ringtone, Volume, Auto-silence & Behavior'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Sections */}
            <div className="space-y-4 text-xs">
              {/* 1. Alarm Ringtone Selection */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#0B63F6]" />
                    <span className="font-bold text-white">
                      {lang === 'bn' ? 'ডিফল্ট অ্যালার্ম রিংটোন' : 'Default Alarm Ringtone'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TONES_LIST.map((tone) => {
                    const isSelected = settings.defaultRingtone === tone.id;
                    const isPlaying = previewingTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => {
                          const updated = saveAlarmSettings({ defaultRingtone: tone.id });
                          setSettings(updated);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white font-bold'
                            : 'border-slate-800 bg-slate-900 text-slate-300'
                        }`}
                      >
                        <span className="truncate">{tone.icon} {lang === 'bn' ? tone.nameBn : tone.nameEn}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTonePreview(tone.id);
                          }}
                          className="p-1"
                        >
                          {isPlaying ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Audio Upload */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'ফোনের মেমোরি থেকে এমপি৩ আপলোড:' : 'Upload MP3 from device:'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ফাইল সিলেক্ট' : 'Select File'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Timer Ringtone */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#0B63F6]" />
                  <div>
                    <span className="font-bold text-white block">
                      {lang === 'bn' ? 'টাইমার রিংটোন' : 'Timer Ringtone'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'কাউন্টডাউন শেষে যে সুর বাজবে' : 'Tone played after countdown'}
                    </span>
                  </div>
                </div>
                <select
                  value={settings.timerRingtone}
                  onChange={(e) => {
                    const updated = saveAlarmSettings({ timerRingtone: e.target.value });
                    setSettings(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  {TIMER_TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {lang === 'bn' ? t.nameBn : t.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Ringtone Volume */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#0B63F6]" />
                    <span className="font-bold text-white">
                      {lang === 'bn' ? 'রিংটোন ভলিউম' : 'Ringtone Volume'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#0B63F6]">
                    {toBn(Math.round(settings.volume * 100))}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    const updated = saveAlarmSettings({ volume: newVol });
                    setSettings(updated);
                    playChimeNote(659.25, 'sine', 0.2, 0.3);
                  }}
                  className="w-full accent-[#0B63F6] cursor-pointer"
                />
              </div>

              {/* 4. Auto-silence */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">
                    {lang === 'bn' ? 'অটো-সাইলেন্স (Auto-silence)' : 'Auto-silence'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'অ্যালার্ম বন্ধ না করলে যত মিনিট পর স্বয়ং থামবে' : 'Silence after ringing for'}
                  </span>
                </div>
                <select
                  value={settings.autoSilenceMinutes}
                  onChange={(e) => {
                    const updated = saveAlarmSettings({ autoSilenceMinutes: parseInt(e.target.value, 10) });
                    setSettings(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value={1}>1 {lang === 'bn' ? 'মিনিট' : 'minute'}</option>
                  <option value={5}>5 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
                  <option value={10}>10 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
                  <option value={15}>15 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
                  <option value={20}>20 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
                  <option value={0}>{lang === 'bn' ? 'কখনও নয় (Never)' : 'Never'}</option>
                </select>
              </div>

              {/* 5. Additional Settings (Ascending Volume, Flip to Silence, Vibrate) */}
              <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-3">
                <span className="font-bold text-white block">
                  {lang === 'bn' ? 'অতিরিক্ত অ্যালার্ম আচরণ' : 'Additional Alarm Behaviors'}
                </span>

                {/* Vibrate */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-300">
                    {lang === 'bn' ? 'অ্যালার্মের সাথে মোবাইল ভাইব্রেশন' : 'Vibrate when alarm sounds'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = saveAlarmSettings({ vibrateWithAlarm: !settings.vibrateWithAlarm });
                      setSettings(updated);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                      settings.vibrateWithAlarm ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.vibrateWithAlarm ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Ascending Volume */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-slate-300 block">
                      {lang === 'bn' ? 'ক্রমবর্ধমান ভলিউম (Ascending Volume)' : 'Ascending Volume'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'ধীরে ধীরে সাউন্ড বৃদ্ধি পাবে' : 'Gradually increase volume'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = saveAlarmSettings({ ascendingVolume: !settings.ascendingVolume });
                      setSettings(updated);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                      settings.ascendingVolume ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.ascendingVolume ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Flip to Silence */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-slate-300 block">
                      {lang === 'bn' ? 'ফোন উল্টালে সাইলেন্স (Silence on Flip)' : 'Silence on Flip'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'ফোন উল্টো রাখলে বা বাটন টিপলে সাউন্ড মিউট' : 'Mute when phone is flipped'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = saveAlarmSettings({ silenceOnFlip: !settings.silenceOnFlip });
                      setSettings(updated);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                      settings.silenceOnFlip ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.silenceOnFlip ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              {lang === 'bn' ? 'সেটিংস সম্পন্ন (Done)' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. EDIT SYSTEM TIME DIALOG (MENU ITEM 2)                  */}
      {/* ======================================================== */}
      {showSystemTimeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Clock className="w-5 h-5 text-[#0B63F6]" />
              <h3 className="font-black text-base text-white">
                {lang === 'bn' ? 'সিস্টেম তারিখ ও সময়' : 'System Date & Time'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'অ্যান্ড্রয়েড অপারেটিং সিস্টেমের নিরাপত্তা বিধির কারণে তারিখ ও সময় পরিবর্তন আপনার মোবাইলের প্রধান Settings > System > Date & time থেকে করতে হবে।'
                : 'Android requires system time to be adjusted in Phone Settings > System > Date & Time.'}
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-200">
              {currentTime.toString()}
            </div>

            <button
              type="button"
              onClick={() => setShowSystemTimeDialog(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. ANDROID LOCKSCREEN & PERMISSION GUIDE MODAL           */}
      {/* ======================================================== */}
      {showAndroidGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="font-black text-base text-white">
                    {lang === 'bn' ? 'লক স্ক্রিন ও ব্যাকগ্রাউন্ড ডিসপ্লে গাইড' : 'Lock Screen & Background Guide'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Xiaomi, Redmi, Poco, Realme, Vivo, Oppo & Samsung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-[#0B63F6]">১. Show on Lock screen (লক স্ক্রিনে প্রদর্শন)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? 'ফোনের Settings > Apps > Manage Apps > SmartHub এ গিয়ে Permissions থেকে "Show on Lock screen" চালু করুন।'
                    : 'Open Phone Settings > Apps > SmartHub > Other Permissions > Enable "Show on Lock screen".'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">২. Display pop-up windows (পপ-আপ প্রদর্শন)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? '"Display pop-up windows while running in the background" চালু করুন, যেন অন্য অ্যাপে থাকলেও অ্যালার্ম সরাসরি ভেসে ওঠে।'
                    : 'Enable "Display pop-up windows while running in the background" to show ringing alarm over other apps.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">৩. Battery Saver (ব্যাটারি সেভার)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? 'Battery Saver এ "No restrictions" নির্বাচন করুন যেন ব্যাকগ্রাউন্ডে অ্যালার্ম সার্ভিস চালু থাকে।'
                    : 'Set Battery Saver to "No restrictions" so the app remains awake for alarms.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs"
            >
              {lang === 'bn' ? 'বুঝেছি (বন্ধ করুন)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
