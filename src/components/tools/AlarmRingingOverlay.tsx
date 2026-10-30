import React, { useEffect, useState } from 'react';
import { BellRing, Volume2, XCircle, Clock, VolumeX } from 'lucide-react';
import { Language } from '../../types';
import { AlarmItem, dismissActiveAlarm, snoozeActiveAlarm } from '../../utils/alarmStorage';

interface Props {
  alarm: AlarmItem;
  lang: Language;
}

export const AlarmRingingOverlay: React.FC<Props> = ({ alarm, lang }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      updateTime();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const getToneLabel = () => {
    switch (alarm.soundTone) {
      case 'azan':
        return lang === 'bn' ? 'ফজর আযানের সুর' : 'Fajr Azan Tone';
      case 'digital':
        return lang === 'bn' ? 'ডিজিটাল বিপ অ্যালার্ম' : 'Digital Beep Alarm';
      case 'radar':
        return lang === 'bn' ? 'জরুরি রাডার সংকেত' : 'Radar Pulse';
      case 'birds':
        return lang === 'bn' ? 'পাখির মিষ্টি ডাক' : 'Morning Birds';
      case 'peaceful':
        return lang === 'bn' ? 'প্রশান্তিময় সুর' : 'Peaceful Melodies';
      case 'custom':
        return lang === 'bn' ? 'আপনার নিজস্ব অডিও' : 'Custom Sound';
      default:
        return lang === 'bn' ? 'মধুর ঘণ্টা (Chime)' : 'Sweet Chime';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] w-screen h-screen bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between items-center text-white p-5 sm:p-8 select-none overflow-y-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* Top Banner Status */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black tracking-wider animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span>{lang === 'bn' ? 'অ্যালার্ম বাজছে!' : 'ALARM RINGING!'}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
          <Volume2 className="w-3.5 h-3.5" />
          <span>{getToneLabel()}</span>
        </div>
      </div>

      {/* Center Alarm Hero Card */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-6 max-w-sm w-full">
        {/* Animated Pulsing Bell Ring Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping duration-1000"></div>
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-pulse duration-1500"></div>
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-8 ring-rose-500/40">
            <BellRing className="w-14 h-14 text-white animate-bounce" />
          </div>
        </div>

        {/* Big Digital Alarm Time */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {lang === 'bn' ? 'নির্ধারিত সময়' : 'Scheduled Time'}
          </span>
          <h2 className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {toBn(alarm.time)}
          </h2>
          <p className="text-xs font-medium text-slate-400 font-mono">
            {lang === 'bn' ? `বর্তমান সময়: ${toBn(currentTimeStr)}` : `Current: ${currentTimeStr}`}
          </p>
        </div>

        {/* Alarm Label Title */}
        <div className="mt-5 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 max-w-xs">
          <h3 className="text-xl sm:text-2xl font-black text-amber-300 leading-tight">
            {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
          </h3>
        </div>

        {/* Ringing Duration counter */}
        <span className="text-xs text-slate-400 mt-4 inline-flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {lang === 'bn'
              ? `${toBn(elapsedSeconds)} সেকেন্ড ধরে বাজছে...`
              : `Ringing for ${elapsedSeconds} seconds...`}
          </span>
        </span>
      </div>

      {/* Bottom Big Action Buttons */}
      <div className="w-full max-w-md space-y-3 pb-safe pt-4">
        {/* Big Stop / Dismiss Button */}
        <button
          type="button"
          onClick={() => dismissActiveAlarm()}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg shadow-xl shadow-rose-950/60 active:scale-98 transition flex items-center justify-center gap-2.5 border-2 border-rose-400/30 cursor-pointer"
        >
          <XCircle className="w-6 h-6 shrink-0" />
          <span>{lang === 'bn' ? 'অ্যালার্ম বন্ধ করুন (DISMISS)' : 'DISMISS ALARM'}</span>
        </button>

        {/* Snooze Button */}
        <button
          type="button"
          onClick={() => snoozeActiveAlarm(5)}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-bold text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
        >
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            {lang === 'bn' ? '৫ মিনিট পর আবার বাজান (স্নুজ)' : 'Snooze for 5 Minutes'}
          </span>
        </button>
      </div>
    </div>
  );
};
