/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Zap,
  Percent,
  ArrowRightLeft,
  CalendarClock,
  Cpu,
  Flame,
  CalendarRange,
  Search,
  Heart,
  Clock,
  Moon,
  Sun,
  ArrowLeft,
  Home,
  Grid,
  DollarSign,
  ShieldCheck,
  Sparkles,
  X,
  ChevronRight,
  WifiOff,
  Sliders,
  Settings,
  BatteryCharging,
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
import { TOOLS_LIST, UI_TEXT, formatNumber } from './i18n/translations';

// Standard Tools
import { BasicCalculator } from './components/tools/BasicCalculator';
import { ElectricityBillEstimator } from './components/tools/ElectricityBillEstimator';
import { PercentageCalculator } from './components/tools/PercentageCalculator';
import { UnitConverter } from './components/tools/UnitConverter';
import { AgeCalculator } from './components/tools/AgeCalculator';
import { ElectricalCalculator } from './components/tools/ElectricalCalculator';
import { EnergyConsumptionCalculator } from './components/tools/EnergyConsumptionCalculator';
import { DateDifferenceCalculator } from './components/tools/DateDifferenceCalculator';
import { CustomToolRunner } from './components/tools/CustomToolRunner';

// Auxiliary views & Admin
import { AdminPanel } from './components/admin/AdminPanel';
import { AdMobBanner } from './components/admob/AdMobBanner';
import { AdMobManager } from './components/admob/AdMobManager';
import { HistoryView } from './components/HistoryView';
import { AboutPolicy } from './components/AboutPolicy';
import { PWAInstallButton } from './components/PWAInstallButton';

type ActiveTab = 'home' | 'categories' | 'history' | 'admin' | 'about';

export default function App() {
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites());
  const [recents, setRecents] = useState<string[]>(getStoredRecents());
  const [customTools, setCustomTools] = useState<CustomTool[]>(getStoredCustomTools());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const t = UI_TEXT[lang];

  // Refresh custom tools list
  const refreshCustomTools = () => {
    setCustomTools(getStoredCustomTools());
  };

  // Sync HTML language attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Handle Online/Offline Detection
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

  // Handle Theme
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

  // Combined built-in and dynamic custom tools
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

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    setStoredLanguage(nextLang);
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
    addStoredRecent(id);
    setRecents(getStoredRecents());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeTool = () => {
    setActiveToolId(null);
  };

  // Filter tools based on category & search query
  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'electrical') {
          // Include electrical tools and custom electrical tools
          if (tool.id !== 'electrical' && tool.id !== 'electricity' && tool.category !== 'electrical') {
            return false;
          }
        } else if (tool.category !== selectedCategory) {
          return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle =
          tool.titleEn.toLowerCase().includes(q) || tool.titleBn.toLowerCase().includes(q);
        const matchDesc =
          tool.descEn.toLowerCase().includes(q) || tool.descBn.toLowerCase().includes(q);
        const matchBadge =
          tool.badgeEn.toLowerCase().includes(q) || tool.badgeBn.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchBadge;
      }
      return true;
    });
  }, [allTools, selectedCategory, searchQuery]);

  // Favorite tools
  const favoriteTools = useMemo(() => {
    return allTools.filter((tool) => favorites.includes(tool.id));
  }, [allTools, favorites]);

  // Recent tools
  const recentTools = useMemo(() => {
    return recents
      .map((id) => allTools.find((t) => t.id === id))
      .filter((t): t is ToolItem => Boolean(t));
  }, [allTools, recents]);

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
      case 'Flame':
        return <Flame className={className} />;
      case 'CalendarRange':
        return <CalendarRange className={className} />;
      case 'BatteryCharging':
        return <BatteryCharging className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Render Tool Component
  const renderActiveToolComponent = () => {
    // Check if it's a dynamic custom tool
    const customTool = customTools.find((ct) => ct.id === activeToolId);
    if (customTool) {
      return <CustomToolRunner lang={lang} tool={customTool} />;
    }

    switch (activeToolId) {
      case 'calculator':
        return <BasicCalculator lang={lang} />;
      case 'electricity':
        return <ElectricityBillEstimator lang={lang} />;
      case 'percentage':
        return <PercentageCalculator lang={lang} />;
      case 'converter':
        return <UnitConverter lang={lang} />;
      case 'age':
        return <AgeCalculator lang={lang} />;
      case 'electrical':
        return <ElectricalCalculator lang={lang} />;
      case 'energy':
        return <EnergyConsumptionCalculator lang={lang} />;
      case 'date-diff':
        return <DateDifferenceCalculator lang={lang} />;
      default:
        return null;
    }
  };

  const currentTool = activeToolId
    ? allTools.find((t) => t.id === activeToolId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'অফলাইন মোড সক্রিয় — সকল টুল নির্বিঘ্নে চলবে।' : 'Offline Mode Active — All tools operate locally.'}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 h-15 flex items-center justify-between gap-3 shadow-xs">
        {/* Brand / Logo */}
        <div
          onClick={() => {
            closeTool();
            setActiveTab('home');
          }}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight">
              {lang === 'bn' ? 'স্মার্ট টুলস ও ইলেকট্রিক্যাল' : 'Smart Tools & Electrical'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase leading-none mt-0.5">
              {lang === 'bn' ? 'বাংলা ও English' : 'Bengali & English'}
            </span>
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2">
          {/* Admin Studio Quick Launch Button */}
          <button
            onClick={() => {
              closeTool();
              setActiveTab('admin');
            }}
            className="h-9 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Admin Studio (নতুন টুল যোগ করুন)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'অ্যাডমিন স্টুডিও' : 'Admin'}</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton lang={lang} />

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition shadow-xs active:scale-95 flex items-center justify-center"
            title="Switch Language / ভাষা পরিবর্তন"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition shadow-xs active:scale-95"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 pb-32">
        {/* TOOL SCREEN VIEW */}
        {activeToolId && currentTool ? (
          <div className="flex flex-col gap-5">
            {/* Tool Nav Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={closeTool}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.actions.back}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                  {lang === 'bn' ? currentTool.badgeBn : currentTool.badgeEn}
                </span>
                <button
                  onClick={(e) => toggleFavorite(currentTool.id, e)}
                  className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 shadow-xs transition active:scale-95"
                  title="Toggle Favorite"
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

            {/* Tool Header Card with Gradient Accent */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentTool.gradient} text-white flex items-center justify-center shrink-0 shadow-md`}
              >
                {renderToolIcon(currentTool.iconName, 'w-7 h-7')}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {lang === 'bn' ? currentTool.titleBn : currentTool.titleEn}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {lang === 'bn' ? currentTool.descBn : currentTool.descEn}
                </p>
              </div>
            </div>

            {/* Render Tool Body */}
            {renderActiveToolComponent()}
          </div>
        ) : (
          /* TAB SCREENS */
          <>
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="flex flex-col gap-6">
                {/* Hero Showcase Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl text-white">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {lang === 'bn' ? '১০০% অফলাইন ইলেকট্রিক্যাল ও ইউটিলিটি টুলবক্স' : '100% Offline Electrical & Utility Toolkit'}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                      {lang === 'bn' ? 'ইলেকট্রিক্যাল ও স্মার্ট ইউটিলিটি টুলস' : 'Smart Electrical & Utility Tools'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                      {lang === 'bn'
                        ? 'ওহমস ল, ১-ফেজ/৩-ফেজ পাওয়ার, ভোল্টেজ ড্রপ ও তারের সাইজ, মোটর কারেন্ট, ক্যাপাসিটর ব্যাংক, ট্রান্সফরমার এবং কাস্টম অ্যাডমিন ফর্মুলা স্টুডিও।'
                        : 'Ohm’s law, 3-phase power, cable voltage drop sizing, motor FLA, capacitor bank kVAR, transformers, and custom formula builder.'}
                    </p>

                    {/* Integrated Search Box */}
                    <div className="relative mt-2">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full h-13 bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-10 text-xs sm:text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-inner"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex overflow-x-auto gap-2 no-scrollbar py-0.5">
                  {(['all', 'electrical', 'utility', 'finance', 'daily'] as ToolCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t.categories[cat]}
                    </button>
                  ))}
                </div>

                {/* Favourites Strip (if any favorited) */}
                {!searchQuery && selectedCategory === 'all' && favoriteTools.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>{t.favorites}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {favoriteTools.map((tool) => (
                        <div
                          key={`fav-${tool.id}`}
                          onClick={() => openTool(tool.id)}
                          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/60 rounded-2xl p-3.5 shadow-xs flex items-center justify-between cursor-pointer transition active:scale-98"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shrink-0 shadow-xs`}
                            >
                              {renderToolIcon(tool.iconName, 'w-4 h-4')}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {lang === 'bn' ? tool.titleBn : tool.titleEn}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently Used Tray */}
                {!searchQuery && selectedCategory === 'all' && recentTools.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{t.recents}</span>
                    </div>
                    <div className="flex overflow-x-auto gap-2.5 no-scrollbar pb-1">
                      {recentTools.map((tool) => (
                        <button
                          key={`recent-${tool.id}`}
                          onClick={() => openTool(tool.id)}
                          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shrink-0 hover:border-emerald-500/50 transition active:scale-98 shadow-xs"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center`}
                          >
                            {renderToolIcon(tool.iconName, 'w-3.5 h-3.5')}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {lang === 'bn' ? tool.titleBn : tool.titleEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Tools Catalog Grid */}
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {selectedCategory === 'all'
                        ? t.allTools
                        : t.categories[selectedCategory]}{' '}
                      ({formatNumber(filteredTools.length, lang)})
                    </span>

                    <button
                      onClick={() => setActiveTab('admin')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? '+ কাস্টম টুল যোগ করুন' : '+ Add Custom Tool'}</span>
                    </button>
                  </div>

                  {filteredTools.length === 0 ? (
                    <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs text-slate-500">
                      {lang === 'bn' ? 'কোনো টুল পাওয়া যায়নি।' : 'No matching tools found.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredTools.map((tool) => {
                        const isFav = favorites.includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => openTool(tool.id)}
                            className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/70 dark:hover:border-emerald-500/50 rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative active:scale-98"
                          >
                            <div>
                              {/* Card Top: Gradient Squircle Icon & Favorite Toggle */}
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105`}
                                >
                                  {renderToolIcon(tool.iconName, 'w-6 h-6')}
                                </div>
                                <div className="flex items-center gap-1">
                                  {tool.isCustom && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      Custom
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => toggleFavorite(tool.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 transition active:scale-90"
                                    title="Add to Favorites"
                                  >
                                    <Heart
                                      className={`w-4 h-4 ${
                                        isFav ? 'fill-rose-500 text-rose-500' : ''
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Title & Desc */}
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                                {lang === 'bn' ? tool.titleBn : tool.titleEn}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                {lang === 'bn' ? tool.descBn : tool.descEn}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-400 text-[11px]">
                                {lang === 'bn' ? tool.badgeBn : tool.badgeEn}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>{lang === 'bn' ? 'ব্যবহার করুন' : 'Open'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="flex flex-col gap-6">
                {(['electrical', 'utility', 'finance', 'daily'] as const).map((catKey) => {
                  const toolsInCat = allTools.filter((t) => {
                    if (catKey === 'electrical') {
                      return t.id === 'electrical' || t.id === 'electricity' || t.category === 'electrical';
                    }
                    return t.category === catKey;
                  });
                  if (toolsInCat.length === 0) return null;
                  return (
                    <div key={catKey} className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {t.categories[catKey]}
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {toolsInCat.map((tool) => (
                          <div
                            key={tool.id}
                            onClick={() => openTool(tool.id)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition active:scale-98"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}
                              >
                                {renderToolIcon(tool.iconName, 'w-6 h-6')}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {lang === 'bn' ? tool.titleBn : tool.titleEn}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {lang === 'bn' ? tool.descBn : tool.descEn}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <HistoryView lang={lang} onSelectTool={openTool} />
            )}

            {/* TAB: ADMIN STUDIO */}
            {activeTab === 'admin' && (
              <AdminPanel
                lang={lang}
                onOpenTool={openTool}
                onRefreshTools={refreshCustomTools}
              />
            )}

            {/* TAB: ABOUT & ADMOB */}
            {activeTab === 'about' && (
              <div className="flex flex-col gap-6">
                <AboutPolicy lang={lang} />
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                    {lang === 'bn' ? 'অ্যাডমব মনিটাইজেশন কনফিগারেশন' : 'AdMob Monetization Settings'}
                  </h2>
                  <AdMobManager lang={lang} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Persistent AdMob Banner at Bottom */}
      <div className="fixed bottom-16 left-0 right-0 z-30 shadow-md">
        <AdMobBanner
          lang={lang}
          onOpenGuide={() => {
            closeTool();
            setActiveTab('about');
          }}
        />
      </div>

      {/* Fixed Bottom Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 grid grid-cols-5 items-center px-1 pb-safe shadow-lg">
        {/* Tab 1: Home */}
        <button
          onClick={() => {
            closeTool();
            setActiveTab('home');
          }}
          className="flex flex-col items-center justify-center h-full transition py-1"
        >
          <div
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
              activeTab === 'home' && !activeToolId
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.tabs.home}
            </span>
          </div>
        </button>

        {/* Tab 2: Categories */}
        <button
          onClick={() => {
            closeTool();
            setActiveTab('categories');
          }}
          className="flex flex-col items-center justify-center h-full transition py-1"
        >
          <div
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
              activeTab === 'categories' && !activeToolId
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4.5 h-4.5" />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.tabs.categories}
            </span>
          </div>
        </button>

        {/* Tab 3: History */}
        <button
          onClick={() => {
            closeTool();
            setActiveTab('history');
          }}
          className="flex flex-col items-center justify-center h-full transition py-1"
        >
          <div
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
              activeTab === 'history' && !activeToolId
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4.5 h-4.5" />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.tabs.history}
            </span>
          </div>
        </button>

        {/* Tab 4: Admin Studio */}
        <button
          onClick={() => {
            closeTool();
            setActiveTab('admin');
          }}
          className="flex flex-col items-center justify-center h-full transition py-1"
        >
          <div
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
              activeTab === 'admin' && !activeToolId
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4.5 h-4.5" />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.tabs.admin}
            </span>
          </div>
        </button>

        {/* Tab 5: About & Policy */}
        <button
          onClick={() => {
            closeTool();
            setActiveTab('about');
          }}
          className="flex flex-col items-center justify-center h-full transition py-1"
        >
          <div
            className={`flex flex-col items-center px-3 py-1 rounded-xl transition ${
              activeTab === 'about' && !activeToolId
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {t.tabs.about}
            </span>
          </div>
        </button>
      </nav>
    </div>
  );
}
