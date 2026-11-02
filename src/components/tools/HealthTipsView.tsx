import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
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
  Clock,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  History,
  Trash2,
  Flame,
  ShieldCheck,
  Calendar,
  ExternalLink,
  BookOpen,
  Filter,
  Layers,
  HeartHandshake,
  Stethoscope,
  Activity,
  Award,
} from 'lucide-react';
import { HealthTipItem, HealthCategory, HealthCategoryItem, Language } from '../../types';
import {
  DEFAULT_HEALTH_CATEGORIES,
  getStoredHealthCategories,
  getHealthLanguage,
  setHealthLanguage,
  getHealthFontSize,
  setHealthFontSize,
  HealthFontSize,
  getStoredHealthTips,
  getSavedHealthTipIds,
  toggleSaveHealthTip,
  getHealthReadingHistory,
  addHealthReadingHistory,
  clearHealthReadingHistory,
  speakHealthArticle,
  stopSpeakingArticle,
  isSpeechSupported,
  ReadingHistoryItem,
  fetchHealthTipsFromFirestore,
  fetchHealthCategoriesFromFirestore,
} from '../../utils/healthStorage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang?: Language;
  onOpenBmi?: () => void;
  onRegisterBackAction?: (handler: (() => boolean) | null) => void;
}

export const HealthTipsView: React.FC<Props> = ({ onOpenBmi, onRegisterBackAction }) => {
  // 1. Language state: default Bengali, isolated to Health Tips section
  const [healthLang, setHealthLangState] = useState<'bn' | 'en'>(getHealthLanguage());

  const handleLangChange = (newLang: 'bn' | 'en') => {
    setHealthLangState(newLang);
    setHealthLanguage(newLang);
    stopSpeakingArticle();
    setIsSpeaking(false);
  };

  const isBn = healthLang === 'bn';

  // 2. Data state
  const [tips, setTips] = useState<HealthTipItem[]>(getStoredHealthTips());
  const [categories, setCategories] = useState<HealthCategoryItem[]>(getStoredHealthCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<HealthTipItem | null>(null);
  const [savedTips, setSavedTips] = useState<string[]>(getSavedHealthTipIds());
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<ReadingHistoryItem[]>(getHealthReadingHistory());

  // 3. UI Helpers: Font size & TTS
  const [fontSize, setFontSizeState] = useState<HealthFontSize>(getHealthFontSize());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Sync from Firestore if available
  useEffect(() => {
    fetchHealthCategoriesFromFirestore().then((cloudCats) => {
      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
      }
    });
    fetchHealthTipsFromFirestore().then((cloudTips) => {
      if (cloudTips && cloudTips.length > 0) {
        setTips(cloudTips);
      }
    });
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeakingArticle();
    };
  }, []);

  const handleFontSizeChange = (size: HealthFontSize) => {
    setFontSizeState(size);
    setHealthFontSize(size);
  };

  const getFontSizeClass = (size: HealthFontSize) => {
    switch (size) {
      case 'large':
        return 'text-base sm:text-lg leading-relaxed';
      case 'huge':
        return 'text-lg sm:text-xl leading-loose';
      default:
        return 'text-sm sm:text-base leading-normal';
    }
  };

  // Toggle Save / Bookmark
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = toggleSaveHealthTip(id);
    setSavedTips(updated);
  };

  // Close Article Modal
  const closeArticle = () => {
    stopSpeakingArticle();
    setIsSpeaking(false);
    setSelectedTip(null);
  };

  // Hierarchical back action registration for Android back button and top app back button
  useEffect(() => {
    if (!onRegisterBackAction) return;

    onRegisterBackAction(() => {
      // Step 1: If an article is open, close article modal so user is back in the list to read the next tip!
      if (selectedTip) {
        closeArticle();
        return true; // handled
      }
      // Step 2: If history modal is open, close it
      if (showHistoryModal) {
        setShowHistoryModal(false);
        return true; // handled
      }
      // Step 3: If filtered by category or search, reset back to all categories
      if (selectedCategory !== 'all' || searchQuery !== '' || onlySaved) {
        setSelectedCategory('all');
        setSearchQuery('');
        setOnlySaved(false);
        return true; // handled
      }
      // Step 4: Nothing inside HealthTipsView, let main App handle back (close tool)
      return false;
    });

    return () => {
      onRegisterBackAction(null);
    };
  }, [selectedTip, showHistoryModal, selectedCategory, searchQuery, onlySaved, onRegisterBackAction]);

  // Open Article Detail & Record History
  const handleOpenArticle = (tip: HealthTipItem) => {
    setSelectedTip(tip);
    addHealthReadingHistory(tip);
    setHistoryList(getHealthReadingHistory());
  };

  // TTS Reader
  const handleToggleTTS = (tip: HealthTipItem) => {
    if (isSpeaking) {
      stopSpeakingArticle();
      setIsSpeaking(false);
      return;
    }

    const title = isBn ? tip.titleBn : tip.titleEn;
    const desc = isBn ? tip.detailsBn?.description : tip.detailsEn?.description;
    const dos = isBn ? tip.detailsBn?.dos?.join('. ') : tip.detailsEn?.dos?.join('. ');
    const warning = isBn ? tip.detailsBn?.warning : tip.detailsEn?.warning;

    if (!title && !desc) return;

    const fullScript = `${title}. ${desc || ''}. ${
      dos ? (isBn ? 'সুপারিশসমূহ: ' : 'Recommendations: ') + dos : ''
    }. ${warning ? (isBn ? 'সতর্কবার্তা: ' : 'Warning: ') + warning : ''}`;

    setIsSpeaking(true);
    const success = speakHealthArticle(
      fullScript,
      healthLang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );

    if (!success) {
      setIsSpeaking(false);
    }
  };

  // Share Article
  const handleShareArticle = async (tip: HealthTipItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const title = isBn ? tip.titleBn : tip.titleEn;
    const summary = isBn ? tip.summaryBn : tip.summaryEn;
    const sourceName = tip.sourceName || tip.source || (isBn ? 'বিশ্ব স্বাস্থ্য সংস্থা (WHO)' : 'WHO');
    const shareText = `🏥 ${title}
-------------------------------------
${summary}

📖 ${isBn ? 'বিস্তারিত পড়ুন SmartHub হেলথ গাইডে' : 'Read more on SmartHub Health Guide'}
⚕️ ${isBn ? 'তথ্যসূত্র' : 'Source'}: ${sourceName}
⚠️ ${isBn ? 'মেডিকেল পরামর্শের বিকল্প নয়।' : 'Educational only. Consult a doctor for medical emergencies.'}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    const ok = await copyToClipboard(shareText);
    if (ok) {
      setShareToast(isBn ? 'লিঙ্ক ও তথ্য কপি হয়েছে!' : 'Article copied to clipboard!');
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  // Copy Full Article in Modal
  const handleCopyModal = async (tip: HealthTipItem) => {
    const title = isBn ? tip.titleBn : tip.titleEn;
    const desc = isBn ? tip.detailsBn?.description : tip.detailsEn?.description;
    const dos = isBn ? tip.detailsBn?.dos : tip.detailsEn?.dos;
    const warning = isBn ? tip.detailsBn?.warning : tip.detailsEn?.warning;
    const source = tip.sourceName || tip.source || 'WHO / DGHS';

    const text = `💡 ${title}
----------------------------------
${desc || ''}

${dos && dos.length > 0 ? (isBn ? '✅ যা যা করবেন:' : '✅ Recommendations:') + '\n' + dos.map((d) => `• ${d}`).join('\n') : ''}

${warning ? (isBn ? '⚠️ সতর্কবার্তা:' : '⚠️ Warning:') + ' ' + warning : ''}
----------------------------------
${isBn ? 'উৎস' : 'Source'}: ${source}
SmartHub – All-in-One Tools`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Active articles (filter out unpublished)
  const activeTips = useMemo(() => {
    return tips.filter((t) => t.isPublished !== false);
  }, [tips]);

  // Featured Articles
  const featuredTips = useMemo(() => {
    const explicit = activeTips.filter((t) => t.isFeatured);
    return explicit.length > 0 ? explicit : activeTips.slice(0, 3);
  }, [activeTips]);

  // Today's Tip (Deterministic daily rotation)
  const todaysTip = useMemo(() => {
    if (activeTips.length === 0) return null;
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return activeTips[dayOfYear % activeTips.length];
  }, [activeTips]);

  // Popular Health Tips
  const popularTips = useMemo(() => {
    const popular = activeTips.filter((t) => t.isPopular);
    return popular.length > 0 ? popular : activeTips.slice(0, 4);
  }, [activeTips]);

  // Latest Articles
  const latestTips = useMemo(() => {
    return [...activeTips].reverse().slice(0, 4);
  }, [activeTips]);

  // Recommended Articles
  const recommendedTips = useMemo(() => {
    return activeTips.filter((t) => !t.isFeatured).slice(0, 4);
  }, [activeTips]);

  // Filtered List based on category, search, bookmark
  const filteredTips = useMemo(() => {
    return activeTips.filter((item) => {
      if (onlySaved && !savedTips.includes(item.id)) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle =
        (item.titleBn && item.titleBn.toLowerCase().includes(q)) ||
        (item.titleEn && item.titleEn.toLowerCase().includes(q));
      const matchSummary =
        (item.summaryBn && item.summaryBn.toLowerCase().includes(q)) ||
        (item.summaryEn && item.summaryEn.toLowerCase().includes(q));
      const matchDesc =
        (item.detailsBn?.description && item.detailsBn.description.toLowerCase().includes(q)) ||
        (item.detailsEn?.description && item.detailsEn.description.toLowerCase().includes(q));
      const matchNutr =
        item.detailsBn?.nutritions?.some((n) => n.toLowerCase().includes(q)) ||
        item.detailsEn?.nutritions?.some((n) => n.toLowerCase().includes(q));
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));

      return matchTitle || matchSummary || matchDesc || matchNutr || matchKeywords;
    });
  }, [activeTips, selectedCategory, searchQuery, onlySaved, savedTips]);

  // Helper for category label
  const getCategoryLabel = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    if (!found) return { icon: '🩺', name: isBn ? 'স্বাস্থ্য' : 'Health' };
    return {
      icon: found.icon,
      name: isBn ? found.nameBn : found.nameEn,
    };
  };

  // Related articles for currently selected tip
  const relatedTips = useMemo(() => {
    if (!selectedTip) return [];
    return activeTips
      .filter((t) => t.id !== selectedTip.id && t.category === selectedTip.category)
      .slice(0, 3);
  }, [selectedTip, activeTips]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full select-none pb-16 bg-[#071B35] text-white p-3 sm:p-5 rounded-3xl min-h-screen">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#153D55] text-[#69DCC0] border border-[#69DCC0]/40 text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-[#69DCC0]" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* =========================================================================
          PAGE HIERARCHY ITEM 1: HEALTH TIPS HEADER
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[#112B48] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#112B48] border border-[#69DCC0]/30 flex items-center justify-center text-[#69DCC0] shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {isBn ? 'স্বাস্থ্য টিপস ও গাইডলাইন' : 'Health Tips & Guidelines'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#153D55] text-[#69DCC0] border border-[#69DCC0]/30">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Quick controls: History, Font Size, Emergency Call */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-[#112B48] border border-[#153D55] rounded-xl p-0.5">
            <button
              onClick={() => handleFontSizeChange('normal')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                fontSize === 'normal'
                  ? 'bg-[#153D55] text-[#69DCC0]'
                  : 'text-[#8FA9C4] hover:text-white'
              }`}
              title={isBn ? 'সাধারণ ফন্ট' : 'Normal font'}
            >
              A
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                fontSize === 'large'
                  ? 'bg-[#153D55] text-[#69DCC0]'
                  : 'text-[#8FA9C4] hover:text-white'
              }`}
              title={isBn ? 'বড় ফন্ট' : 'Large font'}
            >
              A+
            </button>
          </div>

          {/* Reading History */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 rounded-xl bg-[#112B48] border border-[#153D55] text-[#8FA9C4] hover:text-white transition relative"
            title={isBn ? 'পড়ার ইতিহাস' : 'Reading history'}
          >
            <History className="w-4 h-4" />
            {historyList.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#69DCC0]" />
            )}
          </button>

          {/* Emergency Hotline 16263 */}
          <a
            href="tel:16263"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-bold transition shadow-xs"
            title={isBn ? 'স্বাস্থ্য বাতায়ন ১৬২৬৩' : 'Health Helpline 16263'}
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">{isBn ? 'জরুরি ১৬২৬৩' : '16263'}</span>
            <span className="sm:hidden">16263</span>
          </a>
        </div>
      </div>

      {/* =========================================================================
          PAGE HIERARCHY ITEM 2: BENGALI / ENGLISH LANGUAGE SWITCHER
          ========================================================================= */}
      <div className="flex items-center justify-between bg-[#112B48] border border-[#153D55] p-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8FA9C4]">
            {isBn ? 'ভাষা নির্বাচন:' : 'Language:'}
          </span>
          <div className="flex items-center bg-[#071B35] p-1 rounded-xl border border-[#153D55]">
            <button
              onClick={() => handleLangChange('bn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isBn
                  ? 'bg-[#69DCC0] text-[#071B35] shadow-sm'
                  : 'text-[#8FA9C4] hover:text-white'
              }`}
            >
              <span>🇧🇩</span>
              <span>বাংলা</span>
            </button>
            <button
              onClick={() => handleLangChange('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                !isBn
                  ? 'bg-[#69DCC0] text-[#071B35] shadow-sm'
                  : 'text-[#8FA9C4] hover:text-white'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* BMI Calculator quick jump if provided */}
        {onOpenBmi && (
          <button
            onClick={onOpenBmi}
            className="text-xs font-bold text-[#69DCC0] hover:underline flex items-center gap-1"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isBn ? 'BMI ক্যালকুলেটর' : 'BMI Tool'}</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          PAGE HIERARCHY ITEM 3: SHORT SUBTITLE
          ========================================================================= */}
      <div className="px-1">
        <p className="text-xs sm:text-sm text-[#8FA9C4] leading-relaxed">
          {isBn
            ? 'নির্ভরযোগ্য চিকিৎসা বিজ্ঞান, বিশ্ব স্বাস্থ্য সংস্থা (WHO) ও জনস্বাস্থ্য নির্দেশিকা ভিত্তিক প্রতিদিনের সুস্থ জীবনযাপনের পরামর্শ।'
            : 'Evidence-based clinical guidelines, WHO wellness practices, and verified preventative healthcare tips for your daily life.'}
        </p>
      </div>

      {/* =========================================================================
          PAGE HIERARCHY ITEM 4: ROUNDED SEARCH BAR
          ========================================================================= */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA9C4]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBn
                ? 'পরামর্শ খুঁজুন (যেমন: পুষ্টি, উচ্চ রক্তচাপ, ডেঙ্গু, পোড়া, ঘুম)...'
                : 'Search health topics (e.g. nutrition, hypertension, dengue, burns)...'
            }
            className="w-full h-12 bg-[#112B48] border border-[#153D55] rounded-full pl-11 pr-10 text-xs sm:text-sm font-medium text-white placeholder:text-[#8FA9C4] focus:outline-none focus:border-[#69DCC0] focus:ring-1 focus:ring-[#69DCC0] shadow-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8FA9C4] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bookmark Filter Button */}
        <button
          onClick={() => setOnlySaved(!onlySaved)}
          className={`h-12 px-4 rounded-full border flex items-center gap-1.5 text-xs font-bold transition shadow-sm shrink-0 ${
            onlySaved
              ? 'bg-[#69DCC0] border-[#69DCC0] text-[#071B35]'
              : 'bg-[#112B48] border-[#153D55] text-[#8FA9C4] hover:text-white'
          }`}
          title={isBn ? 'সংরক্ষিত পরামর্শ' : 'Bookmarked tips'}
        >
          <Bookmark className={`w-4 h-4 ${onlySaved ? 'fill-[#071B35]' : ''}`} />
          <span className="hidden sm:inline">
            {isBn ? 'বুকমার্ক' : 'Saved'} ({savedTips.length})
          </span>
          <span className="sm:hidden">{savedTips.length}</span>
        </button>
      </div>

      {/* =========================================================================
          PAGE HIERARCHY ITEM 5: TODAY'S HEALTH TIP FEATURED CARD
          ========================================================================= */}
      {todaysTip && !searchQuery && selectedCategory === 'all' && !onlySaved && (
        <div
          onClick={() => handleOpenArticle(todaysTip)}
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-[#153D55] border border-[#69DCC0]/40 text-white shadow-xl cursor-pointer hover:border-[#69DCC0] transition-all transform hover:-translate-y-0.5 active:translate-y-0 group"
        >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-[#69DCC0]/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#112B48] border border-[#69DCC0]/40 text-xs font-black text-[#69DCC0] tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#69DCC0]" />
              {isBn ? "আজকের স্বাস্থ্য বার্তা" : "Today's Health Tip"}
            </span>
            <span className="text-[11px] font-semibold text-[#8FA9C4] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#69DCC0]" />
              {isBn ? todaysTip.readTimeBn : todaysTip.readTimeEn}
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-bold leading-snug mb-2 text-white group-hover:text-[#69DCC0] transition">
            {isBn ? todaysTip.titleBn : todaysTip.titleEn}
          </h3>

          <p className="text-xs sm:text-sm text-[#8FA9C4] line-clamp-2 leading-relaxed mb-4">
            {isBn ? todaysTip.summaryBn : todaysTip.summaryEn}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-[#112B48] text-xs font-semibold text-[#8FA9C4]">
            <span className="text-[11px] truncate max-w-[200px]">
              {isBn ? 'উৎস: ' : 'Source: '}
              {todaysTip.sourceName || todaysTip.source || (isBn ? 'WHO ও DGHS' : 'WHO & DGHS')}
            </span>
            <span className="flex items-center gap-1 font-bold text-[#69DCC0] group-hover:translate-x-1 transition shrink-0">
              {isBn ? 'সম্পূর্ণ পড়ুন' : 'Read Article'}
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE HIERARCHY ITEM 6: HEALTH CATEGORIES IN A TWO-COLUMN GRID
          ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#69DCC0]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8FA9C4]">
              {isBn ? 'স্বাস্থ্য বিভাগসমূহ (ক্যাটাগরি)' : 'Health Categories'}
            </h2>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-[#69DCC0] hover:underline flex items-center gap-1"
            >
              <span>{isBn ? 'সকল বিভাগ দেখুন' : 'Show All'}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Exact Two-Column Grid: grid grid-cols-2 gap-3 */}
        <div className="grid grid-cols-2 gap-3">
          {categories
            .filter((c) => c.isActive !== false)
            .map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const tipCount = activeTips.filter((t) => t.category === cat.id).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 shadow-xs group ${
                    isSelected
                      ? 'bg-[#153D55] border-[#69DCC0] shadow-md ring-1 ring-[#69DCC0]'
                      : 'bg-[#112B48] border-[#153D55] hover:border-[#69DCC0]/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#69DCC0] text-[#071B35]'
                          : 'bg-[#071B35] text-[#8FA9C4]'
                      }`}
                    >
                      {tipCount}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`text-xs sm:text-sm font-bold leading-tight group-hover:text-[#69DCC0] transition ${
                        isSelected ? 'text-[#69DCC0]' : 'text-white'
                      }`}
                    >
                      {isBn ? cat.nameBn : cat.nameEn}
                    </h3>
                    <p className="text-[10px] text-[#8FA9C4] line-clamp-1 mt-1 leading-snug">
                      {isBn ? cat.descriptionBn : cat.descriptionEn}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* When filtering by Category or Search or Bookmarks: Show Active Filter Banner */}
      {(selectedCategory !== 'all' || searchQuery || onlySaved) && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#112B48] border border-[#153D55]">
          <div className="flex items-center gap-2 text-xs text-[#8FA9C4]">
            <Filter className="w-3.5 h-3.5 text-[#69DCC0]" />
            <span>
              {isBn ? 'ফিল্টার করা ফলাফল: ' : 'Filtered Results: '}
              <strong className="text-white">{filteredTips.length}</strong> {isBn ? 'টি টিপস' : 'tips'}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setOnlySaved(false);
            }}
            className="text-xs font-bold text-[#69DCC0] hover:underline"
          >
            {isBn ? 'ফিল্টার রিসেট' : 'Clear Filters'}
          </button>
        </div>
      )}

      {/* =========================================================================
          PAGE HIERARCHY ITEM 7: POPULAR HEALTH TIPS
          ========================================================================= */}
      {selectedCategory === 'all' && !searchQuery && !onlySaved && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8FA9C4]">
                {isBn ? 'জনপ্রিয় স্বাস্থ্য পরামর্শ' : 'Popular Health Tips'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularTips.slice(0, 2).map((tip) => {
              const cat = getCategoryLabel(tip.category);
              return (
                <div
                  key={tip.id}
                  onClick={() => handleOpenArticle(tip)}
                  className="bg-[#112B48] border border-[#153D55] hover:border-[#69DCC0]/60 rounded-2xl p-4 transition cursor-pointer shadow-sm group flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#8FA9C4] mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#071B35] text-[#69DCC0] font-bold flex items-center gap-1">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span>{isBn ? tip.readTimeBn : tip.readTimeEn}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-[#69DCC0] transition line-clamp-2">
                      {isBn ? tip.titleBn : tip.titleEn}
                    </h4>
                    <p className="text-xs text-[#8FA9C4] line-clamp-2 mt-1 leading-relaxed">
                      {isBn ? tip.summaryBn : tip.summaryEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#153D55] text-[11px] text-[#8FA9C4]">
                    <span className="truncate max-w-[150px]">{tip.sourceName || tip.source || 'WHO'}</span>
                    <span className="text-[#69DCC0] font-bold flex items-center gap-1">
                      {isBn ? 'পড়ুন' : 'Read'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE HIERARCHY ITEM 8: LATEST ARTICLES
          ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#69DCC0]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8FA9C4]">
              {selectedCategory === 'all' && !searchQuery && !onlySaved
                ? isBn
                  ? 'সর্বশেষ স্বাস্থ্য আর্টিকেল'
                  : 'Latest Articles'
                : isBn
                ? 'পরামর্শ তালিকা'
                : 'Articles List'}{' '}
              ({filteredTips.length})
            </h2>
          </div>
        </div>

        {filteredTips.length === 0 ? (
          <div className="p-8 text-center bg-[#112B48] rounded-3xl border border-[#153D55]">
            <Info className="w-8 h-8 text-[#8FA9C4] mx-auto mb-2" />
            <p className="text-sm font-bold text-white">
              {isBn ? 'কোনো স্বাস্থ্য পরামর্শ পাওয়া যায়নি' : 'No health tips found'}
            </p>
            <p className="text-xs text-[#8FA9C4] mt-1">
              {isBn
                ? 'অন্য কোনো শব্দ দিয়ে অনুসন্ধান করুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।'
                : 'Try searching with another keyword or adjust the category filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTips.map((tip) => {
              const isSaved = savedTips.includes(tip.id);
              const cat = getCategoryLabel(tip.category);
              const title = isBn ? tip.titleBn : tip.titleEn;
              const summary = isBn ? tip.summaryBn : tip.summaryEn;
              const isMissingTranslation = !title || !summary;

              return (
                <div
                  key={tip.id}
                  onClick={() => handleOpenArticle(tip)}
                  className="bg-[#112B48] border border-[#153D55] hover:border-[#69DCC0]/60 rounded-2xl p-4 transition cursor-pointer shadow-sm group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#071B35] text-[#69DCC0] font-bold text-xs flex items-center gap-1 border border-[#153D55]">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[11px] text-[#8FA9C4] font-medium">
                        {isBn ? tip.readTimeBn : tip.readTimeEn}
                      </span>
                      {tip.isFeatured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center gap-0.5 border border-amber-500/30">
                          <Flame className="w-3 h-3" /> {isBn ? 'ফিচার্ড' : 'Featured'}
                        </span>
                      )}
                    </div>

                    {isMissingTranslation ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                        ⚠️ {isBn ? 'এই আর্টিকেলের বাংলা সংস্করণ উপলব্ধ নেই।' : 'English translation is not available yet.'}
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#69DCC0] transition line-clamp-1">
                          {title}
                        </h4>
                        <p className="text-xs text-[#8FA9C4] line-clamp-2 mt-1 leading-relaxed">
                          {summary}
                        </p>
                      </>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8FA9C4]">
                      <span>
                        {isBn ? 'উৎস: ' : 'Source: '}
                        {tip.sourceName || tip.source || 'WHO'}
                      </span>
                      <span>•</span>
                      <span>{tip.updatedAt || (isBn ? 'অক্টোবর ২০২৬' : 'Oct 2026')}</span>
                    </div>
                  </div>

                  {/* Right actions: Bookmark & Share */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => handleToggleSave(tip.id, e)}
                      className="p-2 rounded-xl bg-[#071B35] border border-[#153D55] text-[#8FA9C4] hover:text-white transition"
                      title={isBn ? 'বুকমার্ক' : 'Bookmark'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleShareArticle(tip, e)}
                      className="p-2 rounded-xl bg-[#071B35] border border-[#153D55] text-[#8FA9C4] hover:text-white transition"
                      title={isBn ? 'শেয়ার করুন' : 'Share'}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <span className="p-2 rounded-xl bg-[#153D55] text-[#69DCC0] group-hover:translate-x-0.5 transition">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          PAGE HIERARCHY ITEM 9: RECOMMENDED ARTICLES
          ========================================================================= */}
      {selectedCategory === 'all' && !searchQuery && !onlySaved && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#69DCC0]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8FA9C4]">
                {isBn ? 'সুপারিশকৃত নির্দেশিকা' : 'Recommended Articles'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedTips.slice(0, 2).map((tip) => {
              const cat = getCategoryLabel(tip.category);
              return (
                <div
                  key={tip.id}
                  onClick={() => handleOpenArticle(tip)}
                  className="bg-[#112B48] border border-[#153D55] hover:border-[#69DCC0]/60 rounded-2xl p-4 transition cursor-pointer shadow-sm group flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#8FA9C4] mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#071B35] text-[#69DCC0] font-bold flex items-center gap-1">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span>{isBn ? tip.readTimeBn : tip.readTimeEn}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-[#69DCC0] transition line-clamp-2">
                      {isBn ? tip.titleBn : tip.titleEn}
                    </h4>
                    <p className="text-xs text-[#8FA9C4] line-clamp-2 mt-1 leading-relaxed">
                      {isBn ? tip.summaryBn : tip.summaryEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#153D55] text-[11px] text-[#8FA9C4]">
                    <span className="truncate max-w-[150px]">{tip.sourceName || tip.source || 'DGHS'}</span>
                    <span className="text-[#69DCC0] font-bold flex items-center gap-1">
                      {isBn ? 'বিস্তারিত' : 'Details'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MEDICAL DISCLAIMER & EMERGENCY FOOTER (MANDATORY MEDICAL SAFETY)
          ========================================================================= */}
      <div className="bg-[#112B48] border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              {isBn ? 'জরুরি মেডিকেল অস্বীকৃতি (Medical Disclaimer)' : 'Medical Safety Disclaimer'}
            </h4>
            <p className="text-xs text-[#8FA9C4] leading-relaxed">
              {isBn
                ? 'এই অ্যাপের স্বাস্থ্য পরামর্শ ও তথ্য শুধুমাত্র সচেতনতা ও শিক্ষামূলক উদ্দেশ্যে প্রস্তুত করা হয়েছে। এটি কোনো অবস্থাতেই চিকিৎসকের পরামর্শ বা প্রেসক্রিপশনের বিকল্প নয়। যেকোনো স্বাস্থ্যগত প্রয়োজনে অবিলম্বে রেজিস্টার্ড চিকিৎসকের শরণাপন্ন হন।'
                : 'All health advice and guidelines in SmartHub are educational and informative only. They do not substitute professional medical diagnosis, prescriptions, or clinical treatments. In any emergency, consult a certified physician.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <a
            href="tel:16263"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{isBn ? 'স্বাস্থ্য বাতায়ন ১৬২৬৩' : 'Health 16263'}</span>
          </a>
          <a
            href="tel:999"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#153D55] hover:bg-[#112B48] text-white border border-[#153D55] font-bold text-xs transition"
          >
            <span>৯৯৯</span>
          </a>
        </div>
      </div>

      {/* =========================================================================
          ARTICLE DETAIL VIEW MODAL (ALL 14 REQUIRED ELEMENTS)
          ========================================================================= */}
      {selectedTip && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            stopSpeakingArticle();
            setIsSpeaking(false);
            setSelectedTip(null);
          }}
        >
          <div
            className="bg-[#071B35] border border-[#153D55] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header with Dedicated Back Button, Category, Reading Time, Controls */}
            <div className="p-3 sm:p-4 border-b border-[#112B48] bg-[#112B48] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Dedicated Back to List Button */}
                <button
                  onClick={closeArticle}
                  className="px-2.5 py-1.5 rounded-xl bg-[#071B35] border border-[#153D55] text-white hover:text-[#69DCC0] hover:border-[#69DCC0] transition flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs"
                  title={isBn ? 'পূর্ববর্তী তালিকায় ফিরুন' : 'Back to list'}
                >
                  <ArrowLeft className="w-4 h-4 text-[#69DCC0]" />
                  <span className="hidden xs:inline">{isBn ? 'পেছনে' : 'Back'}</span>
                </button>

                <span className="px-2.5 py-1 rounded-xl bg-[#071B35] text-[#69DCC0] border border-[#153D55] font-bold text-xs flex items-center gap-1 shrink-0">
                  <span>{getCategoryLabel(selectedTip.category).icon}</span>
                  <span className="truncate max-w-[100px] sm:max-w-[140px]">{getCategoryLabel(selectedTip.category).name}</span>
                </span>
                <span className="text-xs text-[#8FA9C4] font-medium shrink-0 hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#69DCC0]" />
                  <span>{isBn ? selectedTip.readTimeBn : selectedTip.readTimeEn}</span>
                </span>
              </div>

              {/* Action Buttons: TTS, Bookmark, Share, Copy, Close */}
              <div className="flex items-center gap-1.5">
                {/* Audio TTS Button */}
                {isSpeechSupported() && (
                  <button
                    onClick={() => handleToggleTTS(selectedTip)}
                    className={`p-2 rounded-xl transition ${
                      isSpeaking
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-[#153D55] text-[#69DCC0] hover:bg-[#112B48]'
                    }`}
                    title={isBn ? (isSpeaking ? 'পড়া বন্ধ করুন' : 'অডিও শুনুন') : isSpeaking ? 'Stop Audio' : 'Listen Article'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}

                {/* Bookmark Button */}
                <button
                  onClick={() => handleToggleSave(selectedTip.id)}
                  className="p-2 rounded-xl bg-[#153D55] text-[#8FA9C4] hover:text-white transition"
                  title={isBn ? 'বুকমার্ক' : 'Bookmark'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${savedTips.includes(selectedTip.id) ? 'fill-rose-400 text-rose-400' : ''}`}
                  />
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => handleShareArticle(selectedTip, e)}
                  className="p-2 rounded-xl bg-[#153D55] text-[#8FA9C4] hover:text-white transition"
                  title={isBn ? 'শেয়ার' : 'Share'}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Copy Text Button */}
                <button
                  onClick={() => handleCopyModal(selectedTip)}
                  className="p-2 rounded-xl bg-[#153D55] text-[#8FA9C4] hover:text-white transition"
                  title={isBn ? 'কপি করুন' : 'Copy'}
                >
                  {copied ? <Check className="w-4 h-4 text-[#69DCC0]" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    stopSpeakingArticle();
                    setIsSpeaking(false);
                    setSelectedTip(null);
                  }}
                  className="p-2 rounded-xl bg-[#153D55] text-[#8FA9C4] hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Featured Image if present */}
              {selectedTip.image && (
                <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden relative border border-[#153D55]">
                  <img
                    src={selectedTip.image}
                    alt={isBn ? selectedTip.titleBn : selectedTip.titleEn}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // hide on error
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071B35] via-transparent to-transparent opacity-80" />
                </div>
              )}

              {/* Title */}
              <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                {isBn ? selectedTip.titleBn : selectedTip.titleEn}
              </h2>

              {/* Source & Dates Metadata Banner */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#8FA9C4] pb-3 border-b border-[#112B48]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#69DCC0]" />
                  <strong>{isBn ? 'তথ্যসূত্র: ' : 'Source: '}</strong>
                  <span>{selectedTip.sourceName || selectedTip.source || (isBn ? 'বিশ্ব স্বাস্থ্য সংস্থা (WHO)' : 'WHO')}</span>
                  {selectedTip.sourceUrl && (
                    <a
                      href={selectedTip.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#69DCC0] hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#69DCC0]" />
                  <strong>{isBn ? 'হালনাগাদ: ' : 'Updated: '}</strong>
                  <span>{selectedTip.updatedAt || (isBn ? 'অক্টোবর ২০২৬' : 'October 2026')}</span>
                </span>
                {selectedTip.author && (
                  <span>
                    <strong>{isBn ? 'লেখক: ' : 'Author: '}</strong>
                    {selectedTip.author}
                  </span>
                )}
              </div>

              {/* Missing Translation Safeguard */}
              {((isBn && !selectedTip.detailsBn?.description) ||
                (!isBn && !selectedTip.detailsEn?.description)) && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-xs sm:text-sm text-amber-300 font-semibold leading-relaxed">
                  ⚠️ {isBn
                    ? 'অনুবাদ উপলব্ধ নেই: এই স্বাস্থ্য নির্দেশিকাটির পূর্ণাঙ্গ বাংলা সংস্করণ এখনও প্রস্তুত হয়নি। তথ্য সুরক্ষার স্বার্থে কোনো অননুমোদিত স্বয়ংক্রিয় অনুবাদ প্রদর্শন করা হচ্ছে না।'
                    : 'Translation Not Available: The full English version of this clinical guideline is not available yet. Automatic unverified medical translations are suppressed for patient safety.'}
                </div>
              )}

              {/* Full Article Content */}
              <div className={`${getFontSizeClass(fontSize)} text-[#8FA9C4] leading-relaxed`}>
                <p>
                  {isBn
                    ? selectedTip.detailsBn?.description
                    : selectedTip.detailsEn?.description}
                </p>
              </div>

              {/* Clinical Recommendations / Dos */}
              {((isBn && selectedTip.detailsBn?.dos?.length) ||
                (!isBn && selectedTip.detailsEn?.dos?.length)) && (
                <div className="p-4 rounded-2xl bg-[#112B48] border border-[#69DCC0]/40">
                  <h4 className="text-xs font-black text-[#69DCC0] mb-2.5 flex items-center gap-2 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-[#69DCC0]" />
                    {isBn ? 'সুপারিশ ও করণীয় নির্দেশনা' : 'Clinical Recommendations & Best Practices'}
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-white">
                    {(isBn ? selectedTip.detailsBn?.dos : selectedTip.detailsEn?.dos)?.map(
                      (item, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-[#69DCC0] font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Don'ts / Avoidances */}
              {((isBn && selectedTip.detailsBn?.donts?.length) ||
                (!isBn && selectedTip.detailsEn?.donts?.length)) && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40">
                  <h4 className="text-xs font-black text-rose-300 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    {isBn ? 'যা যা বর্জন করবেন' : 'Practices to Avoid'}
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-white">
                    {(isBn ? selectedTip.detailsBn?.donts : selectedTip.detailsEn?.donts)?.map(
                      (item, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-rose-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Beneficial Foods / Nutritions */}
              {((isBn && selectedTip.detailsBn?.nutritions?.length) ||
                (!isBn && selectedTip.detailsEn?.nutritions?.length)) && (
                <div className="p-4 rounded-2xl bg-[#112B48] border border-[#153D55]">
                  <h4 className="text-xs font-black text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
                    <span className="text-[#69DCC0]">🥗</span>
                    {isBn ? 'উপকারী খাদ্য উপাদান' : 'Beneficial Dietary Nutrients'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(isBn ? selectedTip.detailsBn?.nutritions : selectedTip.detailsEn?.nutritions)?.map(
                      (nutr, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-[#071B35] text-[#69DCC0] font-semibold text-xs border border-[#153D55]"
                        >
                          {nutr}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Warning / Emergency Red Flags */}
              {((isBn && (selectedTip.detailsBn?.warning || selectedTip.detailsBn?.whenToSeeDoctor)) ||
                (!isBn && (selectedTip.detailsEn?.warning || selectedTip.detailsEn?.whenToSeeDoctor))) && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40">
                  <h4 className="text-xs font-black text-amber-300 mb-2 flex items-center gap-2 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {isBn ? 'সতর্কতা ও কখন ডাক্তার দেখাবেন' : 'Red Flags & When to Seek Medical Attention'}
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                    {isBn
                      ? selectedTip.detailsBn?.warning || selectedTip.detailsBn?.whenToSeeDoctor
                      : selectedTip.detailsEn?.warning || selectedTip.detailsEn?.whenToSeeDoctor}
                  </p>
                </div>
              )}

              {/* Related Articles Section */}
              {relatedTips.length > 0 && (
                <div className="pt-3 border-t border-[#112B48]">
                  <h4 className="text-xs font-bold text-[#8FA9C4] uppercase tracking-wider mb-2.5">
                    {isBn ? 'সম্পর্কিত অন্যান্য পরামর্শ' : 'Related Health Articles'}
                  </h4>
                  <div className="space-y-2">
                    {relatedTips.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => {
                          stopSpeakingArticle();
                          setIsSpeaking(false);
                          handleOpenArticle(rel);
                        }}
                        className="p-3 rounded-xl bg-[#112B48] border border-[#153D55] hover:border-[#69DCC0]/60 transition flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-white group-hover:text-[#69DCC0] transition truncate">
                          {isBn ? rel.titleBn : rel.titleEn}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8FA9C4] group-hover:text-[#69DCC0] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-3.5 sm:p-4 border-t border-[#112B48] bg-[#112B48] flex items-center justify-between gap-3">
              <a
                href="tel:16263"
                className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isBn ? 'জরুরি কল: ১৬২৬৩' : 'Emergency: 16263'}</span>
              </a>

              <button
                onClick={closeArticle}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#69DCC0] hover:bg-[#58c9ad] text-[#071B35] font-black text-xs flex items-center gap-1.5 transition shadow-md active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isBn ? 'পূর্ববর্তী তালিকায় ফিরুন (পরের টিপস পড়ুন)' : 'Back to List (Read Next Tip)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          READING HISTORY MODAL
          ========================================================================= */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="bg-[#071B35] border border-[#153D55] rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#112B48] bg-[#112B48] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#69DCC0]" />
                <h3 className="text-sm font-bold text-white">
                  {isBn ? 'পড়ার ইতিহাস (Reading History)' : 'Recent Reading History'}
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-[#8FA9C4] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {historyList.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8FA9C4]">
                  {isBn ? 'এখনো কোনো আর্টিকেল পড়া হয়নি।' : 'No reading history yet.'}
                </div>
              ) : (
                historyList.map((item) => {
                  const tip = tips.find((t) => t.id === item.tipId);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (tip) {
                          handleOpenArticle(tip);
                          setShowHistoryModal(false);
                        }
                      }}
                      className="p-3 rounded-xl bg-[#112B48] border border-[#153D55] flex items-center justify-between gap-2 hover:border-[#69DCC0] transition cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5 truncate">
                        <span className="text-xs font-bold text-white truncate">
                          {isBn ? item.titleBn : item.titleEn}
                        </span>
                        <span className="text-[10px] text-[#8FA9C4]">
                          {new Date(item.readAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8FA9C4] shrink-0" />
                    </div>
                  );
                })
              )}
            </div>

            {historyList.length > 0 && (
              <div className="p-3 border-t border-[#112B48] bg-[#112B48] flex justify-end">
                <button
                  onClick={() => {
                    clearHealthReadingHistory();
                    setHistoryList([]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 text-xs font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ইতিহাস মুছে ফেলুন' : 'Clear History'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
