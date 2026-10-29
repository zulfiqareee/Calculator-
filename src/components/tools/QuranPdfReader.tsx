import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Volume2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Sliders,
  Share2,
  Download,
  RefreshCw,
  Layers,
  ChevronDown,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import { QuranSurah, QuranAyah, getStoredSurahs, addOrUpdateSurah } from '../../utils/quranStorage';
import { renderTajweedBengaliText, TAJWEED_RULES } from '../../utils/tajweedHelper';

interface Props {
  lang: Language;
}

export const QuranPdfReader: React.FC<Props> = ({ lang }) => {
  const [surahs, setSurahs] = useState<QuranSurah[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'মাক্কী' | 'মাদানী' | 'juz'>('all');
  const [selectedJuz, setSelectedJuz] = useState<number>(1);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<number>(22); // Arabic font size
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(false);
  const [onlineFetchSuccess, setOnlineFetchSuccess] = useState<string | null>(null);
  const [enableTajweedHighlight, setEnableTajweedHighlight] = useState<boolean>(true);
  const [showTajweedModal, setShowTajweedModal] = useState<boolean>(false);
  const [bookmarkedSurahId, setBookmarkedSurahId] = useState<string | null>(() => {
    return localStorage.getItem('smart_quran_bookmark_surah') || null;
  });

  useEffect(() => {
    const list = getStoredSurahs();
    setSurahs(list);
  }, []);

  const handleCopyAyah = (arabic: string, bangla: string, num: number) => {
    const text = `${arabic}\n${bangla}\n(সূরা ${selectedSurah?.nameBn}, আয়াত: ${num})`;
    navigator.clipboard?.writeText(text);
    setCopiedAyah(num);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  const handleToggleBookmark = (surahId: string) => {
    if (bookmarkedSurahId === surahId) {
      setBookmarkedSurahId(null);
      localStorage.removeItem('smart_quran_bookmark_surah');
    } else {
      setBookmarkedSurahId(surahId);
      localStorage.setItem('smart_quran_bookmark_surah', surahId);
    }
  };

  // Fetch complete verses online from Al-Quran Cloud API
  const handleFetchFullSurahOnline = async () => {
    if (!selectedSurah) return;
    setIsLoadingOnline(true);
    setOnlineFetchSuccess(null);
    try {
      const resp = await fetch(
        `https://api.alquran.cloud/v1/surah/${selectedSurah.surahNumber}/editions/quran-uthmani,bn.bengali`
      );
      if (!resp.ok) {
        throw new Error('Network error or API unavailable');
      }
      const json = await resp.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arAyahs = json.data[0].ayahs;
        const bnAyahs = json.data[1].ayahs;

        const newAyahs: QuranAyah[] = arAyahs.map((arItem: any, idx: number) => {
          const bnItem = bnAyahs[idx];
          return {
            ayahNumber: arItem.numberInSurah,
            arabic: arItem.text,
            pronunciation: '',
            bangla: bnItem ? bnItem.text : '',
          };
        });

        const updated: QuranSurah = {
          ...selectedSurah,
          ayahs: newAyahs,
        };

        const newList = addOrUpdateSurah(updated);
        setSurahs(newList);
        setSelectedSurah(updated);
        setOnlineFetchSuccess(
          lang === 'bn'
            ? `মাশাআল্লাহ! সম্পূর্ণ ${toBn(newAyahs.length)}টি আয়াত সফলভাবে সংরক্ষিত হয়েছে।`
            : `Success! All ${newAyahs.length} ayahs saved offline.`
        );
        setTimeout(() => setOnlineFetchSuccess(null), 4000);
      }
    } catch (e) {
      console.error('Failed to fetch full surah online:', e);
      setOnlineFetchSuccess(
        lang === 'bn'
          ? 'অনলাইনে লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।'
          : 'Could not fetch online. Please check internet connection.'
      );
      setTimeout(() => setOnlineFetchSuccess(null), 4000);
    } finally {
      setIsLoadingOnline(false);
    }
  };

  // Convert number to Bengali
  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const filteredSurahs = surahs.filter((s) => {
    const matchesSearch =
      s.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameAr.includes(searchQuery) ||
      s.meaningBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.surahNumber) === searchQuery.trim() ||
      String(s.surahNumber).includes(searchQuery.trim());

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'মাক্কী') return s.revelationType === 'মাক্কী';
    if (filterType === 'মাদানী') return s.revelationType === 'মাদানী';
    if (filterType === 'juz') return s.juzNumber === selectedJuz;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Tajweed & Pronunciation Guide Modal */}
      {showTajweedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'বাংলা উচ্চারণের টান ও তাজবীদ নির্দেশিকা' : 'Tajweed & Pronunciation Guide'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'কোন জায়গায় কেমন টান ও উচ্চারণ দিতে হবে' : 'How to elongate & pronounce accurately'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTajweedModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Introduction */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1.5 border border-emerald-100 dark:border-emerald-900/50">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>সহজ ভাষায় কুরআনের সঠিক উচ্চারণ পদ্ধতি:</span>
              </p>
              <p>
                বাংলা উচ্চারণ দেখে যাতে সঠিক নিয়মে তিলাওয়াত করা যায়, সেজন্য বিশেষ চিহ্নায়ন ও কালার কোড যুক্ত করা হয়েছে। নিচে নিয়মগুলো দেখে নিন:
              </p>
            </div>

            {/* Rule 1: 4 Alif Long Madd */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-base">〰️</span>
                  <span>৪ আলিফ লম্বা টান (মাদ্দে লাযিম / মুত্তাসিল)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/60 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                  ৩ থেকে ৪ সেকেন্ড
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>চেনার উপায়:</strong> বাংলা লেখার ভেতর ঢেউ চিহ্ন <strong>`~~~`</strong> বা লাল আন্ডারলাইন সহ <strong>[৪ আলিফ টান]</strong> ট্যাগ দেখতে পাবেন।
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs text-rose-700 dark:text-rose-300 font-bold">
                উদাহরণ: ওয়ালাদ্-দ্বা~~~ল্লী-ন [৪ আলিফ লম্বা টান] , জা~~~-আ
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                👉 এখানে আওয়াজ না থামিয়ে প্রায় ৩ থেকে ৪ সেকেন্ড লম্বা করে টেনে পড়তে হবে।
              </p>
            </div>

            {/* Rule 2: 1 Alif Normal Madd */}
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-base">➖</span>
                  <span>১ আলিফ স্বাভাবিক টান (মাদ্দে আসলি)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200/60 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                  ১ সেকেন্ড টান
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>চেনার উপায়:</strong> শব্দের মাঝে <strong>আ- , ঈ- , ঊ- , লা- , মা-</strong> ইত্যাদি দীর্ঘ স্বরের পাশে হাইফেন (-) দেওয়া আছে।
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs text-sky-700 dark:text-sky-300 font-bold">
                উদাহরণ: আল-হামদু লিল্লা-হি রাব্বিল আ-লামী-ন , আর-রাহমা-নির রাহী-ম
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                👉 এখানে বেশি তাড়াহুড়ো না করে স্বাভাবিক ১ আলিফ (১ সেকেন্ড পরিমাণ) টেনে পড়তে হবে।
              </p>
            </div>

            {/* Rule 3: Ghunnah */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-base">👃</span>
                  <span>ওয়াজিব গুন্নাহ্ ও ইখফা (নাকের বাঁশি দিয়ে গুঞ্জন)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  নাকের গুঞ্জন
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>চেনার উপায়:</strong> সবুজ রঙের ব্র্যাকেটে <strong>[গুন্নাহ্]</strong> বা <strong>[ওয়াজিব গুন্নাহ্]</strong> লেখা থাকবে।
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                উদাহরণ: ইন্‌ন্না [গুন্নাহ্] , ক্বুল আঊ-যু বিরাব্বিন-না-স [ওয়াজিব গুন্নাহ্]
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                👉 নূন বা মীম হরফে তাশদীদ হলে নাকের বাঁশিতে ১ আলিফ পরিমাণ আওয়াজ গুঞ্জন করে ধরে রাখতে হবে।
              </p>
            </div>

            {/* Rule 4: Qalqalah */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="text-base">⚡</span>
                  <span>কলকলাহ্ (প্রতিধ্বনি সৃষ্টি করা)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                  ধাক্কা / প্রতিধ্বনি
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>চেনার উপায়:</strong> ক্বাফ, ত্বা, বা, জীম, দাল (ق ط ب ج د) হরফে সাকিন হলে অক্ষরের মাথায় <strong>ᶿ</strong> অথবা <strong>[কলকলাহ্]</strong> চিহ্ন থাকবে।
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-xs text-amber-700 dark:text-amber-300 font-bold">
                উদাহরণ: ক্বুল হুওয়াল্লা-হু আহাদᶿ [দাল-এ কলকলাহ্] , ফালাক্বᶿ , ওয়াক্বাবᶿ
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                👉 হরফটিতে থামার সময় মৃদু ধাক্কা দিয়ে প্রতিধ্বনি তৈরি করতে হবে (যেমন: আহা-দ~দ্)।
              </p>
            </div>

            <button
              onClick={() => setShowTajweedModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              {lang === 'bn' ? 'বুঝেছি, তিলাওয়াত শুরু করুন' : 'Got it, start reciting'}
            </button>
          </div>
        </div>
      )}

      {/* Surah Reading View */}
      {selectedSurah ? (
        <div className="space-y-4">
          {/* Navigation & Controls Top Bar */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedSurah(null)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'সকল সূরা' : 'Surahs'}</span>
            </button>

            {/* Quick Surah Selector */}
            <div className="flex-1 min-w-0 max-w-[200px] text-center">
              <select
                value={selectedSurah.surahNumber}
                onChange={(e) => {
                  const target = surahs.find((s) => s.surahNumber === Number(e.target.value));
                  if (target) setSelectedSurah(target);
                }}
                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 truncate focus:outline-hidden"
              >
                {surahs.map((s) => (
                  <option key={s.id} value={s.surahNumber}>
                    {toBn(s.surahNumber)}. {lang === 'bn' ? s.nameBn : s.nameEn} ({s.nameAr})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Tajweed Guide Button */}
              <button
                onClick={() => setShowTajweedModal(true)}
                className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition"
                title={lang === 'bn' ? 'টান ও তাজবীদ নির্দেশিকা' : 'Tajweed Guide'}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Tajweed highlight toggle */}
              <button
                onClick={() => setEnableTajweedHighlight(!enableTajweedHighlight)}
                className={`p-1.5 rounded-lg transition ${
                  enableTajweedHighlight
                    ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={lang === 'bn' ? 'টান ও তাজবীদ কালার কোড অন/অফ' : 'Toggle Tajweed color highlights'}
              >
                {enableTajweedHighlight ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setFontSize((f) => Math.max(16, f - 2))}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Font smaller"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize((f) => Math.min(36, f + 2))}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Font larger"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleBookmark(selectedSurah.id)}
                className={`p-1.5 rounded-lg transition ${
                  bookmarkedSurahId === selectedSurah.id
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${bookmarkedSurahId === selectedSurah.id ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Surah Header Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white text-center shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white inline-block mb-2">
                {toBn(selectedSurah.surahNumber)}. {selectedSurah.revelationType} • {toBn(selectedSurah.totalAyahs)}{' '}
                {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                {selectedSurah.juzNumber && (
                  <span> • {lang === 'bn' ? `পারা ${toBn(selectedSurah.juzNumber)}` : `Juz ${selectedSurah.juzNumber}`}</span>
                )}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black font-arabic tracking-wide mt-1 mb-2">
                {selectedSurah.nameAr}
              </h1>
              <p className="text-base font-bold text-emerald-100">
                {lang === 'bn' ? selectedSurah.nameBn : selectedSurah.nameEn}
              </p>
              <p className="text-xs text-emerald-200 mt-0.5">
                {lang === 'bn' ? `অর্থ: ${selectedSurah.meaningBn}` : `Meaning: ${selectedSurah.meaningBn}`}
              </p>

              {/* Bismillah (Except Surah 9 At-Tawbah) */}
              {selectedSurah.surahNumber !== 9 && (
                <div className="mt-4 pt-3 border-t border-emerald-600/40">
                  <p className="text-xl font-arabic font-bold text-amber-200 tracking-wider">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <p className="text-[11px] text-emerald-100 mt-1">
                    {lang === 'bn'
                      ? 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে শুরু করছি'
                      : 'In the name of Allah, Most Gracious, Ever Merciful'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tajweed Legend Strip */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-xs text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-slate-500 dark:text-slate-400">টান নির্দেশিকা:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/40">
                〰️ ৪ আলিফ লম্বা টান
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-900/40">
                ➖ ১ আলিফ টান
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/40">
                👃 গুন্নাহ্
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900/40">
                ⚡ কলকলাহ্
              </span>
            </div>

            <button
              onClick={() => setShowTajweedModal(true)}
              className="font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>বিস্তারিত নিয়ম</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Online Load Full Surah Prompt / Button */}
          {selectedSurah.ayahs.length < selectedSurah.totalAyahs && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {lang === 'bn'
                    ? `এখানে নির্বাচিত ${toBn(selectedSurah.ayahs.length)}টি আয়াত রয়েছে (মোট ${toBn(selectedSurah.totalAyahs)}টি আয়াত)।`
                    : `Currently showing ${selectedSurah.ayahs.length} ayahs of total ${selectedSurah.totalAyahs}.`}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {lang === 'bn'
                    ? 'সম্পূর্ণ ১ থেকে শেষ পর্যন্ত সকল আয়াত আরবি ও বাংলা অনুবাদসহ লোড করতে নিচের বাটনে চাপ দিন:'
                    : 'Load all ayahs online with Arabic script and Bengali translation:'}
                </p>
              </div>
              <button
                onClick={handleFetchFullSurahOnline}
                disabled={isLoadingOnline}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition disabled:opacity-50 shrink-0"
              >
                {isLoadingOnline ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সকল আয়াত লোড করুন' : 'Load All Ayahs'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success or info message */}
          {onlineFetchSuccess && (
            <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in shadow-xs">
              {onlineFetchSuccess}
            </div>
          )}

          {/* Ayahs List */}
          <div className="space-y-3.5">
            {selectedSurah.ayahs && selectedSurah.ayahs.length > 0 ? (
              selectedSurah.ayahs.map((ayah) => (
                <div
                  key={ayah.ayahNumber}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                >
                  {/* Ayah Number Badge & Copy */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                        {toBn(ayah.ayahNumber)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {lang === 'bn' ? `আয়াত #${toBn(ayah.ayahNumber)}` : `Ayah #${ayah.ayahNumber}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyAyah(ayah.arabic, ayah.bangla, ayah.ayahNumber)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                      title={lang === 'bn' ? 'আয়াত কপি করুন' : 'Copy Ayah'}
                    >
                      {copiedAyah === ayah.ayahNumber ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Arabic Text */}
                  <div className="text-right">
                    <p
                      dir="rtl"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
                      className="font-arabic font-bold text-slate-900 dark:text-emerald-50 tracking-wide select-text"
                    >
                      {ayah.arabic}
                      <span className="inline-block mx-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        ۝{toBn(ayah.ayahNumber)}
                      </span>
                    </p>
                  </div>

                  {/* Pronunciation (Bangla) with Tajweed Highlights */}
                  {ayah.pronunciation && (
                    <div className="text-xs text-slate-800 dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl leading-relaxed border border-emerald-100/60 dark:border-emerald-900/30">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <span>{lang === 'bn' ? 'উচ্চারণ (টান ও তাজবীদ সহ):' : 'Pronunciation (Tajweed Marked):'}</span>
                        </strong>
                        <button
                          onClick={() => setShowTajweedModal(true)}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                        >
                          {lang === 'bn' ? 'টানের নিয়ম দেখুন' : 'Tajweed Help'}
                        </button>
                      </div>
                      <div className="font-sans text-xs sm:text-sm">
                        {renderTajweedBengaliText(ayah.pronunciation, enableTajweedHighlight)}
                      </div>
                    </div>
                  )}

                  {/* Bangla Translation */}
                  <p className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-100 font-bold block mb-0.5">
                      {lang === 'bn' ? 'অর্থ ও অনুবাদ:' : 'Translation:'}
                    </strong>
                    {ayah.bangla}
                  </p>

                  {ayah.tafsir && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      <span className="font-semibold block">{lang === 'bn' ? 'তাফসীর ও ব্যাখ্যা:' : 'Tafsir:'}</span>
                      {ayah.tafsir}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900">
                <p className="text-xs">
                  {lang === 'bn'
                    ? 'এই সূরার আয়াতসমূহ এডমিন প্যানেল থেকে যুক্ত করতে পারবেন বা অনলাইনে লোড করতে পারেন।'
                    : 'Ayahs for this surah can be added in the Admin Panel or fetched online.'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Next/Prev Surah Navigator */}
          <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <button
              onClick={() => {
                const curIdx = surahs.findIndex((s) => s.id === selectedSurah.id);
                if (curIdx > 0) setSelectedSurah(surahs[curIdx - 1]);
              }}
              disabled={surahs.findIndex((s) => s.id === selectedSurah.id) <= 0}
              className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 active:scale-95 transition"
            >
              ← {lang === 'bn' ? 'পূর্ববর্তী সূরা' : 'Previous'}
            </button>

            <button
              onClick={() => setSelectedSurah(null)}
              className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
            >
              {lang === 'bn' ? '১১৪ সূরার সূচিপত্র' : 'All 114 Index'}
            </button>

            <button
              onClick={() => {
                const curIdx = surahs.findIndex((s) => s.id === selectedSurah.id);
                if (curIdx < surahs.length - 1) setSelectedSurah(surahs[curIdx + 1]);
              }}
              disabled={surahs.findIndex((s) => s.id === selectedSurah.id) >= surahs.length - 1}
              className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 active:scale-95 transition"
            >
              {lang === 'bn' ? 'পরবর্তী সূরা' : 'Next'} →
            </button>
          </div>
        </div>
      ) : (
        /* Surahs Directory View */
        <div className="space-y-4">
          {/* Quran Header Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-800 via-emerald-800 to-green-950 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  {lang === 'bn' ? 'পবিত্র কুরআনুল কারীম' : 'Holy Quran Reader'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  {lang === 'bn' ? '১১৪টি সম্পূর্ণ সূরা সমগ্র' : 'All 114 Surahs'}
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {lang === 'bn'
                    ? 'আরবি হরফ, সহীহ তাজবীদ টান, সহজ বাংলা অর্থ ও অফলাইন সুবিধা'
                    : 'Arabic text, Tajweed pronunciation & Bengali translation'}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Quick info badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-emerald-100">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold">
                {toBn(surahs.length)} {lang === 'bn' ? 'টি পবিত্র সূরা' : 'Surahs'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 font-bold">
                {lang === 'bn' ? '৩০ পারা' : '30 Juz'}
              </span>
              <button
                onClick={() => setShowTajweedModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-900 font-bold hover:bg-amber-300 transition flex items-center gap-1 shadow-xs"
              >
                <span>📖 টানের তাজবীদ নিয়ম</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  lang === 'bn'
                    ? 'সূরার নাম (যেমন: ফাতিহা, ইখলাস, মুলক, ইয়াসিন) বা নম্বর (১-১১৪)...'
                    : 'Search surah by name or number (1-114)...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            {/* Filter categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  filterType === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? `সব সূরা (${toBn(surahs.length)})` : `All (${surahs.length})`}
              </button>
              <button
                onClick={() => setFilterType('মাক্কী')}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  filterType === 'মাক্কী'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? 'মাক্কী সূরা (৮৬টি)' : 'Meccan (86)'}
              </button>
              <button
                onClick={() => setFilterType('মাদানী')}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  filterType === 'মাদানী'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? 'মাদানী সূরা (২৮টি)' : 'Medinan (28)'}
              </button>
              <button
                onClick={() => setFilterType('juz')}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  filterType === 'juz'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? 'পারা অনুযায়ী (১-৩০)' : 'By Juz (1-30)'}
              </button>
            </div>

            {/* Juz Dropdown Selector if filterType === 'juz' */}
            {filterType === 'juz' && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'পারা নির্বাচন করুন:' : 'Select Juz:'}
                </span>
                <select
                  value={selectedJuz}
                  onChange={(e) => setSelectedJuz(Number(e.target.value))}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-hidden"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                    <option key={juz} value={juz}>
                      {lang === 'bn' ? `${toBn(juz)} নং পারা` : `Juz ${juz}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Surahs Count status */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              {lang === 'bn'
                ? `প্রদর্শিত হচ্ছে ${toBn(filteredSurahs.length)}টি সূরা`
                : `Showing ${filteredSurahs.length} surahs`}
            </span>
          </div>

          {/* Surahs Grid / Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredSurahs.map((surah) => {
              const isBookmarked = bookmarkedSurahId === surah.id;
              return (
                <div
                  key={surah.id}
                  onClick={() => setSelectedSurah(surah)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs cursor-pointer active:scale-98 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:bg-emerald-600 group-hover:text-white transition">
                      {toBn(surah.surahNumber)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {lang === 'bn' ? surah.nameBn : surah.nameEn}
                        </span>
                        {isBookmarked && (
                          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {surah.meaningBn} • {toBn(surah.totalAyahs)} {lang === 'bn' ? 'আয়াত' : 'ayahs'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="font-arabic font-bold text-base text-emerald-700 dark:text-emerald-300 block">
                      {surah.nameAr}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {surah.revelationType}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSurahs.length === 0 && (
            <div className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                {lang === 'bn' ? 'কোনো সূরা খুঁজে পাওয়া যায়নি।' : 'No surahs matched your search.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
