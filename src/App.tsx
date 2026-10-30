import { App as CapApp } from '@capacitor/app';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Calculator,
  Zap,
  Percent,
  ArrowRightLeft,
  CalendarClock,
  Cpu,
  CalendarRange,
  Search,
  Heart,
  Clock,
  Moon,
  Sun,
  ArrowLeft,
  Home,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  ChevronRight,
  WifiOff,
  Sliders,
  DollarSign,
  Plug,
  BookOpen,
  Bookmark,
  FileText,
  Mail,
  Lock,
  BatteryCharging,
  CloudSun,
  Compass,
  MapPin,
  Newspaper,
  HeartPulse,
  Bell,
  BellRing,
} from 'lucide-react';
import { Language, ThemeMode, ToolCategory, ToolId, ToolItem, CustomTool } from './types';
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredTheme,
  setStoredTheme,
  getStoredFavorites,
  setStoredFavorites,
  getStoredRecents,
  addStoredRecent,
} from './utils/storage';
import { getStoredCustomTools } from './utils/customToolsStorage';
import { AUTHORIZED_ADMIN_EMAIL } from './utils/adminAuth';
import { TOOLS_LIST, UI_TEXT, formatNumber } from './i18n/translations';
import {
  AlarmItem,
  subscribeToAlarmTrigger,
  checkAndTriggerDueAlarms,
} from './utils/alarmStorage';
import { AlarmRingingOverlay } from './components/tools/AlarmRingingOverlay';

// Standard Tools
import { BasicCalculator } from './components/tools/BasicCalculator';
import { ElectricityBillEstimator } from './components/tools/ElectricityBillEstimator';
import { AgeCalculator } from './components/tools/AgeCalculator';
import { DateDifferenceCalculator } from './components/tools/DateDifferenceCalculator';
import { CustomToolRunner } from './components/tools/CustomToolRunner';
import { LoanEmiCalculator } from './components/tools/LoanEmiCalculator';
import { LandMeasurementCalculator } from './components/tools/LandMeasurementCalculator';
import { BmiCalorieCalculator } from './components/tools/BmiCalorieCalculator';
import { LiveWeatherView } from './components/tools/LiveWeatherView';
import { PrayerTimesView } from './components/tools/PrayerTimesView';
import { CompactHomeWeatherWidget } from './components/tools/CompactHomeWeatherWidget';
import { HealthTipsView } from './components/tools/HealthTipsView';
import { QuranPdfReader } from './components/tools/QuranPdfReader';
import { SmartAlarmClock } from './components/tools/SmartAlarmClock';

// Hero Banner & Views
import { AdminPanel } from './components/admin/AdminPanel';
import { BookReaderView } from './components/books/BookReaderView';
import { NotepadView } from './components/notes/NotepadView';
import { AdMobBanner } from './components/admob/AdMobBanner';
import { AdMobManager } from './components/admob/AdMobManager';
import { HistoryView } from './components/HistoryView';
import { AboutPolicy } from './components/AboutPolicy';

type BottomTab = 'home' | 'favorites' | 'recents' | 'settings';
type SpecialView = 'none' | 'books' | 'notes';

export default function App() {
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);
  const [specialView, setSpecialView] = useState<SpecialView>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites());
  const [recents, setRecents] = useState<string[]>(getStoredRecents());
  const [customTools, setCustomTools] = useState<CustomTool[]>(getStoredCustomTools());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'admin' | 'admob' | 'about'>('main');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Android Hardware Back Button & Browser Back Gestures Handling
  const [exitToastVisible, setExitToastVisible] = useState<boolean>(false);
  const lastBackPressRef = React.useRef<number>(0);

  // Global Alarm State & Monitor across all screens and tabs
  const [globalRingingAlarm, setGlobalRingingAlarm] = useState<AlarmItem | null>(null);

  React.useEffect(() => {
    // 1. Subscribe to active ringing alarm changes
    const unsubscribe = subscribeToAlarmTrigger((alarm) => {
      setGlobalRingingAlarm(alarm);
    });

    // 2. Check due alarms every second
    const timer = setInterval(() => {
      checkAndTriggerDueAlarms();
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const activeToolIdRef = React.useRef(activeToolId);
  const specialViewRef = React.useRef(specialView);
  const isDrawerOpenRef = React.useRef(isDrawerOpen);
  const settingsSubViewRef = React.useRef(settingsSubView);
  const activeTabRef = React.useRef(activeTab);

  React.useEffect(() => { activeToolIdRef.current = activeToolId; }, [activeToolId]);
  React.useEffect(() => { specialViewRef.current = specialView; }, [specialView]);
  React.useEffect(() => { isDrawerOpenRef.current = isDrawerOpen; }, [isDrawerOpen]);
  React.useEffect(() => { settingsSubViewRef.current = settingsSubView; }, [settingsSubView]);
  React.useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const handleAppBack = React.useCallback(() => {
    // 1. If Drawer is open, close it
    if (isDrawerOpenRef.current) {
      setIsDrawerOpen(false);
      return;
    }

    // 2. If an active tool is open, close it and return to home
    if (activeToolIdRef.current) {
      setActiveToolId(null);
      return;
    }

    // 3. If in Special View (Books Reader or Notepad), close it
    if (specialViewRef.current !== 'none') {
      setSpecialView('none');
      return;
    }

    // 4. If in Settings subview (Admin, AdMob, About), return to main settings
    if (activeTabRef.current === 'settings' && settingsSubViewRef.current !== 'main') {
      setSettingsSubView('main');
      return;
    }

    // 5. If on another tab (Favorites, Recents, Settings), return to home tab
    if (activeTabRef.current !== 'home') {
      setActiveTab('home');
      return;
    }

    // 6. Already on Home tab: double back press to safely exit (prevents accidental exit)
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      try {
        CapApp.exitApp();
      } catch {
        // browser fallback
      }
    } else {
      lastBackPressRef.current = now;
      setExitToastVisible(true);
      setTimeout(() => {
        setExitToastVisible(false);
      }, 2000);
    }
  }, []);

  // Listen for Capacitor native Android hardware back button
  React.useEffect(() => {
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        handleAppBack();
      }).then((handle) => {
        listenerHandle = handle;
      });
    } catch (e) {}

    return () => {
      if (listenerHandle && listenerHandle.remove) {
        listenerHandle.remove();
      }
    };
  }, [handleAppBack]);

  // Listen for Web / Mobile Browser popstate events
  React.useEffect(() => {
    window.history.replaceState({ page: 'root' }, '');
    window.history.pushState({ page: 'app' }, '');

    const handlePop = () => {
      window.history.pushState({ page: 'app' }, '');
      handleAppBack();
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [handleAppBack]);

  const t = UI_TEXT[lang];

  // Refresh custom tools
  const refreshCustomTools = () => {
    setCustomTools(getStoredCustomTools());
  };

  // Sync HTML language attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Combined built-in tools + dynamic custom tools
  const allTools: ToolItem[] = useMemo(() => {
    const mappedCustom: ToolItem[] = customTools.map((ct) => ({
      id: ct.id,
      category: ct.category,
      titleEn: ct.titleEn,
      titleBn: ct.titleBn,
      descEn: ct.descEn,
      descBn: ct.descBn,
      badgeEn: ct.badgeEn,
      badgeBn: ct.badgeBn,
      iconName: ct.iconName,
      gradient: ct.gradient,
      accentColor: 'text-amber-500',
      isCustom: true,
    }));
    return [...TOOLS_LIST, ...mappedCustom];
  }, [customTools]);

  const switchLanguage = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  const toggleFavorite = (toolId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (favorites.includes(toolId)) {
      updated = favorites.filter((id) => id !== toolId);
    } else {
      updated = [...favorites, toolId];
    }
    setFavorites(updated);
    setStoredFavorites(updated);
  };

  const openTool = (id: ToolId) => {
    setActiveToolId(id);
    setSpecialView('none');
    addStoredRecent(id);
    setRecents(getStoredRecents());
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeTool = () => {
    setActiveToolId(null);
  };

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    if (searchQuery.trim() === '') return allTools;
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter((tool) => {
      const matchTitle =
        tool.titleEn.toLowerCase().includes(q) || tool.titleBn.toLowerCase().includes(q);
      const matchDesc =
        tool.descEn.toLowerCase().includes(q) || tool.descBn.toLowerCase().includes(q);
      const matchBadge =
        tool.badgeEn.toLowerCase().includes(q) || tool.badgeBn.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchBadge;
    });
  }, [allTools, searchQuery]);

  // Favorite tools
  const favoriteTools = useMemo(() => {
    return allTools.filter((tool) => favorites.includes(tool.id));
  }, [allTools, favorites]);

  // Icon Resolver
  const renderToolIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Percent':
        return <Percent className={className} />;
      case 'ArrowRightLeft':
        return <ArrowRightLeft className={className} />;
      case 'CalendarClock':
        return <CalendarClock className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Plug':
        return <Plug className={className} />;
      case 'CalendarRange':
        return <CalendarRange className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'BatteryCharging':
        return <BatteryCharging className={className} />;
      case 'CloudSun':
        return <CloudSun className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'HeartPulse':
        return <HeartPulse className={className} />;
      case 'Bell':
        return <Bell className={className} />;
      case 'Newspaper':
        return <Newspaper className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Format 2-line title in Bengali
  const renderTitleFormatted = (title: string) => {
    const parts = title.split(' ');
    if (parts.length >= 2) {
      return (
        <span className="flex flex-col leading-tight">
          <span>{parts[0]}</span>
          <span>{parts.slice(1).join(' ')}</span>
        </span>
      );
    }
    return <span>{title}</span>;
  };

  // Render Tool Component
  const renderActiveToolComponent = () => {
    const customTool = customTools.find((ct) => ct.id === activeToolId);
    if (customTool) {
      return <CustomToolRunner lang={lang} tool={customTool} />;
    }

    switch (activeToolId) {
      case 'calculator':
        return <BasicCalculator lang={lang} />;
      case 'electricity':
        return <ElectricityBillEstimator lang={lang} />;
      case 'age':
        return <AgeCalculator lang={lang} />;
      case 'date-diff':
        return <DateDifferenceCalculator lang={lang} />;
      case 'emi':
        return <LoanEmiCalculator lang={lang} />;
      case 'land':
        return <LandMeasurementCalculator lang={lang} />;
      case 'bmi-calorie':
        return <BmiCalorieCalculator lang={lang} />;
      case 'weather':
        return <LiveWeatherView lang={lang} />;
      case 'prayer-times':
        return <PrayerTimesView lang={lang} />;
      case 'health-tips':
        return <HealthTipsView lang={lang} onOpenBmi={() => openTool('bmi-calorie')} />;
      case 'quran-pdf':
        return <QuranPdfReader lang={lang} />;
      case 'alarm':
        return <SmartAlarmClock lang={lang} />;
      default:
        return null;
    }
  };

  const currentTool = activeToolId
    ? allTools.find((t) => t.id === activeToolId)
    : null;

  return (
    <div className="min-h-screen bg-[#F4F7FD] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-x-hidden antialiased">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-[11px] font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-xs z-50">
          <WifiOff className="w-3 h-3" />
          <span>{lang === 'bn' ? 'অফলাইন মোড সক্রিয় — সকল ফিচার চলবে' : 'Offline Mode Active'}</span>
        </div>
      )}

      {/* =========================================================================
          TOP ROYAL BLUE HEADER BAR (Matches User Screenshot)
         ========================================================================= */}
      <header className="bg-[#0B63F6] text-white px-4 pt-3 pb-3.5 shadow-md flex items-center justify-between sticky top-0 z-40">
        {/* Left: Hamburger Menu Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-xl transition active:scale-90"
          title="Open Menu"
        >
          <Menu className="w-6 h-6 stroke-[2.4]" />
        </button>

        {/* Center: Title & Subtitle */}
        <div
          onClick={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('home');
          }}
          className="flex flex-col text-left cursor-pointer flex-1 ml-3 select-none"
        >
          <h1 className="font-extrabold text-[17px] tracking-tight text-white leading-tight">
            Smart Utility Tools
          </h1>
          <span className="text-[11px] text-blue-100 font-semibold tracking-wide leading-none mt-0.5">
            {lang === 'bn' ? 'সহজ হিসাব • স্মার্ট জীবন' : 'Simple · Fast · Useful'}
          </span>
        </div>

        {/* Right: 1-Tap Theme Toggle & Bilingual Pill Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-[#0047C7]/70 hover:bg-[#0047C7] border border-white/60 flex items-center justify-center text-white shadow-xs active:scale-90 transition-all shrink-0"
            title={theme === 'dark' ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
            aria-label="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-blue-100" />
            )}
          </button>

          <div className="bg-[#0047C7]/60 border border-white/60 p-0.5 rounded-full flex items-center shrink-0 shadow-inner">
            <button
              onClick={() => switchLanguage('bn')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === 'bn'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === 'en'
                  ? 'bg-white text-[#0B63F6] shadow-sm'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN SCROLLABLE CONTENT AREA
         ========================================================================= */}
      <main className="flex-1 px-4 py-4 pb-28">
        {/* 1. SPECIAL VIEW: BOOKS READER */}
        {specialView === 'books' ? (
          <BookReaderView
            lang={lang}
            onBack={() => setSpecialView('none')}
            onOpenAdmin={() => {
              setSpecialView('none');
              setActiveTab('settings');
              setSettingsSubView('admin');
            }}
          />
        ) : specialView === 'notes' ? (
          /* 2. SPECIAL VIEW: NOTEPAD & FORMULAS */
          <NotepadView
            lang={lang}
            onBack={() => setSpecialView('none')}
            onOpenAdmin={() => {
              setSpecialView('none');
              setActiveTab('settings');
              setSettingsSubView('admin');
            }}
          />
        ) : activeToolId && currentTool ? (
          /* 3. ACTIVE TOOL VIEW */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={closeTool}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B63F6] transition px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.actions.back}</span>
                </button>
                {currentTool.id === 'calculator' && (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'bn' ? currentTool.titleBn : currentTool.titleEn}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-[#0B63F6] dark:text-blue-400 border border-blue-200/60 dark:border-slate-700">
                  {lang === 'bn' ? currentTool.badgeBn : currentTool.badgeEn}
                </span>
                <button
                  onClick={(e) => toggleFavorite(currentTool.id, e)}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 shadow-xs transition"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(currentTool.id)
                        ? 'fill-rose-500 text-rose-500'
                        : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Omit duplicate logo & title banner card for Calculator as requested */}
            {currentTool.id !== 'calculator' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentTool.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                >
                  {renderToolIcon(currentTool.iconName, 'w-6 h-6')}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {lang === 'bn' ? currentTool.titleBn : currentTool.titleEn}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {lang === 'bn' ? currentTool.descBn : currentTool.descEn}
                  </p>
                </div>
              </div>
            )}

            {renderActiveToolComponent()}
          </div>
        ) : (
          /* 4. BOTTOM TABS */
          <>
            {/* TAB 1: HOME (Exact match to User Screenshot) */}
            {activeTab === 'home' && (
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'bn' ? 'টুল খুঁজুন...' : 'Search tools...'}
                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B63F6] shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Real-time Auto-Locating Weather Shortcut Card (Prominent Live Weather) */}
                {!searchQuery && (
                  <CompactHomeWeatherWidget
                    lang={lang}
                    onOpenDetails={() => openTool('weather')}
                  />
                )}

                {/* Quick Shortcuts: Books & Notepad */}
                {!searchQuery && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setSpecialView('books')}
                      className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center gap-2.5 shadow-sm active:scale-98 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate leading-tight">
                          {lang === 'bn' ? 'বই ও হ্যান্ডবুক' : 'Books & Guides'}
                        </span>
                        <span className="text-[10px] text-blue-100 block truncate">
                          {lang === 'bn' ? 'ইলেকট্রিক্যাল পাঠ' : 'Read guides'}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setSpecialView('notes')}
                      className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center gap-2.5 shadow-sm active:scale-98 transition text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block truncate leading-tight">
                          {lang === 'bn' ? 'নোটপ্যাড ও মেমো' : 'Smart Notepad'}
                        </span>
                        <span className="text-[10px] text-emerald-100 block truncate">
                          {lang === 'bn' ? 'যেকোনো তথ্য ও চেকলিস্ট' : 'Notes & checklist'}
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Section Title: "টুলস সমূহ" */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-base font-bold text-[#0B3A82] dark:text-blue-300 tracking-tight">
                    {lang === 'bn' ? 'টুলস সমূহ' : 'All Tools'}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formatNumber(filteredTools.length, lang)} {lang === 'bn' ? 'টি' : 'items'}
                  </span>
                </div>

                {/* 2-Column Tools Grid (Exact match to User Screenshot) */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => openTool(tool.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/90 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs hover:shadow-md transition active:scale-97 cursor-pointer select-none"
                    >
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        {renderToolIcon(tool.iconName, 'w-6 h-6')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight block">
                          {renderTitleFormatted(lang === 'bn' ? tool.titleBn : tool.titleEn)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: FAVORITES */}
            {activeTab === 'favorites' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'পছন্দের তালিকা' : 'Favorite Tools'}
                  </h2>
                </div>

                {favoriteTools.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                    {lang === 'bn' ? 'এখনো কোনো টুল ফেভারিটে যোগ করেননি।' : 'No favorite tools saved yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {favoriteTools.map((tool) => (
                      <div
                        key={`fav-${tool.id}`}
                        onClick={() => openTool(tool.id)}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs hover:shadow-md transition active:scale-97 cursor-pointer"
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          {renderToolIcon(tool.iconName, 'w-6 h-6')}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {renderTitleFormatted(lang === 'bn' ? tool.titleBn : tool.titleEn)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RECENTS (সাম্প্রতিক) */}
            {activeTab === 'recents' && (
              <HistoryView lang={lang} onSelectTool={openTool} />
            )}

            {/* TAB 4: SETTINGS & ADMIN (সেটিংস) */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-4">
                {settingsSubView === 'main' && (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {lang === 'bn' ? 'অ্যাপ সেটিংস ও নিয়ন্ত্রণ' : 'Settings & Control'}
                    </h2>

                    {/* Master Admin Panel (Locked to zulfiqar1hasan@gmail.com) */}
                    <button
                      onClick={() => setSettingsSubView('admin')}
                      className="bg-gradient-to-r from-[#0B63F6] to-blue-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm block">
                              {lang === 'bn' ? 'সিস্টেম অ্যাডমিন প্যানেল' : 'System Admin Console'}
                            </span>
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-blue-100">
                              Protected
                            </span>
                          </div>
                          <span className="text-[11px] text-blue-100 block">
                            {lang === 'bn' ? 'কনটেন্ট ম্যানেজমেন্ট ও সুরক্ষিত অ্যাক্সেস' : 'Content management and secure configuration'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80" />
                    </button>

                    {/* Books & Reference Guide Button */}
                    <button
                      onClick={() => setSpecialView('books')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#0B63F6] flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {lang === 'bn' ? 'বই ও রেফারেন্স হ্যান্ডবুক' : 'Books & Reference Guides'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {lang === 'bn' ? 'ওয়্যারিং ও ইলেকট্রিক্যাল নিয়ম পড়ুন' : 'Read electrical engineering handbooks'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Notepad & Formulas */}
                    <button
                      onClick={() => setSpecialView('notes')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {lang === 'bn' ? 'নোটপ্যাড ও সূত্র ব্যাঙ্ক' : 'Notepad & Formula Bank'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {lang === 'bn' ? 'কাজের সূত্র ও চেকলিস্ট সংরক্ষণ' : 'Saved formulas and checklists'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* AdMob Settings Card */}
                    <button
                      onClick={() => setSettingsSubView('admob')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {lang === 'bn' ? 'গুগল অ্যাডমব মনিটাইজেশন' : 'Google AdMob Monetization'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {lang === 'bn' ? 'অ্যাপ আইডি ও ব্যানার আইডি কনফিগার' : 'App ID & Unit IDs inspector'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* About & Policy */}
                    <button
                      onClick={() => setSettingsSubView('about')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs active:scale-98 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {lang === 'bn' ? 'পলিসি ও পরিচিতি' : 'About & Privacy Policy'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {lang === 'bn' ? 'প্লে স্টোর পলিসি ও ভার্সন ১.০.০' : 'Play Store compliant policy'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Dark Mode Toggle */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 flex items-center justify-center">
                          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300"
                      >
                        {theme === 'dark' ? 'Light' : 'Dark'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Subview: Admin Studio */}
                {settingsSubView === 'admin' && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSettingsSubView('main')}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0B63F6] mb-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'সেটিংসে ফিরুন' : 'Back to Settings'}</span>
                    </button>
                    <AdminPanel
                      lang={lang}
                      onOpenTool={(toolId) => openTool(toolId)}
                      onRefreshTools={refreshCustomTools}
                    />
                  </div>
                )}

                {/* Subview: AdMob Manager */}
                {settingsSubView === 'admob' && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSettingsSubView('main')}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0B63F6] mb-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'সেটিংসে ফিরুন' : 'Back to Settings'}</span>
                    </button>
                    <AdMobManager lang={lang} />
                  </div>
                )}

                {/* Subview: About Policy */}
                {settingsSubView === 'about' && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSettingsSubView('main')}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0B63F6] mb-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'সেটিংসে ফিরুন' : 'Back to Settings'}</span>
                    </button>
                    <AboutPolicy lang={lang} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* =========================================================================
          PERSISTENT ADMOB BANNER AT BOTTOM
         ========================================================================= */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto z-30 shadow-md">
        <AdMobBanner
          lang={lang}
          onOpenGuide={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('settings');
            setSettingsSubView('admob');
          }}
        />
      </div>

      {/* =========================================================================
          BOTTOM TAB NAVIGATION (হোম, পছন্দের, সাম্প্রতিক, সেটিংস)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 h-16 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 grid grid-cols-4 items-center px-2 pb-safe shadow-lg select-none">
        {/* Tab 1: Home (হোম) */}
        <button
          onClick={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('home');
          }}
          className="flex flex-col items-center justify-center h-full transition"
        >
          <Home
            className={`w-5 h-5 transition-transform ${
              activeTab === 'home' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6] stroke-[2.4] scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[10px] mt-1 font-bold ${
              activeTab === 'home' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6]'
                : 'text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Favorites (পছন্দের) */}
        <button
          onClick={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('favorites');
          }}
          className="flex flex-col items-center justify-center h-full transition"
        >
          <Heart
            className={`w-5 h-5 transition-transform ${
              activeTab === 'favorites' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6] stroke-[2.4] fill-[#0B63F6]/20 scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[10px] mt-1 font-bold ${
              activeTab === 'favorites' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6]'
                : 'text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'পছন্দের' : 'Favorites'}
          </span>
        </button>

        {/* Tab 3: Recent (সাম্প্রতিক) */}
        <button
          onClick={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('recents');
          }}
          className="flex flex-col items-center justify-center h-full transition"
        >
          <Clock
            className={`w-5 h-5 transition-transform ${
              activeTab === 'recents' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6] stroke-[2.4] scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[10px] mt-1 font-bold ${
              activeTab === 'recents' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6]'
                : 'text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}
          </span>
        </button>

        {/* Tab 4: Settings (সেটিংস) */}
        <button
          onClick={() => {
            closeTool();
            setSpecialView('none');
            setActiveTab('settings');
            setSettingsSubView('main');
          }}
          className="flex flex-col items-center justify-center h-full transition"
        >
          <Settings
            className={`w-5 h-5 transition-transform ${
              activeTab === 'settings' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6] stroke-[2.4] scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[10px] mt-1 font-bold ${
              activeTab === 'settings' && !activeToolId && specialView === 'none'
                ? 'text-[#0B63F6]'
                : 'text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'সেটিংস' : 'Settings'}
          </span>
        </button>
      </nav>

      {/* =========================================================================
          SLIDE-OVER MOBILE DRAWER (Activated by Hamburger Menu)
         ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0B63F6] text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                      Smart Utility Tools
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      সংস্করণ ১.০.০ (অফলাইন)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    closeTool();
                    setSpecialView('none');
                    setActiveTab('home');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Home className="w-4 h-4 text-[#0B63F6]" />
                  <span>{lang === 'bn' ? 'হোম পেজ' : 'Home Screen'}</span>
                </button>

                <button
                  onClick={() => {
                    closeTool();
                    setSpecialView('books');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'bn' ? 'বই ও রেফারেন্স হ্যান্ডবুক' : 'Books & Guides'}</span>
                </button>

                <button
                  onClick={() => {
                    closeTool();
                    setSpecialView('notes');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'নোটপ্যাড ও মেমো' : 'Smart Notepad'}</span>
                </button>

                <button
                  onClick={() => {
                    openTool('health-tips');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>{lang === 'bn' ? 'স্বাস্থ্য টিপস ও গাইডলাইন' : 'Health & Wellness Tips'}</span>
                </button>

                <button
                  onClick={() => {
                    openTool('quran-pdf');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'আল-কুরআনুল কারীম' : 'Holy Quran'}</span>
                </button>



                {/* Exclusive Admin Panel Link */}
                <button
                  onClick={() => {
                    closeTool();
                    setSpecialView('none');
                    setActiveTab('settings');
                    setSettingsSubView('admin');
                    setIsDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/60 dark:border-slate-700 transition text-left"
                >
                  <Lock className="w-4 h-4 text-[#0B63F6]" />
                  <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল (জুলফিকার)' : 'Admin Panel (Personal)'}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] truncate max-w-[170px]">
                {AUTHORIZED_ADMIN_EMAIL}
              </span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Ringing Alarm Fullscreen Display - Guaranteed visible anywhere in the app */}
      {globalRingingAlarm && (
        <AlarmRingingOverlay alarm={globalRingingAlarm} lang={lang} />
      )}

      {/* Android Double-Tap Back Exit Toast Notification */}
      {exitToastVisible && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-2 pointer-events-none animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{lang === 'bn' ? 'অ্যাপ থেকে বের হতে আবার ব্যাক বাটনে চাপ দিন' : 'Press back again to exit'}</span>
        </div>
      )}
    </div>
  );
}
