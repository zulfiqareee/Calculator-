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
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  getStoredAlarms,
  saveStoredAlarms,
  addOrUpdateAlarm,
  deleteAlarm,
  toggleAlarm,
  startAlarmSound,
  stopAlarmSound,
  playChimeNote,
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
  const [selectedTone, setSelectedTone] = useState<AlarmItem['soundTone']>('chime');

  // Triggered alarm state
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);
  const lastTriggeredMinuteRef = useRef<string>('');

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
      // Calculate snooze time
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
    setSelectedTone('chime');
    setShowAddModal(true);
  };

  const openEditModal = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    setInputTime(alarm.time);
    setInputLabel(lang === 'bn' ? alarm.labelBn : (alarm.labelEn || alarm.labelBn));
    setSelectedDays(alarm.repeatDays);
    setSelectedTone(alarm.soundTone);
    setShowAddModal(true);
  };

  const handleSaveAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTime) return;

    const newAlarm: AlarmItem = {
      id: editingAlarm ? editingAlarm.id : `alarm-${Date.now()}`,
      time: inputTime,
      labelBn: inputLabel.trim() || (lang === 'bn' ? 'স্মার্ট অ্যালার্ম' : 'Smart Alarm'),
      labelEn: inputLabel.trim() || 'Smart Alarm',
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
  const selectWeekdays = () => setSelectedDays([0, 1, 2, 3, 4]); // Sun to Thu in Bangladesh/Middle East or Mon-Fri
  const clearDays = () => setSelectedDays([]); // Once

  const previewTone = (tone: AlarmItem['soundTone']) => {
    if (tone === 'peaceful') {
      playChimeNote(523.25, 'sine', 0.4, 0.25);
      setTimeout(() => playChimeNote(659.25, 'sine', 0.4, 0.25), 200);
      setTimeout(() => playChimeNote(783.99, 'sine', 0.6, 0.25), 400);
    } else if (tone === 'digital') {
      playChimeNote(880, 'square', 0.1, 0.2);
      setTimeout(() => playChimeNote(880, 'square', 0.1, 0.2), 150);
      setTimeout(() => playChimeNote(1174, 'square', 0.2, 0.25), 300);
    } else if (tone === 'radar') {
      playChimeNote(950, 'triangle', 0.15, 0.3);
      setTimeout(() => playChimeNote(1200, 'triangle', 0.2, 0.35), 200);
    } else {
      playChimeNote(659.25, 'sine', 0.3, 0.3);
      setTimeout(() => playChimeNote(830.61, 'sine', 0.3, 0.3), 150);
      setTimeout(() => playChimeNote(987.77, 'sine', 0.4, 0.35), 300);
    }
  };

  // Format 24h to 12h display
  const formatTime12h = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const periodBn = h >= 12 ? 'বিকাল/রাত' : 'ভোর/সকাল';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return {
      time: formatted,
      period: lang === 'bn' ? period : period,
      periodBn,
    };
  };

  // Convert digits to Bengali if needed
  const toBn = (num: string | number) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  // Next alarm calculation
  const nextAlarm = alarms.find((a) => a.enabled);

  return (
    <div className="space-y-4">
      {/* Ringing Alarm Modal Alert */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl p-6 text-center text-slate-800 dark:text-slate-100">
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center animate-bounce mb-4">
              <BellRing className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500 text-white uppercase tracking-wider inline-block mb-2">
              {lang === 'bn' ? '🔔 অ্যালার্ম বাজছে' : '🔔 ALARM RINGING'}
            </span>

            <h3 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {toBn(formatTime12h(ringingAlarm.time).time)}{' '}
              <span className="text-xl font-bold text-indigo-600">{formatTime12h(ringingAlarm.time).period}</span>
            </h3>

            <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mt-2">
              {lang === 'bn' ? ringingAlarm.labelBn : ringingAlarm.labelEn}
            </p>

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

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white text-indigo-800 font-bold text-xs shadow-md active:scale-95 transition hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন অ্যালার্ম' : 'New Alarm'}</span>
          </button>
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
                ({lang === 'bn' ? nextAlarm.labelBn : nextAlarm.labelEn})
              </span>
            </div>
          )}
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
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
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

                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 truncate">
                      {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      {alarm.repeatDays.length === 7
                        ? lang === 'bn'
                          ? 'প্রতিদিন'
                          : 'Everyday'
                        : alarm.repeatDays.length === 0
                        ? lang === 'bn'
                          ? 'একবার'
                          : 'Once'
                        : alarm.repeatDays
                            .map((d) => (lang === 'bn' ? DAYS_BN[d] : DAYS_EN[d]))
                            .join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-3 shrink-0">
                  <button
                    onClick={() => previewTone(alarm.soundTone)}
                    title={lang === 'bn' ? 'টোন শুনুন' : 'Preview tone'}
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
                    ? 'নতুন অ্যালার্ম যুক্ত করুন'
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
                  {lang === 'bn' ? 'সময় নির্বাচন করুন (২৪ ঘণ্টা / ১২ ঘণ্টা)' : 'Alarm Time'}
                </label>
                <input
                  type="time"
                  required
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="w-full px-4 py-3 text-2xl font-black font-mono text-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Label & Quick Suggestions */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? 'অ্যালার্মের নাম / উদ্দেশ্য' : 'Alarm Title / Label'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: ফজরের সালাত, ঔষধ, কাজ' : 'e.g. Fajr prayer, Medicine'}
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    lang === 'bn' ? 'ফজরের সালাত' : 'Fajr Prayer',
                    lang === 'bn' ? 'ঔষধ খাওয়ার সময়' : 'Take Medicine',
                    lang === 'bn' ? 'সকালের হাঁটা' : 'Morning Walk',
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
                  {lang === 'bn' ? 'অ্যালার্মের সুর / টোন' : 'Alarm Sound Tone'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'chime' as const, labelBn: 'মধুর ঘণ্টা (Chime)', labelEn: 'Sweet Chime' },
                    { id: 'peaceful' as const, labelBn: 'প্রশান্তিময় (Peaceful)', labelEn: 'Peaceful Chord' },
                    { id: 'digital' as const, labelBn: 'ডিজিটাল বিপ (Digital)', labelEn: 'Digital Beep' },
                    { id: 'radar' as const, labelBn: 'রাডার সংকেত (Radar)', labelEn: 'Radar Pulse' },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        setSelectedTone(tone.id);
                        previewTone(tone.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                        selectedTone === tone.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="truncate">{lang === 'bn' ? tone.labelBn : tone.labelEn}</span>
                      <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </button>
                  ))}
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
