import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Heart,
  Bookmark,
  Share2,
  Copy,
  Check,
  ChevronRight,
  PhoneCall,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Apple,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Language, HealthAudience, HealthTipItem } from '../../types';
import { HEALTH_TIPS_DATA } from '../../data/healthTipsData';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
  onOpenBmi?: () => void;
}

export const HealthTipsView: React.FC<Props> = ({ lang, onOpenBmi }) => {
  const [selectedCategory, setSelectedCategory] = useState<HealthAudience | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<HealthTipItem | null>(null);
  const [savedTips, setSavedTips] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sut_saved_health_tips');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [onlySaved, setOnlySaved] = useState<boolean>(false);

  // Toggle Save / Bookmark
  const toggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedTips((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('sut_saved_health_tips', JSON.stringify(next));
      } catch (err) {
        console.warn('Storage save error:', err);
      }
      return next;
    });
  };

  // Filtered List
  const filteredTips = useMemo(() => {
    return HEALTH_TIPS_DATA.filter((item) => {
      if (onlySaved && !savedTips.includes(item.id)) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle =
        item.titleBn.toLowerCase().includes(q) || item.titleEn.toLowerCase().includes(q);
      const matchSummary =
        item.summaryBn.toLowerCase().includes(q) || item.summaryEn.toLowerCase().includes(q);
      const matchFoods = item.detailsBn.nutritions?.some((f) => f.toLowerCase().includes(q));

      return matchTitle || matchSummary || matchFoods;
    });
  }, [selectedCategory, searchQuery, onlySaved, savedTips]);

  // Copy Tip content
  const handleCopyTip = async (tip: HealthTipItem) => {
    const text = `💡 ${tip.titleBn}
----------------------------------
${tip.detailsBn.description}

✅ যা যা করবেন:
${tip.detailsBn.dos.map((d) => `• ${d}`).join('\n')}

❌ যা এড়িয়ে চলবেন:
${tip.detailsBn.donts.map((d) => `• ${d}`).join('\n')}

🍎 উপকারী খাবার:
${tip.detailsBn.nutritions?.join(', ') || 'সুষম পুষ্টিকর খাদ্য'}

⚠️ সতর্কবার্তা: ${tip.detailsBn.whenToSeeDoctor || 'প্রয়োজনে চিকিৎসকের পরামর্শ নিন।'}
----------------------------------
শেয়ার্ড ফ্রম: স্মার্ট ইউটিলিটি টুলস`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Category Tabs Configuration
  const categories: { id: HealthAudience | 'all'; labelBn: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelBn: 'সবগুলো', labelEn: 'All Tips', icon: '🌟' },
    { id: 'child', labelBn: 'শিশু ও বাচ্চা', labelEn: 'Children & Babies', icon: '👶' },
    { id: 'elderly', labelBn: 'বয়স্ক মানুষ', labelEn: 'Elderly & Seniors', icon: '👴' },
    { id: 'general', labelBn: 'সাধারণ মানুষ', labelEn: 'General Adults', icon: '🧍' },
    { id: 'women', labelBn: 'নারী ও মা', labelEn: 'Women & Maternity', icon: '👩' },
    { id: 'firstaid', labelBn: 'প্রাথমিক চিকিৎসা', labelEn: 'First Aid', icon: '🩹' },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full select-none pb-8">
      {/* Search Bar & Bookmark Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'টিপস খুঁজুন (যেমন: শিশুর সর্দি, প্রেসার, গ্যাস্ট্রিক)...'
                : 'Search health tips (e.g. child fever, BP, acidity)...'
            }
            className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B63F6] shadow-2xs"
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

        {/* Bookmark Filter Button */}
        <button
          onClick={() => setOnlySaved(!onlySaved)}
          className={`h-11 px-3.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition shadow-2xs ${
            onlySaved
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
          title="বুকমার্ক করা টিপস"
        >
          <Bookmark className={`w-4 h-4 ${onlySaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="hidden sm:inline">{lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}</span>
          {savedTips.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {savedTips.length}
            </span>
          )}
        </button>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id && !onlySaved;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setOnlySaved(false);
                setSelectedCategory(cat.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{lang === 'bn' ? cat.labelBn : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Emergency Helpline Banner Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-700 text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs block leading-tight">
              {lang === 'bn' ? 'জরুরি স্বাস্থ্য হেল্পলাইন (১৬২৬৩)' : 'Emergency Health Hotline'}
            </span>
            <span className="text-[10px] text-emerald-100 block mt-0.5">
              {lang === 'bn' ? '২৪ ঘণ্টা সরকারি স্বাস্থ্য বাতায়নে বিনামূল্যে চিকিৎসকের পরামর্শ' : '24/7 Free medical advice'}
            </span>
          </div>
        </div>
        <a
          href="tel:16263"
          className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs shrink-0 shadow-xs active:scale-95 transition"
        >
          {lang === 'bn' ? 'কল করুন' : 'Call'}
        </a>
      </div>

      {/* Tips Cards Grid */}
      {filteredTips.length === 0 ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {lang === 'bn' ? 'কোনো টিপস পাওয়া যায়নি' : 'No health tips found'}
          </span>
          <span className="text-xs text-slate-400 max-w-xs">
            {lang === 'bn'
              ? 'অন্য কোনো শব্দ লিখে খুঁজুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।'
              : 'Try searching with different terms or reset your category filters.'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredTips.map((tip) => {
            const isSaved = savedTips.includes(tip.id);
            return (
              <div
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col group active:scale-99"
              >
                {/* Photo Header */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={tip.image}
                    alt={tip.titleBn}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback gradient if offline
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleSave(tip.id, e)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-500 shadow-xs transition active:scale-90"
                    title="সংরক্ষণ করুন"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>

                  {/* Category and Read Time Metadata (Zero-pill clean text) */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-medium">
                    <span className="font-semibold text-white truncate">
                      {tip.category === 'child'
                        ? 'শিশু ও বাচ্চা'
                        : tip.category === 'elderly'
                        ? 'বয়স্ক মানুষ'
                        : tip.category === 'women'
                        ? 'নারী ও মা'
                        : tip.category === 'firstaid'
                        ? 'প্রাথমিক চিকিৎসা'
                        : 'সাধারণ স্বাস্থ্য'}
                    </span>
                    <span className="flex items-center gap-1 text-white/80 shrink-0 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{lang === 'bn' ? tip.readTimeBn : tip.readTimeEn}</span>
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-[#0B63F6] transition line-clamp-2">
                      {lang === 'bn' ? tip.titleBn : tip.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {lang === 'bn' ? tip.summaryBn : tip.summaryEn}
                    </p>
                  </div>

                  {/* Action Link Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B63F6] dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      <span>{lang === 'bn' ? 'বিস্তারিত গাইড পড়ুন' : 'Read Full Guide'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          DETAILED GUIDE MODAL (ছবি সহ বিস্তারিত তথ্য ও করণীয়-বর্জনীয়)
         ========================================================================= */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Photo */}
            <div className="relative h-48 sm:h-56 w-full shrink-0 bg-slate-900">
              <img
                src={selectedTip.image}
                alt={selectedTip.titleBn}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedTip(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Category & Title on Header */}
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[11px] font-semibold text-emerald-300 block mb-1">
                  {selectedTip.category === 'child'
                    ? 'শিশু ও বাচ্চার স্বাস্থ্য গাইড'
                    : selectedTip.category === 'elderly'
                    ? 'প্রবীণ ও বয়স্কদের স্বাস্থ্য যত্ন'
                    : selectedTip.category === 'women'
                    ? 'নারী ও মাতৃত্বকালীন স্বাস্থ্য'
                    : selectedTip.category === 'firstaid'
                    ? 'জরুরি প্রাথমিক চিকিৎসা'
                    : 'দৈনন্দিন স্বাস্থ্য ও ফিটনেস'}
                </span>
                <h2 className="text-base sm:text-lg font-black leading-snug drop-shadow-sm">
                  {lang === 'bn' ? selectedTip.titleBn : selectedTip.titleEn}
                </h2>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 text-slate-800 dark:text-slate-200">
              {/* Full Description */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? selectedTip.detailsBn.description : selectedTip.detailsEn.description}
              </div>

              {/* Do's (যা যা করণীয়) */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যা যা করবেন (করণীয়):' : 'Key Recommendations (Do’s):'}</span>
                </h4>
                <div className="flex flex-col gap-1.5">
                  {(lang === 'bn' ? selectedTip.detailsBn.dos : selectedTip.detailsEn.dos).map(
                    (item, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                      >
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Don'ts (যা যা এড়িয়ে চলবেন) */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <XCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যা যা এড়িয়ে চলবেন (বর্জনীয়):' : 'Things to Avoid (Don’ts):'}</span>
                </h4>
                <div className="flex flex-col gap-1.5">
                  {(lang === 'bn' ? selectedTip.detailsBn.donts : selectedTip.detailsEn.donts).map(
                    (item, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                      >
                        <span className="text-rose-500 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Recommended Nutritious Foods */}
              {selectedTip.detailsBn.nutritions && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{lang === 'bn' ? 'উপকারী পুষ্টিকর খাবারসমূহ:' : 'Beneficial Foods & Nutrition:'}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(lang === 'bn' ? selectedTip.detailsBn.nutritions : selectedTip.detailsEn.nutritions)?.map(
                      (food, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          {food}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* When to see a doctor Warning Box */}
              {selectedTip.detailsBn.whenToSeeDoctor && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">
                      {lang === 'bn' ? 'কখন জরুরি ভিত্তিতে ডাক্তার দেখাবেন:' : 'When to Seek Urgent Medical Care:'}
                    </span>
                    <span className="leading-relaxed">
                      {lang === 'bn' ? selectedTip.detailsBn.whenToSeeDoctor : selectedTip.detailsEn.whenToSeeDoctor}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2">
              <button
                onClick={() => handleCopyTip(selectedTip)}
                className="flex-1 h-11 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'টিপস কপি হয়েছে!' : 'টিপস কপি ও শেয়ার'}</span>
              </button>

              <button
                onClick={() => toggleSave(selectedTip.id)}
                className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition shadow-xs ${
                  savedTips.includes(selectedTip.id)
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${savedTips.includes(selectedTip.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                />
                <span>{savedTips.includes(selectedTip.id) ? 'সংরক্ষিত' : 'বুকমার্ক'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
