import React, { useState } from 'react';
import { CalendarRange, Copy, Check, RotateCcw, ArrowRight, CalendarDays, Briefcase } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

export const DateDifferenceCalculator: React.FC<Props> = ({ lang }) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  const getEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.toISOString().split('T')[0];
  };

  const getEndOfYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-12-31`;
  };

  const [startDate, setStartDate] = useState<string>(getToday());
  const [endDate, setEndDate] = useState<string>(getEndOfMonth());
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  const calculateDiff = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    // Determine direction
    const isPast = end < start;
    const earlier = isPast ? end : start;
    const later = isPast ? start : end;

    const diffTime = later.getTime() - earlier.getTime();
    let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (includeEndDay) {
      totalDays += 1;
    }

    // Years, Months, Days breakdown
    let years = later.getFullYear() - earlier.getFullYear();
    let months = later.getMonth() - earlier.getMonth();
    let days = later.getDate() - earlier.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (includeEndDay) {
      days += 1;
    }

    // Weeks
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;

    // Count business days (Monday-Friday) vs Weekend (Saturday-Sunday)
    let businessDays = 0;
    let weekendDays = 0;
    const cur = new Date(earlier);
    const limitDays = includeEndDay ? totalDays : totalDays;

    for (let i = 0; i < limitDays; i++) {
      const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++;
      } else {
        businessDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      totalDays,
      years,
      months,
      days,
      weeks,
      remDays,
      businessDays,
      weekendDays,
      isPast,
    };
  };

  const diff = calculateDiff();

  const handleCopy = async () => {
    if (!diff) return;
    const text = `Date Difference from ${startDate} to ${endDate}:
Total Days: ${diff.totalDays} days
Breakdown: ${diff.years} years, ${diff.months} months, ${diff.days} days
Weeks: ${diff.weeks} weeks and ${diff.remDays} days
Business Days (Mon-Fri): ${diff.businessDays} days, Weekends: ${diff.weekendDays} days`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'date-diff',
      titleEn: 'Date Difference',
      titleBn: 'তারিখের ব্যবধান',
      expression: `${startDate} to ${endDate}`,
      result: `${diff.totalDays} days (${diff.years}y ${diff.months}m ${diff.days}d)`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Date Pickers Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn' ? 'শেষ তারিখ' : 'End Date'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => {
              setStartDate(getToday());
              setEndDate(getEndOfMonth());
            }}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300 transition"
          >
            {lang === 'bn' ? 'চলতি মাস শেষ' : 'End of Month'}
          </button>
          <button
            onClick={() => {
              setStartDate(getToday());
              setEndDate(getEndOfYear());
            }}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300 transition"
          >
            {lang === 'bn' ? 'চলতি বছর শেষ' : 'End of Year'}
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setStartDate(getToday());
              d.setDate(d.getDate() + 30);
              setEndDate(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300 transition"
          >
            +30 {lang === 'bn' ? 'দিন' : 'Days'}
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setStartDate(getToday());
              d.setDate(d.getDate() + 90);
              setEndDate(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium rounded-xl text-slate-700 dark:text-slate-300 transition"
          >
            +90 {lang === 'bn' ? 'দিন' : 'Days'}
          </button>
        </div>

        {/* Include end date option */}
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            type="checkbox"
            checked={includeEndDay}
            onChange={(e) => setIncludeEndDay(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>{lang === 'bn' ? 'শেষের দিনটি গণনাতে অন্তর্ভুক্ত করুন (+১ দিন)' : 'Include end date in calculation (+1 day)'}</span>
        </label>
      </div>

      {/* Results Display */}
      {diff && (
        <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CalendarRange className="w-4 h-4" />
              {lang === 'bn' ? 'মোট দিন সংখ্যা:' : 'Total Days Difference:'}
            </span>
            {diff.isPast && (
              <span className="text-amber-400 text-[11px]">
                {lang === 'bn' ? '(অতীতের তারিখ)' : '(Past Date)'}
              </span>
            )}
          </div>

          {/* Big Days Result */}
          <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
            {formatNumber(diff.totalDays, lang)} <span className="text-lg font-sans font-bold text-emerald-400">{lang === 'bn' ? 'দিন' : 'Days'}</span>
          </div>

          {/* Breakdown: Years, Months, Days */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs flex justify-around text-center">
            <div>
              <span className="text-xl font-bold font-mono text-cyan-400">{formatNumber(diff.years, lang)}</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{lang === 'bn' ? 'বছর' : 'Years'}</span>
            </div>
            <div className="border-r border-slate-800" />
            <div>
              <span className="text-xl font-bold font-mono text-teal-400">{formatNumber(diff.months, lang)}</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{lang === 'bn' ? 'মাস' : 'Months'}</span>
            </div>
            <div className="border-r border-slate-800" />
            <div>
              <span className="text-xl font-bold font-mono text-emerald-400">{formatNumber(diff.days, lang)}</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">{lang === 'bn' ? 'দিন' : 'Days'}</span>
            </div>
          </div>

          {/* Business Days vs Weekends */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'কার্যদিবস (সোম-শুক্র)' : 'Business Days'}</span>
                <span className="font-mono font-bold text-sm text-white">{formatNumber(diff.businessDays, lang)} {lang === 'bn' ? 'দিন' : 'days'}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">{lang === 'bn' ? 'সাপ্তাহিক ছুটি (শনি-রবি)' : 'Weekends'}</span>
                <span className="font-mono font-bold text-sm text-white">{formatNumber(diff.weekendDays, lang)} {lang === 'bn' ? 'দিন' : 'days'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition shadow-sm mt-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : (lang === 'bn' ? 'তারিখের হিসাব কপি করুন' : 'Copy Date Result')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
