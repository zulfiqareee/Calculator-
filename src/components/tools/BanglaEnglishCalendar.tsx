import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Bookmark,
  Plus,
  Trash2,
  Share2,
  Clock,
  MapPin,
  Check,
  Info,
  Calendar,
  X,
} from 'lucide-react';
import { Language } from '../../types';

interface Props {
  lang: Language;
}

interface CalendarEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  time?: string;
  note?: string;
  createdAt: number;
}

interface HolidayInfo {
  nameBn: string;
  nameEn: string;
  type: 'national' | 'religious' | 'optional';
  religion?: 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'national';
}

// Convert English numbers to Bengali digits
export function toBnDigits(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

// Check leap year
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Calculate Bangladeshi revised Bengali Calendar date
export function getBanglaDate(date: Date): {
  day: number;
  monthNameBn: string;
  monthNameEn: string;
  year: number;
  seasonBn: string;
  seasonEn: string;
} {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-indexed
  const gDay = date.getDate();

  // Day of year
  const startOfYear = new Date(gYear, 0, 1);
  const diffMs = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  // Leap year check
  const isLeap = isLeapYear(gYear);
  // Boishakh 1 is usually April 14
  // In non-leap year: Jan(31) + Feb(28) + Mar(31) + 14 = 104th day
  // In leap year: 105th day
  const boishakhStartDay = isLeap ? 105 : 104;

  const monthNamesBn = [
    'বৈশাখ',
    'জ্যৈষ্ঠ',
    'আষাঢ়',
    'শ্রাবণ',
    'ভাদ্র',
    'আশ্বিন',
    'কার্তিক',
    'অগ্রহায়ণ',
    'পৌষ',
    'মাঘ',
    'ফাল্গুন',
    'চৈত্র',
  ];

  const monthNamesEn = [
    'Boishakh',
    'Jaishtha',
    'Asharh',
    'Shrabon',
    'Bhadro',
    'Ashwin',
    'Kartik',
    'Agrahayan',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ];

  const seasons = [
    { bn: 'গ্রীষ্মকাল', en: 'Summer' },
    { bn: 'গ্রীষ্মকাল', en: 'Summer' },
    { bn: 'বর্ষাকাল', en: 'Monsoon' },
    { bn: 'বর্ষাকাল', en: 'Monsoon' },
    { bn: 'শরৎকাল', en: 'Autumn' },
    { bn: 'শরৎকাল', en: 'Autumn' },
    { bn: 'হেমন্তকাল', en: 'Late Autumn' },
    { bn: 'হেমন্তকাল', en: 'Late Autumn' },
    { bn: 'শীতকাল', en: 'Winter' },
    { bn: 'শীতকাল', en: 'Winter' },
    { bn: 'বসন্তকাল', en: 'Spring' },
    { bn: 'বসন্তকাল', en: 'Spring' },
  ];

  // Month lengths according to Bangladesh revised calendar:
  // First 6 months (Boishakh - Ashwin): 31 days each
  // Next 4 months (Kartik - Magh): 30 days each
  // Falgun: 29 days (30 in leap year)
  // Chaitra: 30 days
  const bMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap ? 30 : 29, 30];

  let bYear = gYear - 593;
  let remainingDays = 0;

  if (dayOfYear >= boishakhStartDay) {
    // New Bangla year started
    remainingDays = dayOfYear - boishakhStartDay;
  } else {
    // Previous Bangla year
    bYear -= 1;
    const prevYearLeap = isLeapYear(gYear - 1);
    const prevYearDays = prevYearLeap ? 366 : 365;
    const prevBoishakhStart = prevYearLeap ? 105 : 104;
    remainingDays = prevYearDays - prevBoishakhStart + dayOfYear;
  }

  let bMonthIndex = 0;
  for (let i = 0; i < 12; i++) {
    if (remainingDays < bMonthDays[i]) {
      bMonthIndex = i;
      break;
    }
    remainingDays -= bMonthDays[i];
  }

  const bDay = remainingDays + 1;

  return {
    day: bDay,
    monthNameBn: monthNamesBn[bMonthIndex],
    monthNameEn: monthNamesEn[bMonthIndex],
    year: bYear,
    seasonBn: seasons[bMonthIndex].bn,
    seasonEn: seasons[bMonthIndex].en,
  };
}

// Approximate Hijri Islamic Date calculation
export function getHijriDate(date: Date): {
  day: number;
  monthNameBn: string;
  monthNameEn: string;
  year: number;
} {
  const hijriMonthsBn = [
    'মুহাররম',
    'সফর',
    'রবিউল আউয়াল',
    'রবিউস সানি',
    'জমাদিউল আউয়াল',
    'জমাদিউস সানি',
    'রজব',
    'শাবান',
    'রমজান',
    'শাওয়াল',
    'জিলকদ',
    'জিলহজ্ব',
  ];

  const hijriMonthsEn = [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ];

  // Julian day number calculation
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  let jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d -
    32075;

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  let mIslamic = Math.floor((24 * l) / 709);
  let dIslamic = l - Math.floor((709 * mIslamic) / 24);
  let yIslamic = 30 * n + j - 30;

  // Bound index
  const safeMonthIdx = Math.max(0, Math.min(11, mIslamic - 1));

  return {
    day: dIslamic,
    monthNameBn: hijriMonthsBn[safeMonthIdx],
    monthNameEn: hijriMonthsEn[safeMonthIdx],
    year: yIslamic,
  };
}

// Bangladesh Public Holidays Database
const FIXED_HOLIDAYS: Record<string, HolidayInfo> = {
  '02-21': {
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & International Mother Language Day',
    type: 'national',
    religion: 'national',
  },
  '03-17': {
    nameBn: 'জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের জন্মদিবস ও জাতীয় শিশু দিবস',
    nameEn: "Father of the Nation Bangabandhu's Birthday & Children's Day",
    type: 'national',
    religion: 'national',
  },
  '03-26': {
    nameBn: 'স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    type: 'national',
    religion: 'national',
  },
  '04-14': {
    nameBn: 'পহেলা বৈশাখ (বাংলা নববর্ষ)',
    nameEn: 'Bengali New Year (Pohela Boishakh)',
    type: 'national',
    religion: 'national',
  },
  '05-01': {
    nameBn: 'মহান মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)',
    nameEn: 'May Day (International Workers’ Day)',
    type: 'national',
    religion: 'national',
  },
  '08-15': {
    nameBn: 'জাতীয় শোক দিবস',
    nameEn: 'National Mourning Day',
    type: 'national',
    religion: 'national',
  },
  '12-16': {
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day',
    type: 'national',
    religion: 'national',
  },
  '12-25': {
    nameBn: 'যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
    nameEn: 'Christmas Day',
    type: 'religious',
    religion: 'christian',
  },
};

// Variable Islamic, Hindu & Buddhist Holidays (Sample for 2024, 2025, 2026, 2027)
const VARIABLE_HOLIDAYS: Record<string, HolidayInfo> = {
  // 2026
  '2026-02-04': { nameBn: 'পবিত্র শবে বরাত', nameEn: 'Shab-e-Barat', type: 'religious', religion: 'muslim' },
  '2026-03-16': { nameBn: 'পবিত্র শবে কদর', nameEn: 'Shab-e-Qadr', type: 'religious', religion: 'muslim' },
  '2026-03-20': { nameBn: 'পবিত্র ঈদুল ফিতর', nameEn: 'Eid-ul-Fitr', type: 'religious', religion: 'muslim' },
  '2026-03-21': { nameBn: 'ঈদুল ফিতর (২য় দিন)', nameEn: 'Eid-ul-Fitr (Day 2)', type: 'religious', religion: 'muslim' },
  '2026-03-22': { nameBn: 'ঈদুল ফিতর (৩য় দিন)', nameEn: 'Eid-ul-Fitr (Day 3)', type: 'religious', religion: 'muslim' },
  '2026-05-31': { nameBn: 'বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)', nameEn: 'Buddha Purnima', type: 'religious', religion: 'buddhist' },
  '2026-05-27': { nameBn: 'পবিত্র ঈদুল আযহা', nameEn: 'Eid-ul-Adha', type: 'religious', religion: 'muslim' },
  '2026-05-28': { nameBn: 'ঈদুল আযহা (২য় দিন)', nameEn: 'Eid-ul-Adha (Day 2)', type: 'religious', religion: 'muslim' },
  '2026-05-29': { nameBn: 'ঈদুল আযহা (৩য় দিন)', nameEn: 'Eid-ul-Adha (Day 3)', type: 'religious', religion: 'muslim' },
  '2026-06-26': { nameBn: 'পবিত্র আশুরা (১০ই মহররম)', nameEn: 'Ashura', type: 'religious', religion: 'muslim' },
  '2026-08-25': { nameBn: 'শুভ জন্মাষ্টমী', nameEn: 'Janmashtami', type: 'religious', religion: 'hindu' },
  '2026-08-26': { nameBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)', nameEn: 'Eid-e-Miladunnabi', type: 'religious', religion: 'muslim' },
  '2026-10-20': { nameBn: 'শারদীয় দুর্গাপূজা (বিজয়া দশমী)', nameEn: 'Durga Puja (Bijoya Dashami)', type: 'religious', religion: 'hindu' },
  // 2025
  '2025-03-31': { nameBn: 'পবিত্র ঈদুল ফিতর', nameEn: 'Eid-ul-Fitr', type: 'religious', religion: 'muslim' },
  '2025-06-07': { nameBn: 'পবিত্র ঈদুল আযহা', nameEn: 'Eid-ul-Adha', type: 'religious', religion: 'muslim' },
  '2025-10-02': { nameBn: 'শারদীয় দুর্গাপূজা (বিজয়া দশমী)', nameEn: 'Durga Puja', type: 'religious', religion: 'hindu' },
};

function getHoliday(date: Date): HolidayInfo | null {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  const fullKey = `${y}-${m}-${d}`;
  if (VARIABLE_HOLIDAYS[fullKey]) {
    return VARIABLE_HOLIDAYS[fullKey];
  }

  const mmDdKey = `${m}-${d}`;
  if (FIXED_HOLIDAYS[mmDdKey]) {
    return FIXED_HOLIDAYS[mmDdKey];
  }

  return null;
}

export const BanglaEnglishCalendar: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';

  // Current viewed month & year
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Selected date for details
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Digit format toggle
  const [useBnDigits, setUseBnDigits] = useState<boolean>(true);
  // Active Tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'holidays' | 'events'>('calendar');

  // Events from LocalStorage
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem('smarthub_calendar_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal / Add event state
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('');
  const [eventNote, setEventNote] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month (0: Sunday, 1: Monday, ... 6: Saturday)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Previous month total days for padding
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const newEvent: CalendarEvent = {
      id: `evt_${Date.now()}`,
      dateKey,
      title: eventTitle.trim(),
      time: eventTime.trim() || undefined,
      note: eventNote.trim() || undefined,
      createdAt: Date.now(),
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    try {
      localStorage.setItem('smarthub_calendar_events', JSON.stringify(updated));
    } catch (err) {}

    setEventTitle('');
    setEventTime('');
    setEventNote('');
    setShowAddEventModal(false);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    setEvents(updated);
    try {
      localStorage.setItem('smarthub_calendar_events', JSON.stringify(updated));
    } catch (err) {}
  };

  // English month names
  const enMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const bnMonthNames = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];

  // Weekday names
  const weekdaysBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current viewed month details
  const currentMonthName = isBn ? bnMonthNames[month] : enMonthNames[month];
  const currentMonthYearStr = useBnDigits ? toBnDigits(year) : String(year);

  // Selected date Bangla and Hijri info
  const selectedBangla = getBanglaDate(selectedDate);
  const selectedHijri = getHijriDate(selectedDate);
  const selectedHoliday = getHoliday(selectedDate);

  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDateEvents = events.filter((ev) => ev.dateKey === selectedDateKey);

  // Helper formatting for digits
  const formatDigit = (val: number | string) => {
    return useBnDigits ? toBnDigits(val) : String(val);
  };

  const isToday = (d: number) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (d: number) => {
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isBn ? 'বাংলা, ইংরেজি ও হিজরি ক্যালেন্ডার' : 'Tri-Calendar System'}
            </span>
            <button
              onClick={() => setUseBnDigits(!useBnDigits)}
              className="text-xs bg-black/25 hover:bg-black/35 px-3 py-1 rounded-full font-bold transition flex items-center gap-1"
            >
              <span>{useBnDigits ? 'বাংলা সংখ্যা (১, ২)' : 'English (1, 2)'}</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {currentMonthName} {currentMonthYearStr}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-amber-100 font-medium">
                <span>
                  {isBn ? 'বঙ্গাব্দ:' : 'Bangla:'} {selectedBangla.monthNameBn} {formatDigit(selectedBangla.year)}
                </span>
                <span>•</span>
                <span>{selectedBangla.seasonBn}</span>
                <span>•</span>
                <span>
                  {isBn ? 'হিজরি:' : 'Hijri:'} {selectedHijri.monthNameBn} {formatDigit(selectedHijri.year)}
                </span>
              </div>
            </div>

            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl bg-white text-orange-700 hover:bg-amber-50 text-xs font-bold shadow-md transition shrink-0"
            >
              {isBn ? 'আজকের দিন' : 'Today'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector: Calendar, Holidays, Events */}
      <div className="flex items-center bg-slate-200/70 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{isBn ? 'মাসিক ক্যালেন্ডার' : 'Calendar'}</span>
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'holidays'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>{isBn ? 'সরকারি ছুটির তালিকা' : 'Holidays'}</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'events'
              ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{isBn ? 'আমার ইভেন্ট ও নোট' : 'My Events'} ({events.length})</span>
        </button>
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="flex flex-col gap-4">
          {/* Month Navigation & Month Year Controls */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {currentMonthName} {currentMonthYearStr}
                </span>
                <span className="block text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                  {getBanglaDate(new Date(year, month, 1)).monthNameBn} - {getBanglaDate(new Date(year, month, daysInMonth)).monthNameBn}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs py-1">
              {(isBn ? weekdaysBn : weekdaysEn).map((day, i) => (
                <div
                  key={day}
                  className={`py-1 text-xs ${
                    i === 5 ? 'text-red-500 font-black' : i === 6 ? 'text-blue-500 font-black' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Previous Month Padding */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
                const dayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="p-1 sm:p-2 h-14 sm:h-16 rounded-xl border border-transparent text-slate-300 dark:text-slate-700 flex flex-col justify-between opacity-50"
                  >
                    <span className="text-[11px] font-semibold">{formatDigit(dayNum)}</span>
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(year, month, dayNum);
                const bDate = getBanglaDate(cellDate);
                const holiday = getHoliday(cellDate);
                const isFri = cellDate.getDay() === 5;
                const isSat = cellDate.getDay() === 6;
                const today = isToday(dayNum);
                const selected = isSelected(dayNum);

                const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasEvent = events.some((e) => e.dateKey === cellDateKey);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedDate(cellDate)}
                    className={`p-1 sm:p-1.5 h-14 sm:h-16 rounded-2xl border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                      selected
                        ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-500/30 shadow-md scale-102 z-10'
                        : today
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-400 text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:border-orange-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Top Row: English Day & Event Dot */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          selected
                            ? 'text-white'
                            : isFri
                            ? 'text-red-500'
                            : isSat
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatDigit(dayNum)}
                      </span>

                      <div className="flex items-center gap-0.5">
                        {holiday && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              selected ? 'bg-white' : 'bg-red-500'
                            }`}
                            title={holiday.nameBn}
                          />
                        )}
                        {hasEvent && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              selected ? 'bg-amber-200' : 'bg-emerald-500'
                            }`}
                            title="ইভেন্ট সংরক্ষিত"
                          />
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Bangla Day & Hijri Day */}
                    <div className="flex items-baseline justify-between w-full text-[9px] sm:text-[10px]">
                      <span
                        className={`${
                          selected ? 'text-orange-100 font-semibold' : 'text-orange-600 dark:text-orange-400 font-medium'
                        }`}
                      >
                        {formatDigit(bDate.day)} {bDate.monthNameBn.slice(0, 3)}
                      </span>
                    </div>

                    {/* Today Badge Indicator */}
                    {today && !selected && (
                      <span className="absolute bottom-0.5 right-1 text-[8px] font-black text-orange-500">
                        •
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detailed Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                  {isBn ? 'নির্বাচিত তারিখের বিস্তারিত' : 'Selected Date Details'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {formatDigit(selectedDate.getDate())}{' '}
                  {isBn ? bnMonthNames[selectedDate.getMonth()] : enMonthNames[selectedDate.getMonth()]}{' '}
                  {formatDigit(selectedDate.getFullYear())},{' '}
                  {isBn ? weekdaysBn[selectedDate.getDay()] : weekdaysEn[selectedDate.getDay()]}বার
                </h3>
              </div>

              <button
                onClick={() => setShowAddEventModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? 'নোট / ইভেন্ট' : 'Add Note'}</span>
              </button>
            </div>

            {/* Tri-Calendar Conversions Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Bangla Date Box */}
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 block">
                    {isBn ? 'বাংলা বঙ্গাব্দ ও ঋতু' : 'Bangla Bongabdo'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {formatDigit(selectedBangla.day)} {selectedBangla.monthNameBn} {formatDigit(selectedBangla.year)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedBangla.seasonBn} ({selectedBangla.seasonEn})
                  </span>
                </div>
              </div>

              {/* Hijri Date Box */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                    {isBn ? 'আরবি হিজরি সন' : 'Islamic Hijri'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {formatDigit(selectedHijri.day)} {selectedHijri.monthNameBn} {formatDigit(selectedHijri.year)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    চাঁদ দেখার ওপর নির্ভরশীল
                  </span>
                </div>
              </div>
            </div>

            {/* Holiday Notice if present */}
            {selectedHoliday && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500 text-white shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                    {isBn ? 'সরকারি বা উৎসবের ছুটি' : 'Public / Festive Holiday'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {isBn ? selectedHoliday.nameBn : selectedHoliday.nameEn}
                  </span>
                </div>
              </div>
            )}

            {/* Saved Events for Selected Date */}
            {selectedDateEvents.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'আজকের সংরক্ষিত কাজ ও নোট:' : 'Saved Events for this Date:'}
                </span>
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                      {ev.time && <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{ev.time}</span>}
                      {ev.note && <p className="text-slate-600 dark:text-slate-300 mt-1">{ev.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL PUBLIC HOLIDAYS LIST */}
      {activeTab === 'holidays' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isBn ? 'বাংলাদেশের সরকারি ছুটির তালিকা' : 'Bangladesh Public Holidays'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isBn ? 'জাতীয় দিবস ও প্রধান ধর্মীয় উৎসবের ছুটির পূর্ণ তালিকা' : 'Official national and religious holidays'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {isBn ? 'জাতীয় স্থায়ী ছুটির দিনসমূহ' : 'Fixed National Holidays'}
            </h4>
            {Object.entries(FIXED_HOLIDAYS).map(([mmDd, hol]) => {
              const [m, d] = mmDd.split('-');
              const monthName = isBn ? bnMonthNames[parseInt(m, 10) - 1] : enMonthNames[parseInt(m, 10) - 1];
              return (
                <div
                  key={mmDd}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-xs shrink-0">
                      {formatDigit(parseInt(d, 10))} {monthName.slice(0, 3)}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{isBn ? hol.nameBn : hol.nameEn}</h5>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">জাতীয় ছুটি</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold shrink-0">
                    ছুটি
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isBn ? 'ধর্মীয় ও চাঁদ নির্ভর ছুটির দিনসমূহ' : 'Religious & Lunar Holidays'}
            </h4>
            {Object.entries(VARIABLE_HOLIDAYS).map(([dateStr, hol]) => (
              <div
                key={dateStr}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs shrink-0">
                    {dateStr}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{isBn ? hol.nameBn : hol.nameEn}</h5>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hol.religion === 'muslim'
                        ? 'ইসলামিক ছুটি'
                        : hol.religion === 'hindu'
                        ? 'হিন্দু ধর্মীয় উৎসব'
                        : 'বৌদ্ধ ধর্মীয় উৎসব'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  উৎসব
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER EVENTS & NOTES */}
      {activeTab === 'events' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBn ? 'আমার সংরক্ষিত ইভেন্ট ও রিমাইন্ডার' : 'My Calendar Notes'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBn ? 'গুরুত্বপূর্ণ তারিখ, মিটিং ও পারিবারিক অনুষ্ঠান' : 'Personal reminders and dates'}
              </p>
            </div>
            <button
              onClick={() => setShowAddEventModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? 'নতুন যোগ' : 'Add'}</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>{isBn ? 'কোনো ইভেন্ট বা নোট সংরক্ষিত নেই। যেকোনো তারিখে ক্লিক করে নোট যুক্ত করুন।' : 'No calendar events saved yet.'}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block mb-0.5">
                      📅 {ev.dateKey} {ev.time ? `• ${ev.time}` : ''}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                    {ev.note && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{ev.note}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-orange-500" />
                <span>{isBn ? 'ইভেন্ট বা নোট যুক্ত করুন' : 'Add Date Note'}</span>
              </h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'তারিখ' : 'Date'}
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                  {selectedDate.toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'শিরোনাম / উদ্দেশ্য *' : 'Event Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="যেমন: বিদ্যুৎ বিল পরিশোধ, জন্মদিনের অনুষ্ঠান..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'সময় (ঐচ্ছিক)' : 'Time (Optional)'}
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isBn ? 'বিস্তারিত নোট (ঐচ্ছিক)' : 'Note Description'}
                </label>
                <textarea
                  rows={3}
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  placeholder="যেকোনো অতিরিক্ত তথ্য বা চেকলিস্ট..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
