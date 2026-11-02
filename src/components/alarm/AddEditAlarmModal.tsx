import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Sparkles,
  Smartphone,
  Play,
  Square,
  Upload,
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  SoundToneType,
  getAlarmSettings,
  startAlarmAudioPlayback,
  stopAlarmAudioPlayback,
  getCustomSoundData,
  saveCustomSoundData,
  unlockAudio,
} from '../../utils/alarmEngine';

interface Props {
  alarm: AlarmItem | null; // null if creating
  lang: Language;
  onSave: (alarm: AlarmItem) => void;
  onClose: () => void;
}

// Weekday order: Monday to Sunday as requested
const WEEKDAYS = [
  { index: 1, nameEn: 'Mon', nameBn: 'সোম' },
  { index: 2, nameEn: 'Tue', nameBn: 'মঙ্গল' },
  { index: 3, nameEn: 'Wed', nameBn: 'বুধ' },
  { index: 4, nameEn: 'Thu', nameBn: 'বৃহঃ' },
  { index: 5, nameEn: 'Fri', nameBn: 'শুক্র' },
  { index: 6, nameEn: 'Sat', nameBn: 'শনি' },
  { index: 0, nameEn: 'Sun', nameBn: 'রবি' },
];

export const AddEditAlarmModal: React.FC<Props> = ({
  alarm,
  lang,
  onSave,
  onClose,
}) => {
  const settings = getAlarmSettings();
  const [customSound, setCustomSound] = useState(getCustomSoundData());
  const [customUploadMsg, setCustomUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [selectedHour, setSelectedHour] = useState<number>(6);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [label, setLabel] = useState<string>('');
  const [repeatMode, setRepeatMode] = useState<'once' | 'daily' | 'custom'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [tone, setTone] = useState<SoundToneType>('chime');
  const [vibrate, setVibrate] = useState<boolean>(true);
  const [snoozeEnabled, setSnoozeEnabled] = useState<boolean>(true);
  const [snoozeMins, setSnoozeMins] = useState<number>(5);
  const [previewingTone, setPreviewingTone] = useState<SoundToneType | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'bn' ? 'অডিও ফাইলটি ১০ মেগাবাইটের কম হতে হবে।' : 'File must be under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        saveCustomSoundData(file.name, result);
        setCustomSound({ name: file.name, url: result });
        setTone('custom');
        setCustomUploadMsg(
          lang === 'bn'
            ? `"${file.name}" রিংটোন হিসেবে নির্বাচিত হয়েছে!`
            : `"${file.name}" selected as ringtone!`
        );
        setTimeout(() => setCustomUploadMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (alarm) {
      const [hStr, mStr] = alarm.time.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;

      setSelectedHour(h12);
      setSelectedMinute(m);
      setSelectedPeriod(p);
      setLabel(alarm.labelBn || alarm.labelEn);

      if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
        setRepeatMode('once');
        setSelectedDays([]);
      } else if (alarm.repeatDays.length === 7) {
        setRepeatMode('daily');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      } else {
        setRepeatMode('custom');
        setSelectedDays(alarm.repeatDays);
      }

      setTone(alarm.soundTone || 'chime');
      setVibrate(alarm.vibrate !== undefined ? alarm.vibrate : settings.vibrateWithAlarm);
      setSnoozeEnabled(alarm.snoozeEnabled !== undefined ? alarm.snoozeEnabled : true);
      setSnoozeMins(alarm.snoozeDuration || settings.snoozeDurationMinutes);
    } else {
      const now = new Date();
      const nextH = (now.getHours() + 1) % 24;
      setSelectedHour(nextH % 12 || 12);
      setSelectedMinute(0);
      setSelectedPeriod(nextH >= 12 ? 'PM' : 'AM');
      setLabel('');
      setRepeatMode('daily');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setTone(settings.defaultRingtone || 'chime');
      setVibrate(settings.vibrateWithAlarm);
      setSnoozeEnabled(true);
      setSnoozeMins(settings.snoozeDurationMinutes);
    }

    return () => {
      stopAlarmAudioPlayback();
    };
  }, [alarm]);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const handleRepeatModeChange = (mode: 'once' | 'daily' | 'custom') => {
    setRepeatMode(mode);
    if (mode === 'once') {
      setSelectedDays([]);
    } else if (mode === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else {
      if (selectedDays.length === 0 || selectedDays.length === 7) {
        setSelectedDays([1, 2, 3, 4, 5]); // Mon to Fri default custom
      }
    }
  };

  const toggleDay = (dayIndex: number) => {
    setRepeatMode('custom');
    if (selectedDays.includes(dayIndex)) {
      const updated = selectedDays.filter((d) => d !== dayIndex);
      setSelectedDays(updated);
      if (updated.length === 0) setRepeatMode('once');
    } else {
      const updated = [...selectedDays, dayIndex].sort();
      setSelectedDays(updated);
      if (updated.length === 7) setRepeatMode('daily');
    }
  };

  const handlePreviewTone = (t: SoundToneType) => {
    unlockAudio();
    if (previewingTone === t) {
      stopAlarmAudioPlayback();
      setPreviewingTone(null);
      return;
    }
    stopAlarmAudioPlayback();
    setPreviewingTone(t);
    startAlarmAudioPlayback(t, false, false);
    setTimeout(() => {
      setPreviewingTone((prev) => (prev === t ? null : prev));
      stopAlarmAudioPlayback();
    }, 4500);
  };

  const handleQuick1Min = () => {
    const testDate = new Date();
    testDate.setMinutes(testDate.getMinutes() + 1);
    const h24 = testDate.getHours();
    setSelectedHour(h24 % 12 || 12);
    setSelectedMinute(testDate.getMinutes());
    setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
    setLabel(lang === 'bn' ? 'টেস্ট অ্যালার্ম (১ মিনিট পর)' : 'Test Alarm (1m later)');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
    if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
    const time24 = `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

    const finalLabel = label.trim() || (lang === 'bn' ? 'অ্যালার্ম' : 'Alarm');

    const result: AlarmItem = {
      id: alarm ? alarm.id : `alarm-${Date.now()}`,
      time: time24,
      labelBn: finalLabel,
      labelEn: finalLabel,
      enabled: true,
      repeatDays: repeatMode === 'once' ? [] : selectedDays,
      soundTone: tone,
      vibrate: vibrate,
      snoozeEnabled: snoozeEnabled,
      snoozeDuration: snoozeMins,
      autoSilence: settings.autoSilenceMinutes,
      ascendingVolume: settings.ascendingVolume,
      createdAt: alarm ? alarm.createdAt : Date.now(),
    };

    onSave(result);
  };

  const TONES = [
    { id: 'chime' as SoundToneType, nameBn: 'মধুর ঘণ্টা (Chime)', nameEn: 'Sweet Chime', icon: '🔔' },
    { id: 'radar' as SoundToneType, nameBn: 'জরুরি রাডার (Radar)', nameEn: 'Radar Pulse', icon: '🚨' },
    { id: 'azan' as SoundToneType, nameBn: 'ফজর আযান ও সুর', nameEn: 'Fajr Azan', icon: '🕌' },
    { id: 'digital' as SoundToneType, nameBn: 'ডিজিটাল বিপ বিপ', nameEn: 'Digital Beep', icon: '⏰' },
    { id: 'peaceful' as SoundToneType, nameBn: 'প্রশান্তিময় মারিম্বা', nameEn: 'Peaceful Melodies', icon: '🎵' },
    { id: 'birds' as SoundToneType, nameBn: 'পাখির মিষ্টি ডাক', nameEn: 'Morning Birds', icon: '🐦' },
    { id: 'classic_bell' as SoundToneType, nameBn: 'ক্লাসিক টুইন বেল', nameEn: 'Classic Bell', icon: '🛎️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#10141D] border border-neutral-800 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0B63F6]/20 text-[#0B63F6] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              {alarm
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
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Time Picker Card (Android Clock style) */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">
              {lang === 'bn' ? 'অ্যালার্মের সময়' : 'Alarm Time'}
            </span>

            <div className="flex items-center justify-center gap-3">
              {/* Hour Dropdown */}
              <div className="flex flex-col items-center">
                <label className="text-[10px] text-neutral-400 mb-1">{lang === 'bn' ? 'ঘণ্টা' : 'Hour'}</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                  className="px-3 py-2 rounded-2xl bg-black border border-neutral-700 text-3xl font-light font-mono text-white text-center focus:ring-2 focus:ring-[#0B63F6] outline-hidden cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h} className="bg-neutral-900 text-white text-base">
                      {toBn(String(h).padStart(2, '0'))}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-3xl font-light font-mono text-[#0B63F6] mt-5">:</span>

              {/* Minute Dropdown */}
              <div className="flex flex-col items-center">
                <label className="text-[10px] text-neutral-400 mb-1">{lang === 'bn' ? 'মিনিট' : 'Minute'}</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(parseInt(e.target.value, 10))}
                  className="px-3 py-2 rounded-2xl bg-black border border-neutral-700 text-3xl font-light font-mono text-white text-center focus:ring-2 focus:ring-[#0B63F6] outline-hidden cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m} className="bg-neutral-900 text-white text-base">
                      {toBn(String(m).padStart(2, '0'))}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM/PM Switch */}
              <div className="flex flex-col items-center mt-5">
                <div className="inline-flex rounded-2xl bg-black p-1 border border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('AM')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedPeriod === 'AM'
                        ? 'bg-[#0B63F6] text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('PM')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedPeriod === 'PM'
                        ? 'bg-[#0B63F6] text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 1-min test helper */}
            <button
              type="button"
              onClick={handleQuick1Min}
              className="mt-3 px-3 py-1 rounded-xl bg-[#0B63F6]/20 text-[#0B63F6] hover:bg-[#0B63F6]/30 text-xs font-bold border border-[#0B63F6]/40 inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '⚡ ১ মিনিট পর টেস্ট এলার্ম' : '⚡ 1-minute test alarm'}</span>
            </button>
          </div>

          {/* Repeat Options: Once, Daily, Custom */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              {lang === 'bn' ? 'পুনরাবৃত্তি (Repeat)' : 'Repeat Schedule'}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleRepeatModeChange('once')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  repeatMode === 'once'
                    ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'একবার (Once)' : 'Once'}
              </button>
              <button
                type="button"
                onClick={() => handleRepeatModeChange('daily')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  repeatMode === 'daily'
                    ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'প্রতিদিন (Daily)' : 'Daily'}
              </button>
              <button
                type="button"
                onClick={() => handleRepeatModeChange('custom')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  repeatMode === 'custom'
                    ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'কাস্টম (Custom)' : 'Custom'}
              </button>
            </div>

            {/* Weekdays pills: Mon to Sun */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => {
                const active = repeatMode !== 'once' && selectedDays.includes(day.index);
                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => toggleDay(day.index)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      active
                        ? 'bg-[#0B63F6] text-white shadow-xs'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{lang === 'bn' ? day.nameBn : day.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alarm Label */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider">
              {lang === 'bn' ? 'অ্যালার্মের নাম / লেবেল' : 'Alarm Label'}
            </label>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: ফজরের সালাত, ঔষধ, অফিসের কাজ' : 'e.g. Fajr prayer, Medicine'}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#0B63F6]"
            />

            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                lang === 'bn' ? 'ফজরের সালাত' : 'Fajr Prayer',
                lang === 'bn' ? 'সকালের কাজ' : 'Morning Routine',
                lang === 'bn' ? 'ঔষধ খাওয়ার সময়' : 'Medicine',
                lang === 'bn' ? 'অফিস' : 'Work',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setLabel(chip)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 text-[11px] font-semibold text-neutral-300 hover:bg-[#0B63F6]/30 hover:text-white transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Ringtone Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              {lang === 'bn' ? 'রিংটোন নির্বাচন করুন' : 'Select Ringtone'}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {TONES.map((t) => {
                const isSelected = tone === t.id;
                const isPlaying = previewingTone === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white ring-1 ring-[#0B63F6]'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{t.icon}</span>
                      <span className="truncate">{lang === 'bn' ? t.nameBn : t.nameEn}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTone(t.id);
                      }}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white"
                      title="Preview"
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}

              {customSound && (
                <div
                  onClick={() => setTone('custom')}
                  className={`p-2.5 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between col-span-2 cursor-pointer transition ${
                    tone === 'custom'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300'
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
                      handlePreviewTone('custom');
                    }}
                    className="p-1"
                  >
                    {previewingTone === 'custom' ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Upload Ringtone from Phone Storage / Files Button */}
            <div className="mt-2.5">
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
                className="w-full py-2.5 px-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-[#0B63F6] text-xs font-bold text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Upload className="w-4 h-4 text-[#0B63F6]" />
                <span>{lang === 'bn' ? 'ফোন ফাইল / স্টোরেজ থেকে রিংটোন নিন' : 'Pick Ringtone from Device Files'}</span>
              </button>
            </div>

            {customUploadMsg && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-600/90 text-white text-[11px] font-bold text-center animate-fade-in">
                {customUploadMsg}
              </div>
            )}
          </div>

          {/* Vibration & Snooze ON/OFF */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Vibration */}
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold">{lang === 'bn' ? 'ভাইব্রেশন' : 'Vibrate'}</span>
              </div>
              <button
                type="button"
                onClick={() => setVibrate(!vibrate)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  vibrate ? 'bg-[#0B63F6]' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    vibrate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Snooze Toggle & Duration */}
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">{lang === 'bn' ? 'স্নুজ' : 'Snooze'}</span>
                <span className="text-[10px] text-neutral-400">{snoozeMins}m</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={snoozeMins}
                  onChange={(e) => setSnoozeMins(parseInt(e.target.value, 10))}
                  disabled={!snoozeEnabled}
                  className="bg-black border border-neutral-700 rounded-lg px-1.5 py-0.5 text-xs text-white"
                >
                  <option value={5}>5m</option>
                  <option value={10}>10m</option>
                  <option value={15}>15m</option>
                  <option value={20}>20m</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSnoozeEnabled(!snoozeEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                    snoozeEnabled ? 'bg-[#0B63F6]' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                      snoozeEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons - Zero Ads */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl font-black text-xs bg-[#0B63F6] hover:bg-blue-600 text-white shadow-xl shadow-blue-950/60 transition cursor-pointer"
            >
              {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
