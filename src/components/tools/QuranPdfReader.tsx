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
} from 'lucide-react';
import { Language } from '../../types';
import { QuranSurah, getStoredSurahs } from '../../utils/quranStorage';

interface Props {
  lang: Language;
}

export const QuranPdfReader: React.FC<Props> = ({ lang }) => {
  const [surahs, setSurahs] = useState<QuranSurah[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'মাক্কী' | 'মাদানী'>('all');
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<number>(22); // Arabic font size
  const [bookmarkedSurahId, setBookmarkedSurahId] = useState<string | null>(() => {
    return localStorage.getItem('smart_quran_bookmark_surah') || null;
  });

  useEffect(() => {
    const list = getStoredSurahs();
    setSurahs(list);
  }, []);

  const handleCopyAyah = (arabic: string, bangla: string, num: number) => {
    const text = `${arabic}\n${bangla} (সূরা ${selectedSurah?.nameBn}, আয়াত: ${num})`;
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

  const filteredSurahs = surahs.filter((s) => {
    const matchesSearch =
      s.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameAr.includes(searchQuery) ||
      String(s.surahNumber).includes(searchQuery);

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && s.revelationType === filterType;
  });

  // Convert number to Bengali
  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  // If a Surah is selected for reading
  if (selectedSurah) {
    const isBookmarked = bookmarkedSurahId === selectedSurah.id;

    return (
      <div className="space-y-4">
        {/* Navigation & Controls Top Bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <button
            onClick={() => setSelectedSurah(null)}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সকল সূরা' : 'All Surahs'}</span>
          </button>

          <div className="text-center min-w-0 px-2">
            <h2 className="text-sm font-bold truncate text-slate-900 dark:text-white">
              {lang === 'bn' ? selectedSurah.nameBn : selectedSurah.nameEn}
            </h2>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {selectedSurah.nameAr} • {toBn(selectedSurah.totalAyahs)} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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
                isBookmarked
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Surah Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 text-white text-center shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white inline-block mb-2">
              {toBn(selectedSurah.surahNumber)}. {selectedSurah.revelationType} • {toBn(selectedSurah.totalAyahs)}{' '}
              {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
            </span>
            <h1 className="text-3xl font-black font-arabic tracking-wide mt-1 mb-2">
              {selectedSurah.nameAr}
            </h1>
            <p className="text-base font-bold text-emerald-100">
              {lang === 'bn' ? selectedSurah.nameBn : selectedSurah.nameEn}
            </p>
            <p className="text-xs text-emerald-200 mt-0.5">
              {lang === 'bn' ? `অর্থ: ${selectedSurah.meaningBn}` : `Meaning: ${selectedSurah.meaningBn}`}
            </p>

            {/* Bismillah (Except Surah 9) */}
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
                    <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
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
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                    className="font-arabic font-bold text-slate-900 dark:text-emerald-50 tracking-wide select-text"
                  >
                    {ayah.arabic}
                    <span className="inline-block mx-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      ۝{toBn(ayah.ayahNumber)}
                    </span>
                  </p>
                </div>

                {/* Pronunciation (Bangla) */}
                {ayah.pronunciation && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl leading-relaxed">
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                      {lang === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
                    </strong>
                    {ayah.pronunciation}
                  </p>
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
                  ? 'এই সূরার আয়াতসমূহ এডমিন প্যানেল থেকে যুক্ত করতে পারবেন।'
                  : 'Ayahs for this surah can be added in the Admin Panel.'}
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
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
          >
            ← {lang === 'bn' ? 'পূর্ববর্তী সূরা' : 'Previous Surah'}
          </button>

          <button
            onClick={() => setSelectedSurah(null)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            {lang === 'bn' ? 'সূচিপত্র' : 'Index'}
          </button>

          <button
            onClick={() => {
              const curIdx = surahs.findIndex((s) => s.id === selectedSurah.id);
              if (curIdx < surahs.length - 1) setSelectedSurah(surahs[curIdx + 1]);
            }}
            disabled={surahs.findIndex((s) => s.id === selectedSurah.id) >= surahs.length - 1}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
          >
            {lang === 'bn' ? 'পরবর্তী সূরা' : 'Next Surah'} →
          </button>
        </div>
      </div>
    );
  }

  // Surahs Directory View
  return (
    <div className="space-y-4">
      {/* Quran Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-800 to-green-900 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              {lang === 'bn' ? 'পবিত্র কুরআনুল কারীম' : 'Holy Quran Reader'}
            </span>
            <h2 className="text-xl font-black mt-1">
              {lang === 'bn' ? 'সূরা ও আয়াত সমগ্র' : 'Surahs & Verses'}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {lang === 'bn'
                ? 'আরবি পাঠ, উচ্চারণ ও সহজ বাংলা অর্থসহ'
                : 'Arabic text, pronunciation & Bengali translation'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center gap-2 mt-4 text-[11px] text-emerald-100">
          <span className="px-2 py-0.5 rounded-md bg-white/10">
            {toBn(surahs.length)} {lang === 'bn' ? 'টি সংরক্ষিত সূরা' : 'Surahs'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10">
            {lang === 'bn' ? '১০০% অফলাইন সুবিধা' : '100% Offline'}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              lang === 'bn'
                ? 'সূরার নাম (যেমন: ফাতিহা, ইখলাস) বা নম্বর লিখুন...'
                : 'Search surah by name or number...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'সকল সূরা' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('মাক্কী')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              filterType === 'মাক্কী'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'মাক্কী সূরা' : 'Meccan'}
          </button>
          <button
            onClick={() => setFilterType('মাদানী')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
              filterType === 'মাদানী'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'মাদানী সূরা' : 'Medinan'}
          </button>
        </div>
      </div>

      {/* Surahs Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredSurahs.map((surah) => {
          const isBookmarked = bookmarkedSurahId === surah.id;
          return (
            <div
              key={surah.id}
              onClick={() => setSelectedSurah(surah)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs cursor-pointer active:scale-98 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
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
  );
};
