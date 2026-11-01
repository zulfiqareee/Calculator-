import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Music,
  Timer,
  Volume2,
  Sliders,
  Upload,
  Play,
  Square,
  Smartphone,
  Check,
} from 'lucide-react';
import { Language } from '../../types';
import {
  GlobalAlarmSettings,
  SoundToneType,
  getAlarmSettings,
  saveAlarmSettings,
  startAlarmAudioPlayback,
  stopAlarmAudioPlayback,
  playChimeNote,
  saveCustomSoundData,
  unlockAudio,
} from '../../utils/alarmEngine';
import { AdMobBanner } from '../admob/AdMobBanner';

interface Props {
  lang: Language;
  onClose: () => void;
}

export const AlarmSettingsModal: React.FC<Props> = ({ lang, onClose }) => {
  const [settings, setSettings] = useState<GlobalAlarmSettings>(getAlarmSettings());
  const [previewingTone, setPreviewingTone] = useState<SoundToneType | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const handleUpdate = (patch: Partial<GlobalAlarmSettings>) => {
    const updated = saveAlarmSettings(patch);
    setSettings(updated);
  };

  const handlePreview = (tone: SoundToneType) => {
    unlockAudio();
    if (previewingTone === tone) {
      stopAlarmAudioPlayback();
      setPreviewingTone(null);
      return;
    }
    stopAlarmAudioPlayback();
    setPreviewingTone(tone);
    startAlarmAudioPlayback(tone, false, false);
    setTimeout(() => {
      setPreviewingTone((prev) => (prev === tone ? null : prev));
      stopAlarmAudioPlayback();
    }, 4500);
  };

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
        handleUpdate({ defaultRingtone: 'custom' });
        setUploadToast(
          lang === 'bn'
            ? `"${file.name}" রিংটোন হিসেবে সংরক্ষিত হয়েছে!`
            : `"${file.name}" saved as custom sound!`
        );
        setTimeout(() => setUploadToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const TONES: { id: SoundToneType; nameBn: string; nameEn: string; icon: string }[] = [
    { id: 'chime', nameBn: 'মধুর ঘণ্টা (Chime)', nameEn: 'Sweet Chime', icon: '🔔' },
    { id: 'radar', nameBn: 'জরুরি রাডার সংকেত', nameEn: 'Radar Pulse', icon: '🚨' },
    { id: 'azan', nameBn: 'ফজর আযানের সুর', nameEn: 'Fajr Azan', icon: '🕌' },
    { id: 'digital', nameBn: 'ডিজিটাল বিপ বিপ', nameEn: 'Digital Beep', icon: '⏰' },
    { id: 'peaceful', nameBn: 'প্রশান্তিময় মারিম্বা', nameEn: 'Peaceful Melodies', icon: '🎵' },
    { id: 'birds', nameBn: 'পাখির মিষ্টি ডাক', nameEn: 'Morning Birds', icon: '🐦' },
    { id: 'classic_bell', nameBn: 'ক্লাসিক টুইন বেল', nameEn: 'Classic Bell', icon: '🛎️' },
  ];

  const TIMER_TONES = [
    { id: 'bell_chime', nameBn: 'টাইমার বেল', nameEn: 'Timer Bell' },
    { id: 'digital_beep', nameBn: 'ডিজিটাল বিপ', nameEn: 'Digital Beep' },
    { id: 'kitchen_ding', nameBn: 'কিচেন ডিং', nameEn: 'Kitchen Ding' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#10141D] border border-neutral-800 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0B63F6]/20 text-[#0B63F6] flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {lang === 'bn' ? 'অ্যালার্ম সেটিংস' : 'Alarm Settings'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {lang === 'bn' ? 'রিংটোন, ভলিউম, অটো-সাইলেন্স ও আচরণ' : 'Ringtone, Volume & Behaviors'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadToast && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{uploadToast}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* 1. Default Alarm Ringtone */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#0B63F6]" />
              <span className="font-bold text-white">
                {lang === 'bn' ? 'ডিফল্ট অ্যালার্ম রিংটোন' : 'Default Alarm Ringtone'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TONES.map((t) => {
                const isSelected = settings.defaultRingtone === t.id;
                const isPlaying = previewingTone === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleUpdate({ defaultRingtone: t.id })}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-[#0B63F6] bg-[#0B63F6]/20 text-white font-bold'
                        : 'border-neutral-800 bg-black text-neutral-300'
                    }`}
                  >
                    <span className="truncate">{t.icon} {lang === 'bn' ? t.nameBn : t.nameEn}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(t.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-white"
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom file upload */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                {lang === 'bn' ? 'মেমোরি থেকে অডিও আপলোড:' : 'Upload from phone storage:'}
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
                className="px-3 py-1 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফাইল নির্বাচন' : 'Choose File'}</span>
              </button>
            </div>
          </div>

          {/* 2. Timer Ringtone */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#0B63F6]" />
              <span className="font-bold text-white">
                {lang === 'bn' ? 'টাইমার রিংটোন' : 'Timer Ringtone'}
              </span>
            </div>
            <select
              value={settings.timerRingtone}
              onChange={(e) => handleUpdate({ timerRingtone: e.target.value })}
              className="bg-black border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white"
            >
              {TIMER_TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {lang === 'bn' ? t.nameBn : t.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Ringtone Volume */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
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
                const newV = parseFloat(e.target.value);
                handleUpdate({ volume: newV });
                playChimeNote(659.25, 'sine', 0.2, 0.3);
              }}
              className="w-full accent-[#0B63F6] cursor-pointer"
            />
          </div>

          {/* 4. Auto-silence */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">
                {lang === 'bn' ? 'অটো-সাইলেন্স (Auto-silence)' : 'Auto-silence'}
              </span>
              <span className="text-[10px] text-neutral-400">
                {lang === 'bn' ? 'অ্যালার্ম বন্ধ না করলে যত পর থামবে' : 'Silence after ringing for'}
              </span>
            </div>
            <select
              value={settings.autoSilenceMinutes}
              onChange={(e) => handleUpdate({ autoSilenceMinutes: parseInt(e.target.value, 10) })}
              className="bg-black border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white"
            >
              <option value={1}>1 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={5}>5 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={10}>10 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={15}>15 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={20}>20 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={30}>30 {lang === 'bn' ? 'মি.' : 'min'}</option>
              <option value={0}>{lang === 'bn' ? 'কখনও নয়' : 'Never'}</option>
            </select>
          </div>

          {/* 5. Snooze Duration */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-white">
              {lang === 'bn' ? 'ডিফল্ট স্নুজ সময়' : 'Default Snooze Length'}
            </span>
            <select
              value={settings.snoozeDurationMinutes}
              onChange={(e) => handleUpdate({ snoozeDurationMinutes: parseInt(e.target.value, 10) })}
              className="bg-black border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-white"
            >
              <option value={5}>5 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
              <option value={10}>10 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
              <option value={15}>15 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
              <option value={20}>20 {lang === 'bn' ? 'মিনিট' : 'minutes'}</option>
            </select>
          </div>

          {/* 6. Vibration ON/OFF */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-neutral-400" />
              <span className="font-bold text-white">
                {lang === 'bn' ? 'অ্যালার্মের সাথে ভাইব্রেশন' : 'Vibrate when alarm sounds'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleUpdate({ vibrateWithAlarm: !settings.vibrateWithAlarm })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                settings.vibrateWithAlarm ? 'bg-[#0B63F6]' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.vibrateWithAlarm ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 7. Additional Behaviors */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">
                  {lang === 'bn' ? 'ক্রমবর্ধমান ভলিউম (Ascending)' : 'Ascending Volume'}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {lang === 'bn' ? 'ধীরে ধীরে সাউন্ড বৃদ্ধি পাবে' : 'Gradually increase volume'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ ascendingVolume: !settings.ascendingVolume })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  settings.ascendingVolume ? 'bg-[#0B63F6]' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.ascendingVolume ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* AdMob Banner in Settings where space permits */}
        <div className="pt-2 border-t border-neutral-800 overflow-hidden">
          <AdMobBanner lang={lang} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          {lang === 'bn' ? 'সম্পন্ন (Done)' : 'Done'}
        </button>
      </div>
    </div>
  );
};
