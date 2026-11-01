import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Sparkles,
  Volume2,
  Smartphone,
  Play,
  Square,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  SoundToneType,
  getAlarmSettings,
  startAlarmAudioPlayback,
  stopAlarmAudioPlayback,
  getCustomSoundData,
  unlockAudio,
} from '../../utils/alarmEngine';

interface Props {
  alarm: AlarmItem | null; // null if creating
  lang: Language;
  onSave: (alarm: AlarmItem) => void;
  onClose: () => void;
}

const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AddEditAlarmModal: React.FC<Props> = ({
  alarm,
  lang,
  onSave,
  onClose,
}) => {
  const settings = getAlarmSettings();
  const customSound = getCustomSoundData();

  // Parse initial time
  const [selectedHour, setSelectedHour] = useState<number>(6);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [label, setLabel] = useState<string>('');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [tone, setTone] = useState<SoundToneType>('chime');
  const [vibrate, setVibrate] = useState<boolean>(true);
  const [snoozeMins, setSnoozeMins] = useState<number>(5);
  const [autoSilenceMins, setAutoSilenceMins] = useState<number>(10);
  const [ascendingVol, setAscendingVol] = useState<boolean>(false);

  const [previewingTone, setPreviewingTone] = useState<SoundToneType | null>(null);

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
      setRepeatDays(alarm.repeatDays || []);
      setTone(alarm.soundTone || 'chime');
      setVibrate(alarm.vibrate !== undefined ? alarm.vibrate : settings.vibrateWithAlarm);
      setSnoozeMins(alarm.snoozeDuration || settings.snoozeDurationMinutes);
      setAutoSilenceMins(alarm.autoSilence !== undefined ? alarm.autoSilence : settings.autoSilenceMinutes);
      setAscendingVol(alarm.ascendingVolume || false);
    } else {
      const now = new Date();
      const nextH = (now.getHours() + 1) % 24;
      setSelectedHour(nextH % 12 || 12);
      setSelectedMinute(0);
      setSelectedPeriod(nextH >= 12 ? 'PM' : 'AM');
      setLabel('');
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
      setTone(settings.defaultRingtone || 'chime');
      setVibrate(settings.vibrateWithAlarm);
      setSnoozeMins(settings.snoozeDurationMinutes);
      setAutoSilenceMins(settings.autoSilenceMinutes);
      setAscendingVol(settings.ascendingVolume);
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

  const handleQuick1MinTest = () => {
    const testD = new Date();
    testD.setMinutes(testD.getMinutes() + 1);
    const h24 = testD.getHours();
    setSelectedHour(h24 % 12 || 12);
    setSelectedMinute(testD.getMinutes());
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
      repeatDays: repeatDays,
      soundTone: tone,
      vibrate: vibrate,
      snoozeDuration: snoozeMins,
      autoSilence: autoSilenceMins,
      ascendingVolume: ascendingVol,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0B63F6]/20 text-[#0B63F6] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-black text-base sm:text-lg text-white">
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Time Picker Card */}
          <div className="p-4 rounded-2xl bg-[#0F1E36] border border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              {lang === 'bn' ? 'অ্যালার্মের সময় নির্ধারণ করুন' : 'Select Alarm Time'}
            </span>

            <div className="flex items-center justify-center gap-3">
              {/* Hour Dropdown */}
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

              {/* Minute Dropdown */}
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

              {/* AM/PM Switch */}
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

            {/* Quick 1-minute test button */}
            <button
              type="button"
              onClick={handleQuick1MinTest}
              className="mt-3 px-3 py-1.5 rounded-xl bg-[#0B63F6]/20 text-[#0B63F6] hover:bg-[#0B63F6]/30 text-xs font-bold border border-[#0B63F6]/40 inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '⚡ ১ মিনিট পর টেস্ট এলার্ম সেট করুন' : '⚡ Quick 1-min test alarm'}</span>
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0F1E36] border border-slate-700 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-[#0B63F6]"
            />

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
                  onClick={() => setLabel(chip)}
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
                  onClick={() => setRepeatDays([0, 1, 2, 3, 4, 5, 6])}
                  className="text-[#0B63F6] font-bold hover:underline"
                >
                  {lang === 'bn' ? 'প্রতিদিন' : 'Daily'}
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setRepeatDays([])}
                  className="text-slate-400 hover:underline"
                >
                  {lang === 'bn' ? 'একবার' : 'Once'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const active = repeatDays.includes(dayIdx);
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => {
                      if (repeatDays.includes(dayIdx)) {
                        setRepeatDays(repeatDays.filter((d) => d !== dayIdx));
                      } else {
                        setRepeatDays([...repeatDays, dayIdx].sort());
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
                        : 'border-slate-800 bg-[#0F1E36] text-slate-300 hover:border-slate-700'
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
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
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
                      handlePreviewTone('custom');
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
            <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold">{lang === 'bn' ? 'ভাইব্রেশন' : 'Vibrate'}</span>
              </div>
              <button
                type="button"
                onClick={() => setVibrate(!vibrate)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  vibrate ? 'bg-[#0B63F6]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    vibrate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">{lang === 'bn' ? 'স্নুজ' : 'Snooze'}</span>
              <select
                value={snoozeMins}
                onChange={(e) => setSnoozeMins(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
              >
                <option value={5}>5 {lang === 'bn' ? 'মি.' : 'min'}</option>
                <option value={10}>10 {lang === 'bn' ? 'মি.' : 'min'}</option>
                <option value={15}>15 {lang === 'bn' ? 'মি.' : 'min'}</option>
                <option value={20}>20 {lang === 'bn' ? 'মি.' : 'min'}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl font-black text-xs bg-[#0B63F6] hover:bg-blue-600 text-white shadow-xl shadow-blue-950/60 transition cursor-pointer"
            >
              {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Alarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
