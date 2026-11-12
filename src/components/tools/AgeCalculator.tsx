import React, { useState } from 'react';
import {
  CalendarClock,
  Cake,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Award,
  Heart,
  Globe,
  HelpCircle,
  ChevronRight,
  UserCheck,
  CalendarDays,
  Hourglass,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';
import {
  GOVT_JOB_CATEGORIES,
  JobCategoryRule,
  calculatePreciseAge,
  checkJobEligibility,
  getZodiacSign,
  getPlanetaryAges,
  getBiologicalStats,
  calculateWorkingDaysBD,
  calculateGovtRetirement,
} from '../../utils/jobEligibilityEngine';
import { toBnDigits } from './BanglaEnglishCalendar';

interface Props {
  lang: Language;
}

type TabMode = 'age' | 'bcs_job' | 'diff_work' | 'retirement';

export const AgeCalculator: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const t = UI_TEXT[lang];

  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabMode>('age');

  // Tab 1: Exact Age Inputs
  const [dob, setDob] = useState<string>('1998-05-15');
  const [asOfDate, setAsOfDate] = useState<string>(getTodayString());
  const [copied, setCopied] = useState<boolean>(false);

  // Tab 2: BCS & Govt Job Eligibility Inputs
  const [jobCategory, setJobCategory] = useState<string>('general_bcs');
  const [jobCutoffDate, setJobCutoffDate] = useState<string>(getTodayString());
  const [customMaxAge, setCustomMaxAge] = useState<number>(32);
  const [customMinAge, setCustomMinAge] = useState<number>(21);

  // Tab 3: Date Diff & Working Days Inputs
  const [date1, setDate1] = useState<string>(getTodayString());
  const [date2, setDate2] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [weekendRule, setWeekendRule] = useState<'bd_fri_sat' | 'intl_sat_sun'>('bd_fri_sat');
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(true);

  // Tab 4: Retirement Inputs
  const [retireDob, setRetireDob] = useState<string>('1970-01-01');
  const [retireAge, setRetireAge] = useState<number>(59);

  // Weekdays
  const BENGALI_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Calculations for Tab 1 (Exact Age)
  const ageData = (() => {
    const birth = new Date(dob);
    const target = new Date(asOfDate);
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
    if (birth > target) {
      return {
        error: isBn
          ? 'জন্মতারিখ বর্তমান বা কাঙ্ক্ষিত তারিখের চেয়ে পরের হতে পারে না।'
          : 'Date of birth cannot be after the reference date.',
      };
    }

    const precise = calculatePreciseAge(dob, asOfDate);
    if (!precise) return null;

    const { years, months, days, totalDays } = precise;
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
    const nextBdayDayName = isBn ? BENGALI_WEEKDAYS[nextBday.getDay()] : ENGLISH_WEEKDAYS[nextBday.getDay()];
    const birthDayName = isBn ? BENGALI_WEEKDAYS[birth.getDay()] : ENGLISH_WEEKDAYS[birth.getDay()];

    // Zodiac
    const zodiac = getZodiacSign(birth.getMonth() + 1, birth.getDate());

    // Biological stats
    const biological = getBiologicalStats(totalDays);

    // Planetary
    const planets = getPlanetaryAges(years + months / 12);

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
      nextBdayDayName,
      birthDayName,
      zodiac,
      biological,
      planets,
    };
  })();

  // Calculations for Tab 2 (BCS & Govt Job Eligibility)
  const selectedRule = GOVT_JOB_CATEGORIES.find((c) => c.id === jobCategory) || GOVT_JOB_CATEGORIES[0];
  const jobResult = checkJobEligibility(
    dob,
    jobCutoffDate,
    selectedRule,
    jobCategory === 'custom' ? customMinAge : undefined,
    jobCategory === 'custom' ? customMaxAge : undefined
  );

  // Calculations for Tab 3 (Working Days)
  const workingDaysResult = calculateWorkingDaysBD(date1, date2, includeEndDate, weekendRule);

  // Calculations for Tab 4 (Retirement)
  const retirementResult = calculateGovtRetirement(retireDob, retireAge);

  const handleCopy = async () => {
    if (!ageData || 'error' in ageData) return;
    const text = isBn
      ? `বয়স: ${toBnDigits(ageData.years)} বছর ${toBnDigits(ageData.months)} মাস ${toBnDigits(ageData.days)} দিন। জন্মবার: ${ageData.birthDayName}। পরবর্তী জন্মদিন: ${toBnDigits(ageData.nextBdayDays)} দিন পর (${ageData.nextBdayDayName})। রাশি: ${ageData.zodiac.nameBn}`
      : `Age: ${ageData.years} yrs, ${ageData.months} mos, ${ageData.days} days. Born on: ${ageData.birthDayName}. Next Birthday: in ${ageData.nextBdayDays} days (${ageData.nextBdayDayName}). Zodiac: ${ageData.zodiac.nameEn}.`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'age',
      titleEn: 'Age Calculation',
      titleBn: 'বয়স ও বিসিএস যোগ্যতা',
      expression: `DOB: ${dob} AsOf: ${asOfDate}`,
      result: `${ageData.years}y ${ageData.months}m ${ageData.days}d`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full pb-10">
      {/* Super-App Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isBn ? 'স্মার্ট এইজ অ্যান্ড জব হাব' : 'Smart Age & Job Hub'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isBn ? 'নতুন ৩২ বছর অধ্যাদেশ' : 'New 32-Yr Rule'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {isBn ? 'বয়স ও বিসিএস জব যোগ্যতা' : 'Age & BCS Job Eligibility'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {isBn
                ? 'সঠিক বয়স, সরকারি চাকরির ৩২ বছর কাট-অফ ডেট, কর্মদিবস ও অবসর গণনা'
                : 'Exact age, Govt Job 32-yr limit, working days & pension dates'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <CalendarClock className="w-6 h-6 text-emerald-300" />
          </div>
        </div>

        {/* 4 Super Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4 p-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('age')}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'age'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isBn ? 'বয়স ও জন্মদিন' : 'Age & B-Day'}</span>
          </button>

          <button
            onClick={() => setActiveTab('bcs_job')}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'bcs_job'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isBn ? 'বিসিএস যোগ্যতা' : 'Govt Job 32y'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diff_work')}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'diff_work'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{isBn ? 'কর্মদিবস' : 'Work Days'}</span>
          </button>

          <button
            onClick={() => setActiveTab('retirement')}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'retirement'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>{isBn ? 'অবসর ও PRL' : 'Retirement'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: EXACT AGE & NEXT BIRTHDAY & LIFE MILESTONES
         ======================================================== */}
      {activeTab === 'age' && (
        <div className="space-y-4">
          {/* Date Picker Input Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'আপনার জন্মতারিখ (Date of Birth)' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'যে তারিখ পর্যন্ত বয়স নির্ণয় করবেন' : 'Calculate Age As Of'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => setAsOfDate(getTodayString())}
                    className="px-3.5 h-12 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold rounded-2xl text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 shrink-0"
                  >
                    {isBn ? 'আজ' : 'Today'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {ageData && 'error' in ageData && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ageData.error}</span>
            </div>
          )}

          {/* Age Result Presentation */}
          {ageData && !('error' in ageData) && (
            <>
              {/* Highlight Hero Card */}
              <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CalendarClock className="w-4 h-4" />
                    {isBn ? 'বর্তমান নিখুঁত বয়স:' : 'Exact Age:'}
                  </span>
                  <span className="text-slate-400 font-medium">
                    {isBn ? `জন্মবার: ${ageData.birthDayName}` : `Born on: ${ageData.birthDayName}`}
                  </span>
                </div>

                {/* 3 Pillars: Years, Months, Days */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-3.5 flex flex-col items-center shadow-inner">
                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                      {isBn ? toBnDigits(ageData.years) : ageData.years}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                      {isBn ? 'বছর' : 'Years'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-teal-500/20 rounded-2xl p-3.5 flex flex-col items-center shadow-inner">
                    <span className="text-3xl sm:text-4xl font-extrabold text-teal-400 font-mono">
                      {isBn ? toBnDigits(ageData.months) : ageData.months}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                      {isBn ? 'মাস' : 'Months'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-3.5 flex flex-col items-center shadow-inner">
                    <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">
                      {isBn ? toBnDigits(ageData.days) : ageData.days}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                      {isBn ? 'দিন' : 'Days'}
                    </span>
                  </div>
                </div>

                {/* Next Birthday Notice */}
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Cake className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-amber-200 font-bold block">
                        {isBn ? 'পরবর্তী জন্মদিন:' : 'Next Birthday:'}
                      </span>
                      <span className="text-slate-300 text-[11px]">
                        {isBn
                          ? `আর ${toBnDigits(ageData.nextBdayDays)} দিন বাকি (${ageData.nextBdayDayName})`
                          : `${ageData.nextBdayDays} days remaining (${ageData.nextBdayDayName})`}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-amber-300 font-black text-sm px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40">
                    🎉 {isBn ? `${toBnDigits(ageData.years + 1)}তম` : `${ageData.years + 1}th`}
                  </div>
                </div>

                {/* Zodiac and Astrology Badge */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ageData.zodiac.symbol}</span>
                    <div>
                      <span className="font-bold text-slate-200">
                        {isBn ? ageData.zodiac.nameBn : ageData.zodiac.nameEn}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({isBn ? `উপাদান: ${ageData.zodiac.elementBn}` : `Element: ${ageData.zodiac.elementEn}`})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800">
                    {isBn ? 'রাশিচক্র' : 'Zodiac'}
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'বয়সের পূর্ণাঙ্গ বিবরণ কপি করুন' : 'Copy Age Summary')}</span>
                </button>
              </div>

              {/* Lifetime Statistics & Biological Insights */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'জীবদ্দশার সময় ও জীববৈজ্ঞানিক পরিসংখ্যান:' : 'Lifetime & Biological Milestones:'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{isBn ? 'মোট দিন' : 'Total Days'}</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {isBn ? toBnDigits(ageData.totalDays.toLocaleString()) : ageData.totalDays.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{isBn ? 'মোট সপ্তাহ' : 'Total Weeks'}</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {isBn ? toBnDigits(ageData.totalWeeks.toLocaleString()) : ageData.totalWeeks.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{isBn ? 'মোট ঘণ্টা' : 'Total Hours'}</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {isBn ? toBnDigits(ageData.totalHours.toLocaleString()) : ageData.totalHours.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{isBn ? 'মোট মিনিট' : 'Total Minutes'}</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {isBn ? toBnDigits(ageData.totalMinutes.toLocaleString()) : ageData.totalMinutes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Biological Estimations */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isBn ? 'হৃদস্পন্দন (আনুমানিক)' : 'Heartbeats'}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      ❤️ {isBn ? toBnDigits(ageData.biological.heartbeats.toLocaleString()) : ageData.biological.heartbeats.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isBn ? 'শ্বাস-প্রশ্বাস গ্রহণ' : 'Breaths Taken'}</span>
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                      🫁 {isBn ? toBnDigits(ageData.biological.breaths.toLocaleString()) : ageData.biological.breaths.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{isBn ? 'ঘুমের মোট সময়' : 'Total Sleep'}</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      😴 {isBn ? `${toBnDigits(Math.floor(ageData.biological.sleepHours / 24))} দিন` : `${Math.floor(ageData.biological.sleepHours / 24)} days`}
                    </span>
                  </div>
                </div>

                {/* Solar / Planetary Ages Dropdown / Accordion */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">
                    {isBn ? '🌌 সৌরজগতের বিভিন্ন গ্রহে আপনার বয়স:' : '🌌 Your Age on Other Planets:'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {ageData.planets.map((p) => (
                      <div
                        key={p.planetEn}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                      >
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {isBn ? p.planetBn : p.planetEn}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {isBn ? toBnDigits(p.age) : p.age} {isBn ? 'বছর' : 'yrs'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: BCS & GOVT JOB 32-YEAR ELIGIBILITY ANALYZER
         ======================================================== */}
      {activeTab === 'bcs_job' && (
        <div className="space-y-4">
          {/* Official Rule Notice */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isBn ? 'সরকারি চাকরিতে প্রবেশের বয়সসীমা সংক্রান্ত বাংলাদেশ অধ্যাদেশ ২০২৪' : 'Govt Job Entry Age Limit Ordinance 2024'}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              {isBn
                ? 'বাংলাদেশ সরকারি চাকরি অধ্যাদেশ ২০২৪ অনুযায়ী সাধারণ ও সকল প্রার্থীদের সরকারি চাকুরিতে প্রবেশের সর্বোচ্চ বয়সসীমা ৩২ বছর করা হয়েছে। নির্দিষ্ট বিজ্ঞপ্তির কাট-অফ তারিখে আপনার বয়স ৩২ বছরের মধ্যে রয়েছে কি না তা নিচে যাচাই করুন।'
                : 'Under the Bangladesh Public Service Ordinance 2024, the maximum entry age for general and quota candidates is 32 years. Verify your exact eligibility against circular cut-off dates below.'}
            </p>
          </div>

          {/* Job Inputs Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isBn ? 'আবেদনের ক্যাটাগরি / চাকুরির ধরন নির্বাচন করুন:' : 'Select Candidate / Job Category:'}
              </label>
              <select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {GOVT_JOB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.nameBn : c.nameEn} ({isBn ? c.badgeBn : c.badgeEn})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isBn ? selectedRule.descriptionBn : selectedRule.descriptionEn}
              </p>
            </div>

            {/* Custom Age limits if custom selected */}
            {jobCategory === 'custom' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'সর্বনিম্ন বয়স (বছর)' : 'Min Age (Years)'}
                  </label>
                  <input
                    type="number"
                    value={customMinAge}
                    onChange={(e) => setCustomMinAge(Number(e.target.value))}
                    min={15}
                    max={50}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'সর্বোচ্চ বয়স (বছর)' : 'Max Age (Years)'}
                  </label>
                  <input
                    type="number"
                    value={customMaxAge}
                    onChange={(e) => setCustomMaxAge(Number(e.target.value))}
                    min={18}
                    max={65}
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* DOB & Circular Cutoff Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'প্রার্থীর জন্মতারিখ (DOB)' : 'Candidate Date of Birth'}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'বিজ্ঞপ্তির কাট-অফ তারিখ (Cut-off Date)' : 'Circular Cut-off Date'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={jobCutoffDate}
                    onChange={(e) => setJobCutoffDate(e.target.value)}
                    className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <button
                    onClick={() => setJobCutoffDate(getTodayString())}
                    className="px-3 h-12 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-xs font-bold rounded-2xl text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition active:scale-95"
                  >
                    {isBn ? 'আজ' : 'Today'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets for Cut-off Dates in BD */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">{isBn ? 'কুইক ডেট:' : 'Quick Dates:'}</span>
              <button
                onClick={() => {
                  const now = new Date();
                  setJobCutoffDate(`${now.getFullYear()}-01-01`);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95"
              >
                {isBn ? '১ জানুয়ারি' : 'Jan 1'}
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setJobCutoffDate(`${now.getFullYear()}-07-01`);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95"
              >
                {isBn ? '১ জুলাই' : 'July 1'}
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setJobCutoffDate(`${now.getFullYear() + 1}-01-01`);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95"
              >
                {isBn ? '১ জানুয়ারি আগামী বছর' : 'Jan 1 Next Yr'}
              </button>
            </div>
          </div>

          {/* Job Eligibility Result Card */}
          {jobResult && (
            <div className="space-y-3">
              {/* Verdict Status Banner */}
              <div
                className={`p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white ${
                  jobResult.isEligible
                    ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 border-emerald-500/40'
                    : jobResult.status === 'underage'
                    ? 'bg-gradient-to-r from-amber-800 via-orange-800 to-amber-950 border-amber-500/40'
                    : 'bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 border-rose-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    {jobResult.isEligible ? (
                      <Check className="w-7 h-7 text-emerald-200" />
                    ) : jobResult.status === 'underage' ? (
                      <Hourglass className="w-6 h-6 text-amber-200 animate-spin" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-rose-200" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                      {isBn ? 'আবেদন যোগ্যতা স্ট্যাটাস' : 'Eligibility Status'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black mt-0.5">
                      {jobResult.isEligible
                        ? (isBn ? '✅ আপনি আবেদন করতে পারবেন!' : 'Eligible to Apply!')
                        : jobResult.status === 'underage'
                        ? (isBn ? '⏳ বয়স এখনও পূর্ণ হয়নি (কম বয়স)' : 'Underage Candidate')
                        : (isBn ? '❌ বয়সসীমা অতিক্রম হয়েছে' : 'Age Limit Exceeded')}
                    </h3>
                    <p className="text-xs text-white/80">
                      {isBn
                        ? `কাট-অফ তারিখে বয়স: ${toBnDigits(jobResult.ageAtCutoff.years)} বছর ${toBnDigits(jobResult.ageAtCutoff.months)} মাস ${toBnDigits(jobResult.ageAtCutoff.days)} দিন`
                        : `Age as of cut-off date: ${jobResult.ageAtCutoff.years}y ${jobResult.ageAtCutoff.months}m ${jobResult.ageAtCutoff.days}d`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs block text-white/70">
                    {isBn ? 'বয়সের সর্বোচ্চ সীমা:' : 'Max Age Limit:'}
                  </span>
                  <span className="text-xl font-black font-mono">
                    {isBn ? toBnDigits(jobCategory === 'custom' ? customMaxAge : selectedRule.maxAge) : (jobCategory === 'custom' ? customMaxAge : selectedRule.maxAge)} {isBn ? 'বছর' : 'Years'}
                  </span>
                </div>
              </div>

              {/* Time Remaining or Overage breakdown */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                {jobResult.isEligible && jobResult.timeRemaining && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Hourglass className="w-4 h-4 text-emerald-500" />
                        <span>{isBn ? 'সরকারি চাকুরিতে আবেদনের জন্য আর বাকি আছে:' : 'Time Left to Apply for Govt Jobs:'}</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {isBn ? `${toBnDigits(jobResult.timeRemaining.totalDays)} দিন` : `${jobResult.timeRemaining.totalDays} days`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {isBn ? toBnDigits(jobResult.timeRemaining.years) : jobResult.timeRemaining.years}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'বছর' : 'Years'}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {isBn ? toBnDigits(jobResult.timeRemaining.months) : jobResult.timeRemaining.months}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'মাস' : 'Months'}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {isBn ? toBnDigits(jobResult.timeRemaining.days) : jobResult.timeRemaining.days}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                          {isBn ? 'দিন' : 'Days'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {jobResult.status === 'overage' && jobResult.timeOverage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold block">
                        {isBn ? 'বয়স অতিক্রমের সময়কাল:' : 'Age Exceeded by:'}
                      </span>
                      <span className="text-[11px]">
                        {isBn
                          ? `${toBnDigits(jobResult.timeOverage.years)} বছর ${toBnDigits(jobResult.timeOverage.months)} মাস ${toBnDigits(jobResult.timeOverage.days)} দিন পূর্বে সীমা শেষ হয়েছে`
                          : `Expired ${jobResult.timeOverage.years}y ${jobResult.timeOverage.months}m ${jobResult.timeOverage.days}d ago`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {isBn ? `+${toBnDigits(jobResult.timeOverage.totalDays)} দিন` : `+${jobResult.timeOverage.totalDays}d`}
                    </span>
                  </div>
                )}

                {/* Expiry Date Card */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      {isBn ? 'বয়সসীমা (৩২ বছর) শেষ হওয়ার সুনির্দিষ্ট তারিখ:' : 'Exact Expiration Date (32 Years):'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {jobResult.expiryDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {isBn ? 'কাট-অফ লিমিট' : 'Cut-off limit'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: DATE DIFFERENCE & BD WORKING DAYS
         ======================================================== */}
      {activeTab === 'diff_work' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'শুরুর তারিখ (Start Date)' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'শেষের তারিখ (End Date)' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Weekend options */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold">{isBn ? 'ছুটির দিন:' : 'Weekend:'}</span>
                <button
                  onClick={() => setWeekendRule('bd_fri_sat')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    weekendRule === 'bd_fri_sat'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isBn ? 'শুক্রবার ও শনিবার (বাংলাদেশ)' : 'Fri & Sat (BD Govt/Bank)'}
                </button>
                <button
                  onClick={() => setWeekendRule('intl_sat_sun')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    weekendRule === 'intl_sat_sun'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isBn ? 'শনিবার ও রবিবার (আন্তর্জাতিক)' : 'Sat & Sun (Intl)'}
                </button>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeEndDate}
                  onChange={(e) => setIncludeEndDate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-semibold">{isBn ? 'শেষ দিন অন্তর্ভুক্ত' : 'Include end day'}</span>
              </label>
            </div>
          </div>

          {/* Results Display */}
          {workingDaysResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>{isBn ? 'তারিখের পার্থক্য ও অফিস কর্মদিবস:' : 'Date Breakdown & Working Days:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {isBn ? `${toBnDigits(workingDaysResult.totalDays)} দিন` : `${workingDaysResult.totalDays} Total Days`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    💼 {isBn ? 'প্রকৃত কর্মদিবস' : 'Official Working Days'}
                  </span>
                  <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {isBn ? toBnDigits(workingDaysResult.workingDays) : workingDaysResult.workingDays}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    {Math.round((workingDaysResult.workingDays / workingDaysResult.totalDays) * 100)}% {isBn ? 'কাজের দিন' : 'of total'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col items-center">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                    🌴 {isBn ? 'সাপ্তাহিক ছুটির দিন' : 'Weekend Off Days'}
                  </span>
                  <span className="text-3xl font-black text-rose-700 dark:text-rose-300 font-mono">
                    {isBn ? toBnDigits(workingDaysResult.weekendDays) : workingDaysResult.weekendDays}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                    {Math.round((workingDaysResult.weekendDays / workingDaysResult.totalDays) * 100)}% {isBn ? 'ছুটি' : 'of total'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: GOVT RETIREMENT & PRL COUNTDOWN (59 / 60 YRS)
         ======================================================== */}
      {activeTab === 'retirement' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Hourglass className="w-4 h-4 text-indigo-600" />
              <span>{isBn ? 'বাংলাদেশ সরকারি পেনশন ও পিআরএল (PRL) নিয়মাবলী:' : 'Bangladesh Govt Pension & PRL Rules:'}</span>
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              {isBn
                ? 'সরকারি চাকরি আইন অনুযায়ী সাধারণ সরকারি চাকরিজীবীদের অবসরের বয়স ৫৯ বছর এবং বীর মুক্তিযোদ্ধাদের ক্ষেত্রে ৬০ বছর। ৫৯ বা ৬০ বছর পূর্ণ হওয়ার দিনে পিআরএল (Post Retirement Leave) শুরু হয়।'
                : 'Under Bangladesh Public Service rules, retirement age for general employees is 59 years, and 60 years for Freedom Fighters. PRL starts on the exact 59th or 60th birthday.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'চাকরিজীবীর জন্মতারিখ (DOB)' : 'Employee Date of Birth'}
                </label>
                <input
                  type="date"
                  value={retireDob}
                  onChange={(e) => setRetireDob(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'অবসরের বয়সসীমা' : 'Retirement Age Limit'}
                </label>
                <select
                  value={retireAge}
                  onChange={(e) => setRetireAge(Number(e.target.value))}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value={59}>{isBn ? '৫৯ বছর (সাধারণ সরকারি চাকরিজীবী)' : '59 Years (General Govt Employee)'}</option>
                  <option value={60}>{isBn ? '৬০ বছর (বীর মুক্তিযোদ্ধা চাকরিজীবী)' : '60 Years (Freedom Fighter)'}</option>
                  <option value={65}>{isBn ? '৬৫ বছর (পাবলিক বিশ্ববিদ্যালয় শিক্ষক)' : '65 Years (Public University Professor)'}</option>
                  <option value={67}>{isBn ? '৬৭ বছর (সুপ্রিম কোর্টের বিচারক)' : '67 Years (Supreme Court Judge)'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Retirement Result Display */}
          {retirementResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">
                    {isBn ? 'পিআরএল (PRL) শুরুর তারিখ:' : 'PRL Start Date:'}
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {retirementResult.prlDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-bold block">
                    {isBn ? 'চূড়ান্ত অবসর ও পূর্ণ পেনশন:' : 'Final Pension Date:'}
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {retirementResult.finalPensionDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Countdown to PRL */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <span className="text-xs text-slate-400 block font-bold">
                  {retirementResult.hasRetired
                    ? (isBn ? 'অবসর সম্পন্ন হয়েছে:' : 'Already Retired:')
                    : (isBn ? 'পিআরএল / অবসরে যাওয়ার আর বাকি রয়েছে:' : 'Time Left Until Retirement:')}
                </span>

                {retirementResult.timeToPrl && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {isBn ? toBnDigits(retirementResult.timeToPrl.years) : retirementResult.timeToPrl.years}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{isBn ? 'বছর' : 'Years'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-2xl font-black text-teal-400 font-mono">
                        {isBn ? toBnDigits(retirementResult.timeToPrl.months) : retirementResult.timeToPrl.months}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{isBn ? 'মাস' : 'Months'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-2xl font-black text-cyan-400 font-mono">
                        {isBn ? toBnDigits(retirementResult.timeToPrl.days) : retirementResult.timeToPrl.days}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{isBn ? 'দিন' : 'Days'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
