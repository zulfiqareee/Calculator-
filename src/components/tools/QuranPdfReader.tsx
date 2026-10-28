import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Bookmark,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronRight,
  ExternalLink,
  Info,
  Sparkles,
  Search,
  List,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Language } from '../../types';
import {
  saveQuranPdf,
  getStoredQuranPdf,
  deleteStoredQuranPdf,
  saveLastReadPage,
  getLastReadPage,
  StoredPdfRecord,
} from '../../utils/pdfStorage';

interface Props {
  lang: Language;
}

// 30 Para Index for Fast Navigation
const QURAN_PARAS = [
  { para: 1, nameBn: 'আলিফ লাম মীম', nameAr: 'الم', page: 1 },
  { para: 2, nameBn: 'সায়াকুলু', nameAr: 'سيقول', page: 22 },
  { para: 3, nameBn: 'তিলকার রুসুল', nameAr: 'تلك الرسل', page: 42 },
  { para: 4, nameBn: 'লান তানা লু', nameAr: 'لن تنالوا', page: 62 },
  { para: 5, nameBn: 'ওয়াল মুহসানাত', nameAr: 'والمحصنات', page: 82 },
  { para: 6, nameBn: 'লা ইউহিব্বুল্লাহ', nameAr: 'لا يحب الله', page: 102 },
  { para: 7, nameBn: 'ওয়া ইযা সামিউ', nameAr: 'وإذا سمعوا', page: 122 },
  { para: 8, nameBn: 'ওয়া লাও আন্নানা', nameAr: 'ولو أننا', page: 142 },
  { para: 9, nameBn: 'ক্বলাল মালাউ', nameAr: 'قال الملأ', page: 162 },
  { para: 10, nameBn: 'ওয়া আ’লামু', nameAr: 'واعلموا', page: 182 },
  { para: 11, nameBn: 'ইয়া’তাযিরুন', nameAr: 'يعتذرون', page: 202 },
  { para: 12, nameBn: 'ওয়া মা মিন দা-ব্বাহ', nameAr: 'وما من دابة', page: 222 },
  { para: 13, nameBn: 'ওয়া মা উবাররিউ', nameAr: 'وما أبرئ', page: 242 },
  { para: 14, nameBn: 'রুবামা', nameAr: 'ربما', page: 262 },
  { para: 15, nameBn: 'সুবহানাল্লাযী', nameAr: 'سبحان الذي', page: 282 },
  { para: 16, nameBn: 'ক্বলা আলাম', nameAr: 'قال ألم', page: 302 },
  { para: 17, nameBn: 'ইক্বতারা বা', nameAr: 'اقترب', page: 322 },
  { para: 18, nameBn: 'ক্বাদ আফলাহা', nameAr: 'قد أفلح', page: 342 },
  { para: 19, nameBn: 'ওয়া ক্বলাল্লাযীনা', nameAr: 'وقال الذين', page: 362 },
  { para: 20, nameBn: 'আম্মান খালাক্বা', nameAr: 'أمن خلق', page: 382 },
  { para: 21, nameBn: 'উতলু মা উহিয়া', nameAr: 'اتل ما أوحي', page: 402 },
  { para: 22, nameBn: 'ওয়া মাই ইয়াক্বনুত', nameAr: 'ومن يقنت', page: 422 },
  { para: 23, nameBn: 'ওয়া মা লিয়া', nameAr: 'وما لي', page: 442 },
  { para: 24, nameBn: 'ফামান আযলামু', nameAr: 'فمن أظلم', page: 462 },
  { para: 25, nameBn: 'ইলাইহি ইউরাদ্দু', nameAr: 'إليه يرد', page: 482 },
  { para: 26, nameBn: 'হা-মীম', nameAr: 'حم', page: 502 },
  { para: 27, nameBn: 'ক্বলা ফামা খাতবুকুম', nameAr: 'قال فما خطبكم', page: 522 },
  { para: 28, nameBn: 'ক্বাদ সামিআল্লাহু', nameAr: 'قد سمع الله', page: 542 },
  { para: 29, nameBn: 'তাবারাকাল্লাযী', nameAr: 'تبارك الذي', page: 562 },
  { para: 30, nameBn: 'আম্মা ইয়াতাসাআলুন', nameAr: 'عم يتساءلون', page: 582 },
];

export const QuranPdfReader: React.FC<Props> = ({ lang }) => {
  const [pdfRecord, setPdfRecord] = useState<StoredPdfRecord | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(getLastReadPage());
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showParaList, setShowParaList] = useState<boolean>(false);
  const [bookmarkSaved, setBookmarkSaved] = useState<boolean>(false);
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load stored PDF from IndexedDB on mount
  useEffect(() => {
    let active = true;
    async function loadStored() {
      setLoading(true);
      try {
        const stored = await getStoredQuranPdf();
        if (active && stored) {
          setPdfRecord(stored);
          const url = URL.createObjectURL(stored.file);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.warn('Error loading stored Quran PDF:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStored();

    return () => {
      active = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, []);

  // Update current page when input changes
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // Handle User File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে শুধুমাত্র একটি PDF ফাইল নির্বাচন করুন।' : 'Please select a valid PDF file.');
      return;
    }

    setLoading(true);
    const ok = await saveQuranPdf(file, file.name);
    if (ok) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const url = URL.createObjectURL(file);
      setPdfBlobUrl(url);
      setPdfRecord({
        file,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: Date.now(),
      });
      setCurrentPage(1);
      saveLastReadPage(1);
    } else {
      alert(lang === 'bn' ? 'ফাইলটি মেমোরিতে সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to save PDF to storage.');
    }
    setLoading(false);
  };

  // Remove uploaded PDF
  const handleRemovePdf = async () => {
    if (
      window.confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে সংরক্ষিত এই কুরআন ফাইলটি মুছে ফেলতে চান?'
          : 'Are you sure you want to remove this stored Quran PDF?'
      )
    ) {
      await deleteStoredQuranPdf();
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfRecord(null);
    }
  };

  // Bookmark current page
  const handleBookmark = () => {
    saveLastReadPage(currentPage);
    setBookmarkSaved(true);
    setTimeout(() => setBookmarkSaved(false), 2000);
  };

  // Jump to specific page
  const handlePageJump = (page: number) => {
    const validPage = Math.max(1, page);
    setCurrentPage(validPage);
    saveLastReadPage(validPage);
    setShowParaList(false);
  };

  // Formatted PDF URL with page anchor
  const viewerUrl = pdfBlobUrl ? `${pdfBlobUrl}#page=${currentPage}&zoom=${zoomLevel}` : null;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-3 max-w-4xl mx-auto w-full select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 max-w-none h-screen' : ''
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Toolbar (Navigation, Zoom, Bookmark, Fullscreen) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
        {/* Left: 30 Para Drawer Button & Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParaList(!showParaList)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0B63F6] dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <List className="w-4 h-4" />
            <span>{lang === 'bn' ? '৩০ পারা সূচী' : '30 Paras'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
            title="নতুন পিডিএফ ফাইল নির্বাচন করুন"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{pdfRecord ? (lang === 'bn' ? 'ফাইল পরিবর্তন' : 'Change File') : (lang === 'bn' ? 'কুরআন যুক্ত করুন' : 'Add Quran')}</span>
          </button>
        </div>

        {/* Center: Page Jump Input & Bookmark */}
        {pdfRecord && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">{lang === 'bn' ? 'পৃষ্ঠা:' : 'Page:'}</span>
            <div className="flex items-center">
              <input
                type="number"
                min={1}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePageJump(parseInt(inputPage, 10) || 1);
                  }
                }}
                className="w-14 h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center font-bold text-xs"
              />
              <button
                onClick={() => handlePageJump(parseInt(inputPage, 10) || 1)}
                className="ml-1 px-2 h-8 rounded-lg bg-[#0B63F6] text-white text-[11px] font-bold"
              >
                Go
              </button>
            </div>

            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 shadow-2xs ${
                bookmarkSaved
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="শেষ পঠিত পৃষ্ঠা সেভ করুন"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkSaved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{bookmarkSaved ? 'সেভড!' : 'বুকমার্ক'}</span>
            </button>
          </div>
        )}

        {/* Right: Zoom & Fullscreen Controls */}
        {pdfRecord && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-500 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(250, z + 15))}
              className="p-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-1"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleRemovePdf}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1"
              title="পিডিএফ ফাইলটি মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 30 Para Quick Navigation Dropdown / Drawer */}
      {showParaList && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3 animate-fade-in max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-[#0B63F6]">
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'bn' ? '৩০ পারা তালিকা (যেটিতে ক্লিক করবেন সরাসরি সেই পৃষ্ঠায় যাবে):' : '30 Para Index'}</span>
            </span>
            <button
              onClick={() => setShowParaList(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              বন্ধ করুন
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QURAN_PARAS.map((p) => (
              <button
                key={p.para}
                onClick={() => handlePageJump(p.page)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  currentPage >= p.page && currentPage < p.page + 20
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-[#0B63F6] text-[#0B63F6]'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-blue-50 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">পারা {p.para}</span>
                  <span className="text-xs font-bold block truncate max-w-[120px]">{p.nameBn}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-serif text-slate-500 block">{p.nameAr}</span>
                  <span className="text-[9px] text-slate-400 font-mono">পৃ. {p.page}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Reader View or Upload Placeholder */}
      {loading ? (
        <div className="py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0B63F6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">কুরআনুল কারীম লোড হচ্ছে...</span>
        </div>
      ) : pdfRecord && pdfBlobUrl ? (
        <div className="flex flex-col gap-2 flex-1 min-h-[550px] sm:min-h-[700px]">
          {/* File Status Tag Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="truncate max-w-xs font-medium">
              📖 {pdfRecord.fileName} ({(pdfRecord.fileSize / (1024 * 1024)).toFixed(1)} MB)
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ✓ অফলাইনে সংরক্ষিত (কোনো ডাটা বা নেট লাগবে না)
            </span>
          </div>

          {/* Interactive PDF Embedded Viewer */}
          <div className="w-full flex-1 min-h-[550px] sm:min-h-[700px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative">
            <iframe
              src={viewerUrl || undefined}
              title="Quran Reader"
              className="w-full h-full min-h-[550px] sm:min-h-[700px] border-none"
            />
          </div>
        </div>
      ) : (
        /* Empty State / Upload Prompt Card */
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-900/60 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-[#0B63F6] flex items-center justify-center shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="max-w-md">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'পবিত্র কুরআনুল কারীম যুক্ত করুন' : 'Add Holy Quran File'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার মোবাইল বা কম্পিউটারে থাকা কুরআন শরীফ (যেমন: হাফেজী কুরআন, নূরানী কুরআন বা ৩০ পারা) এখানে সরাসরি নির্বাচন করুন।'
                : 'Select Quran file from your device. It will be stored safely offline in your phone storage.'}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 transition"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডিভাইস থেকে কুরআন ফাইল নির্বাচন করুন' : 'Select Quran File'}</span>
          </button>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 max-w-md text-left text-xs flex flex-col gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-[#0B63F6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>অফলাইন সুবিধা ও নিরাপত্তা:</span>
            </span>
            <span>• একবার ফাইল দিলে এটি আপনার ফোনের স্থায়ী মেমোরিতে সেভ থাকবে; পরবর্তীতে কোনো ইন্টারনেট ছাড়াই সরাসরি পড়তে পারবেন।</span>
            <span>• জুম ইন, জুম আউট ও শেষ পঠিত পৃষ্ঠা মনে রাখার স্বয়ংক্রিয় সুবিধা।</span>
          </div>
        </div>
      )}

      {/* Guide Note for Admin / Play Store permanent embedding */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">
            {lang === 'bn'
              ? 'প্লে স্টোরে অ্যাপ ছাড়ার সময় সবার জন্য কুরআন স্থায়ী করার নিয়ম:'
              : 'Tip for App Distribution:'}
          </span>
          <span className="leading-relaxed">
            {lang === 'bn'
              ? 'আপনি যদি চান যে অ্যাপটি প্লে স্টোর থেকে ডাউনলোড করলেই কোনো আপলোড ছাড়াই সব ব্যবহারকারীর ফোনে এই কুরআনটি সরাসরি লোড হবে, তবে আপনার কুরআন পিডিএফ ফাইলটির নাম "quran.pdf" দিয়ে প্রোজেক্টের public/ ফোল্ডারে রেখে দিলে তা স্বয়ংক্রিয়ভাবে অ্যাপের স্থায়ী অংশ হয়ে যাবে।'
              : 'You can also place your quran.pdf in the public/ folder so every user gets it pre-installed without uploading.'}
          </span>
        </div>
      </div>
    </div>
  );
};
