import React, { useEffect, useState } from 'react';
import { BellRing, Volume2, XCircle, Clock } from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  dismissActiveAlarm,
  snoozeActiveAlarm,
  getAlarmSettings,
} from '../../utils/alarmEngine';

interface Props {
  alarm: AlarmItem;
  lang: Language;
}

export const AlarmRingingScreen: React.FC<Props> = ({ alarm, lang }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const settings = getAlarmSettings();
  const snoozeMins = alarm.snoozeDuration || settings.snoozeDurationMinutes || 5;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      update();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const getToneBadgeName = () => {
    switch (alarm.soundTone) {
      case 'azan':
        return lang === 'bn' ? 'ফজর আযানের সুর' : 'Fajr Azan Tone';
      case 'digital':
        return lang === 'bn' ? 'ডিজিটাল বিপ বিপ' : 'Digital Beep Alarm';
      case 'radar':
        return lang === 'bn' ? 'জরুরি রাডার সংকেত' : 'Radar Pulse';
      case 'birds':
        return lang === 'bn' ? 'পাখির মিষ্টি ডাক' : 'Morning Birds';
      case 'peaceful':
        return lang === 'bn' ? 'প্রশান্তিময় মারিম্বা' : 'Peaceful Melodies';
      case 'classic_bell':
        return lang === 'bn' ? 'ক্লাসিক টুইন বেল' : 'Classic Bell';
      case 'custom':
        return alarm.customSoundName || (lang === 'bn' ? 'কাস্টম অডিও' : 'Custom Sound');
      default:
        return lang === 'bn' ? 'মধুর ঘণ্টা (Chime)' : 'Sweet Chime';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] w-screen h-screen bg-[#071326] flex flex-col justify-between items-center text-white p-6 sm:p-8 select-none overflow-y-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* Top Header Status Pills matching screenshot */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        {/* Left red pill: Glowing dot + "অ্যালার্ম বাজছে!" */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black tracking-wider animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span>{lang === 'bn' ? 'অ্যালার্ম বাজছে!' : 'ALARM RINGING!'}</span>
        </div>

        {/* Right blue pill: Speaker icon + Tone name */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{getToneBadgeName()}</span>
        </div>
      </div>

      {/* Center Alarm Hero matching uploaded screenshot */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-6 max-w-sm w-full">
        {/* Pulsing Gradient Circle with Ringing Bell */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping duration-1000"></div>
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-pulse duration-1500"></div>
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#E11D48] via-[#F43F5E] to-[#6366F1] flex items-center justify-center shadow-2xl ring-8 ring-rose-500/30">
            <BellRing className="w-16 h-16 sm:w-18 sm:h-18 text-white animate-bounce" />
          </div>
        </div>

        {/* Scheduled Time Section */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {lang === 'bn' ? 'নির্ধারিত সময়' : 'Scheduled Time'}
          </span>
          <h2 className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {toBn(alarm.time)}
          </h2>
          <p className="text-xs font-medium text-slate-400 font-mono">
            {lang === 'bn' ? `বর্তমান সময়: ${toBn(currentTimeStr)}` : `Current Time: ${currentTimeStr}`}
          </p>
        </div>

        {/* Alarm Label Title Chip with golden yellow text */}
        <div className="mt-5 px-5 py-2.5 rounded-2xl bg-white/10 border border-white/15 max-w-xs shadow-inner">
          <h3 className="text-xl sm:text-2xl font-black text-amber-300 leading-tight">
            {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
          </h3>
        </div>

        {/* Elapsed Ringing Duration Counter */}
        <span className="text-xs text-slate-400 mt-4 inline-flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {lang === 'bn'
              ? `${toBn(elapsedSeconds)} সেকেন্ড ধরে বাজছে...`
              : `Ringing for ${elapsedSeconds} seconds...`}
          </span>
        </span>
      </div>

      {/* Bottom Dismiss and Snooze Buttons matching screenshot */}
      <div className="w-full max-w-md space-y-3 pb-safe pt-4">
        {/* Big Red Dismiss Button */}
        <button
          type="button"
          onClick={() => dismissActiveAlarm()}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-lg shadow-xl shadow-red-950/60 active:scale-98 transition flex items-center justify-center gap-2.5 border-2 border-red-400/30 cursor-pointer"
        >
          <XCircle className="w-6 h-6 shrink-0" />
          <span>{lang === 'bn' ? 'অ্যালার্ম বন্ধ করুন (DISMISS)' : 'DISMISS ALARM'}</span>
        </button>

        {/* Secondary Dark Navy Snooze Button */}
        <button
          type="button"
          onClick={() => snoozeActiveAlarm(snoozeMins)}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
        >
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            {lang === 'bn'
              ? `${toBn(snoozeMins)} মিনিট পর আবার বাজান (স্নুজ)`
              : `Snooze for ${snoozeMins} Minutes`}
          </span>
        </button>
      </div>
    </div>
  );
};
