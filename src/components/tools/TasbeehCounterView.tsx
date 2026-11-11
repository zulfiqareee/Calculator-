import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  CheckCircle2,
  Award,
  BookOpen,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import { tallySounds } from '../../utils/tallyAudioVoice';

interface Props {
  lang: Language;
}

interface DhikrPreset {
  id: string;
  nameBn: string;
  nameEn: string;
  arabic: string;
  meaningBn: string;
  target: number;
}

const DHIKR_PRESETS: DhikrPreset[] = [
  {
    id: 'subhanallah',
    nameBn: 'সুবহানাল্লাহ',
    nameEn: 'SubhanAllah',
    arabic: 'سُبْحَانَ اللَّهِ',
    meaningBn: 'আল্লাহ অতি পবিত্র ও মহিমান্বিত',
    target: 33,
  },
  {
    id: 'alhamdulillah',
    nameBn: 'আলহামদুলিল্লাহ',
    nameEn: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    meaningBn: 'সমস্ত প্রশংসা একমাত্র আল্লাহর জন্য',
    target: 33,
  },
  {
    id: 'allahuakbar',
    nameBn: 'আল্লাহু আকবার',
    nameEn: 'Allahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    meaningBn: 'আল্লাহ সর্বশ্রেষ্ঠ ও মহান',
    target: 34,
  },
  {
    id: 'astaghfirullah',
    nameBn: 'আস্তাগফিরুল্লাহ',
    nameEn: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    meaningBn: 'আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি',
    target: 100,
  },
  {
    id: 'kalima',
    nameBn: 'লা ইলাহা ইল্লাল্লাহ',
    nameEn: 'La ilaha illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    meaningBn: 'আল্লাহ ব্যতীত কোনো উপাস্য নেই',
    target: 100,
  },
  {
    id: 'salawat',
    nameBn: 'দুরুদ শরীফ',
    nameEn: 'Salawat / Durood',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    meaningBn: 'হে আল্লাহ! মুহাম্মদ (সাঃ)-এর ওপর শান্তি বর্ষণ করুন',
    target: 100,
  },
  {
    id: 'custom',
    nameBn: 'কাস্টম তসবিহ',
    nameEn: 'Custom Dhikr',
    arabic: 'ذِكْرُ اللَّهِ',
    meaningBn: 'নিজের ইচ্ছামতো যেকোনো সংখ্যা গণনা',
    target: 100,
  },
];

const STORAGE_TOTAL_KEY = 'smarthub_tasbeeh_lifetime_total';
const STORAGE_TODAY_KEY = 'smarthub_tasbeeh_today_data';

export const TasbeehCounterView: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrPreset>(DHIKR_PRESETS[0]);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(DHIKR_PRESETS[0].target);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalLifetime, setTotalLifetime] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_TOTAL_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [todayCount, setTodayCount] = useState<number>(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(STORAGE_TODAY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) return parsed.count;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  const handleSelectDhikr = (dhikr: DhikrPreset) => {
    tallySounds.playClickSound();
    setSelectedDhikr(dhikr);
    setTarget(dhikr.target);
    setCount(0);
    setIsCompleted(false);
  };

  const incrementCount = () => {
    const next = count + 1;
    setCount(next);

    // Audio Click
    if (soundEnabled) {
      tallySounds.playClickSound();
    }

    // Haptic
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    // Update Lifetime & Today
    const newTotal = totalLifetime + 1;
    setTotalLifetime(newTotal);
    localStorage.setItem(STORAGE_TOTAL_KEY, String(newTotal));

    const todayStr = new Date().toISOString().slice(0, 10);
    const newToday = todayCount + 1;
    setTodayCount(newToday);
    localStorage.setItem(STORAGE_TODAY_KEY, JSON.stringify({ date: todayStr, count: newToday }));

    // Check completion
    if (next >= target) {
      setIsCompleted(true);
      if (soundEnabled) {
        tallySounds.playSuccessChime();
      }
      if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 150]);
      }
    }
  };

  const handleReset = () => {
    tallySounds.playClickSound();
    setCount(0);
    setIsCompleted(false);
  };

  const progressPct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-emerald-700 via-teal-800 to-slate-900 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
            📿
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                স্মার্ট ডিজিটাল তসবিহ
              </span>
            </div>
            <h3 className="text-sm font-black mt-1">
              {isBn ? selectedDhikr.nameBn : selectedDhikr.nameEn}
            </h3>
          </div>
        </div>

        {/* Sound & Vibration Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-black/30 border-white/10 text-white/50'
            }`}
            title="শব্দ অন/অফ"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setVibrateEnabled(!vibrateEnabled)}
            className={`p-2 rounded-xl border transition ${
              vibrateEnabled
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-black/30 border-white/10 text-white/50'
            }`}
            title="ভাইব্রেশন অন/অফ"
          >
            {vibrateEnabled ? <Vibrate className="w-4 h-4" /> : <VibrateOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Daily & Lifetime Counter Badges */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
              আজকের মোট যিকির:
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatNumber(todayCount, lang)} বার
            </span>
          </div>
          <Award className="w-5 h-5 text-emerald-500 opacity-80" />
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
              সর্বমোট তসবিহ:
            </span>
            <span className="text-base font-black text-slate-700 dark:text-slate-200">
              {formatNumber(totalLifetime, lang)} বার
            </span>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Preset Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {DHIKR_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelectDhikr(p)}
            className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1 cursor-pointer ${
              selectedDhikr.id === p.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>{isBn ? p.nameBn : p.nameEn}</span>
            <span className="text-[10px] opacity-75">({formatNumber(p.target, lang)})</span>
          </button>
        ))}
      </div>

      {/* Main Big Circular Tactile Clicker */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
        {/* Arabic Typography Banner */}
        <div className="py-2">
          <span className="text-2xl sm:text-3xl font-serif font-black text-emerald-800 dark:text-emerald-400 block tracking-wide">
            {selectedDhikr.arabic}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">
            "{selectedDhikr.meaningBn}"
          </p>
        </div>

        {/* Radial Circular Tap Button */}
        <button
          type="button"
          onClick={incrementCount}
          className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-xl focus:outline-hidden group"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #059669, #065f46 60%, #064e3b 100%)',
          }}
        >
          {/* Subtle Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition" />

          {/* Progress Ring Indicator */}
          <div
            className="absolute -inset-2 rounded-full border-4 border-emerald-400/40 transition-all"
            style={{
              clipPath: `inset(0 0 0 0)`,
              opacity: progressPct > 0 ? 1 : 0.3,
            }}
          />

          <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight drop-shadow-md">
            {formatNumber(count, lang)}
          </span>

          <span className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">
            টার্গেট: {formatNumber(target, lang)}
          </span>

          <span className="text-[11px] text-white/80 mt-2 bg-black/20 px-3 py-0.5 rounded-full backdrop-blur-xs">
            স্পর্শ করুন (Tap to Count)
          </span>
        </button>

        {/* Progress bar */}
        <div className="w-full max-w-xs flex flex-col gap-1.5 mt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>অগ্রগতি: {formatNumber(progressPct, lang)}%</span>
            <span>
              {formatNumber(count, lang)} / {formatNumber(target, lang)}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Completion Notice */}
        {isCompleted && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>মাশাআল্লাহ! {selectedDhikr.nameBn} এর টার্গেট পূর্ণ হয়েছে।</span>
          </div>
        )}

        {/* Controls: Reset & Target Adjustment */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট (০)</span>
          </button>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-bold">টার্গেট:</span>
            {[33, 100, 500].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  tallySounds.playClickSound();
                  setTarget(t);
                  if (count < t) setIsCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                  target === t
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {formatNumber(t, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
