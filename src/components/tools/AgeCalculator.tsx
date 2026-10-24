import React, { useState } from 'react';
import { CalendarClock, Cake, Copy, Check, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

export const AgeCalculator: React.FC<Props> = ({ lang }) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [dob, setDob] = useState<string>('2000-01-01');
  const [targetDate, setTargetDate] = useState<string>(getTodayString());
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  // Bengali Weekdays
  const BENGALI_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Age calculation
  const calculateAge = () => {
    if (!dob || !targetDate) return null;

    const birth = new Date(dob);
    const target = new Date(targetDate);

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;

    if (birth > target) {
      return {
        error:
          lang === 'bn'
            ? 'জন্মতারিখ বর্তমান তারিখের চেয়ে পরের হতে পারে না।'
            : 'Date of birth cannot be after the reference date.',
      };
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      // borrow days from previous month
      months -= 1;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total stats
    const diffTime = target.getTime() - birth.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    // Next Birthday calculation
    const currentYear = target.getFullYear();
    let nextBday = new Date(currentYear, birth.getMonth(), birth.getDate());
    if (nextBday < target) {
      nextBday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    }

    const nextBdayDiff = nextBday.getTime() - target.getTime();
    const nextBdayDays = Math.ceil(nextBdayDiff / (1000 * 60 * 60 * 24));
    const nextBdayMonths = Math.floor(nextBdayDays / 30.4375);
    const nextBdayRemainingDays = Math.round(nextBdayDays % 30.4375);
    const nextBdayDayName =
      lang === 'bn' ? BENGALI_WEEKDAYS[nextBday.getDay()] : ENGLISH_WEEKDAYS[nextBday.getDay()];

    const birthDayName =
      lang === 'bn' ? BENGALI_WEEKDAYS[birth.getDay()] : ENGLISH_WEEKDAYS[birth.getDay()];

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      totalHours,
      totalMinutes,
      nextBdayDays,
      nextBdayMonths,
      nextBdayRemainingDays,
      nextBdayDayName,
      birthDayName,
    };
  };

  const ageData = calculateAge();

  const handleCopy = async () => {
    if (!ageData || 'error' in ageData) return;
    const text = `${lang === 'bn' ? 'বয়স' : 'Age'}: ${ageData.years} ${lang === 'bn' ? 'বছর' : 'years'}, ${ageData.months} ${lang === 'bn' ? 'মাস' : 'months'}, ${ageData.days} ${lang === 'bn' ? 'দিন' : 'days'}. ${lang === 'bn' ? 'পরবর্তী জন্মদিন' : 'Next birthday in'}: ${ageData.nextBdayDays} ${lang === 'bn' ? 'দিন পর' : 'days'}.`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'age',
      titleEn: 'Age Calculation',
      titleBn: 'বয়স নির্ণয়',
      expression: `DOB: ${dob}`,
      result: `${ageData.years}y ${ageData.months}m ${ageData.days}d`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Date Pickers Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'bn' ? 'জন্মতারিখ (Date of Birth)' : 'Date of Birth'}
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'bn' ? 'যে তারিখ পর্যন্ত বয়স নির্ণয় হবে' : 'Calculate Age As Of'}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white"
            />
            <button
              onClick={() => setTargetDate(getTodayString())}
              className="px-3.5 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 transition"
            >
              {lang === 'bn' ? 'আজ' : 'Today'}
            </button>
          </div>
        </div>
      </div>

      {/* Error display if invalid */}
      {ageData && 'error' in ageData && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs font-medium">
          {ageData.error}
        </div>
      )}

      {/* Main Age Result Display */}
      {ageData && !('error' in ageData) && (
        <>
          <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CalendarClock className="w-4 h-4 text-emerald-400" />
                {lang === 'bn' ? 'বর্তমান নিখুঁত বয়স:' : 'Exact Age:'}
              </span>
              <span className="text-slate-400">
                {lang === 'bn' ? `জন্মবার: ${ageData.birthDayName}` : `Born on: ${ageData.birthDayName}`}
              </span>
            </div>

            {/* 3 Pillars: Years, Months, Days */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                  {formatNumber(ageData.years, lang)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  {lang === 'bn' ? 'বছর' : 'Years'}
                </span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-teal-400 font-mono">
                  {formatNumber(ageData.months, lang)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  {lang === 'bn' ? 'মাস' : 'Months'}
                </span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">
                  {formatNumber(ageData.days, lang)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  {lang === 'bn' ? 'দিন' : 'Days'}
                </span>
              </div>
            </div>

            {/* Next Birthday Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Cake className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-amber-300 font-semibold block">
                    {lang === 'bn' ? 'পরবর্তী জন্মদিন:' : 'Next Birthday:'}
                  </span>
                  <span className="text-slate-300 text-[11px]">
                    {lang === 'bn'
                      ? `${formatNumber(ageData.nextBdayDays, lang)} দিন বাকি (${ageData.nextBdayDayName})`
                      : `${ageData.nextBdayDays} days to go (${ageData.nextBdayDayName})`}
                  </span>
                </div>
              </div>
              <div className="font-mono text-amber-300 font-bold text-sm">
                🎉 {formatNumber(ageData.years + 1, lang)} {lang === 'bn' ? 'তম' : 'th'}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.actions.copied : (lang === 'bn' ? 'বয়সের বিবরণী কপি করুন' : 'Copy Age Summary')}</span>
            </button>
          </div>

          {/* Lifetime Summary Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'জীবনের মোট সময় পরিসংখ্যান:' : 'Total Lifetime Statistics:'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{lang === 'bn' ? 'মোট দিন' : 'Total Days'}</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {formatNumber(ageData.totalDays.toLocaleString(), lang)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{lang === 'bn' ? 'মোট সপ্তাহ' : 'Total Weeks'}</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {formatNumber(ageData.totalWeeks.toLocaleString(), lang)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{lang === 'bn' ? 'মোট ঘণ্টা' : 'Total Hours'}</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {formatNumber(ageData.totalHours.toLocaleString(), lang)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{lang === 'bn' ? 'মোট মিনিট' : 'Total Minutes'}</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {formatNumber(ageData.totalMinutes.toLocaleString(), lang)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
