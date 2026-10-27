import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  List,
  Bookmark,
  Share2,
  Sparkles,
  Search,
  Book,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Edit3,
  Trash2,
  Save,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { BookItem, BookChapter, Language } from '../../types';
import { getStoredBooks, addOrUpdateBook, deleteBook } from '../../utils/booksStorage';
import { getAdminSession } from '../../utils/adminAuth';

interface Props {
  lang: Language;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}

const COVER_GRADIENTS = [
  { label: 'রয়েল ব্লু', value: 'from-blue-600 to-indigo-800' },
  { label: 'পান্না সবুজ', value: 'from-emerald-600 to-teal-800' },
  { label: 'অ্যাম্বার গোল্ড', value: 'from-amber-600 to-orange-700' },
  { label: 'রোজ রেড', value: 'from-rose-600 to-pink-800' },
  { label: 'ভায়োলেট পার্পল', value: 'from-purple-600 to-indigo-900' },
  { label: 'ডার্ক স্লেট', value: 'from-slate-700 to-slate-900' },
];

export const BookReaderView: React.FC<Props> = ({ lang, onBack, onOpenAdmin }) => {
  const [books, setBooks] = useState<BookItem[]>(getStoredBooks());
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showChapterList, setShowChapterList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<{ url: string; caption: string } | null>(null);

  // Check if current user is logged-in Admin
  const adminSession = getAdminSession();
  const isAdmin = !!adminSession;

  // Book Editor State (EXCLUSIVELY FOR ADMIN)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bTitleBn, setBTitleBn] = useState<string>('');
  const [bTitleEn, setBTitleEn] = useState<string>('');
  const [bAuthor, setBAuthor] = useState<string>('জুলফিকার হাসান');
  const [bCategory, setBCategory] = useState<string>('ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং');
  const [bDescBn, setBDescBn] = useState<string>('');
  const [bCoverColor, setBCoverColor] = useState<string>('from-blue-600 to-indigo-800');
  const [bChapters, setBChapters] = useState<BookChapter[]>([
    { id: 'ch-1', titleBn: 'অধ্যায় ১: ভূমিকা ও বেসিক', titleEn: 'Chapter 1: Basics', content: '' },
  ]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const [urlModalChapterIdx, setUrlModalChapterIdx] = useState<number | null>(null);
  const [customImgUrl, setCustomImgUrl] = useState<string>('');
  const [customImgCaption, setCustomImgCaption] = useState<string>('');

  // Reader Zoom Level (70% - 220%)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('reader_zoom_level') || '100', 10);
    } catch {
      return 100;
    }
  });

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(220, Math.max(70, prev + delta));
      try {
        localStorage.setItem('reader_zoom_level', next.toString());
      } catch {}
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    try {
      localStorage.setItem('reader_zoom_level', '100');
    } catch {}
  };

  // Open Editor for New Book (Admin only)
  const handleOpenNewBook = () => {
    if (!isAdmin) {
      if (onOpenAdmin) onOpenAdmin();
      return;
    }
    setEditingBookId(null);
    setBTitleBn('');
    setBTitleEn('');
    setBAuthor('জুলফিকার হাসান');
    setBCategory('ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং');
    setBDescBn('');
    setBCoverColor('from-blue-600 to-indigo-800');
    setBChapters([
      {
        id: 'ch-1',
        titleBn: 'অধ্যায় ১: ভূমিকা ও মূল বিষয়বস্তু',
        titleEn: 'Chapter 1: Basics',
        content: 'এখানে অধ্যায়ের বিস্তারিত বিষয়বস্তু বাংলায় লিখুন...\\n\\n### মূল বিষয়বস্তু:\\n- পয়েন্ট ১\\n- পয়েন্ট ২\\n\\n> ⚡ সূত্র: V = I × R (ভোল্টেজ = কারেন্ট × রেজিস্ট্যান্স)',
      },
    ]);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Open Editor to Edit Existing Book (Admin only)
  const handleOpenEditBook = (book: BookItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      if (onOpenAdmin) onOpenAdmin();
      return;
    }
    setEditingBookId(book.id);
    setBTitleBn(book.titleBn);
    setBTitleEn(book.titleEn || book.titleBn);
    setBAuthor(book.author);
    setBCategory(book.category);
    setBDescBn(book.descriptionBn);
    setBCoverColor(book.coverColor || 'from-blue-600 to-indigo-800');
    setBChapters(
      book.chapters && book.chapters.length > 0
        ? book.chapters
        : [{ id: 'ch-1', titleBn: 'অধ্যায় ১: ভূমিকা', titleEn: 'Chapter 1', content: '' }]
    );
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Delete Book (Admin only)
  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    deleteBook(bookId);
    setBooks(getStoredBooks());
    if (selectedBook?.id === bookId) {
      setSelectedBook(null);
    }
    setEditorToast('বইটি মুছে ফেলা হয়েছে।');
    setTimeout(() => setEditorToast(null), 3000);
  };

  // Save Book (Admin only)
  const handleSaveBook = () => {
    if (!bTitleBn.trim()) {
      setEditorError('দয়া করে বইয়ের একটি বাংলা নাম লিখুন।');
      return;
    }

    const cleanedChapters = bChapters.map((ch, idx) => ({
      ...ch,
      titleBn: ch.titleBn.trim() || `অধ্যায় ${idx + 1}`,
      titleEn: ch.titleEn?.trim() || `Chapter ${idx + 1}`,
      content: ch.content || '',
    }));

    const bookObj: BookItem = {
      id: editingBookId || `book-${Date.now()}`,
      titleBn: bTitleBn.trim(),
      titleEn: bTitleEn.trim() || bTitleBn.trim(),
      author: bAuthor.trim() || 'জুলফিকার হাসান',
      category: bCategory.trim() || 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং',
      coverColor: bCoverColor,
      descriptionBn: bDescBn.trim() || 'রেফারেন্স গাইড ও টেকনিক্যাল বুক',
      descriptionEn: bDescBn.trim() || 'Reference guide',
      chapters: cleanedChapters,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addOrUpdateBook(bookObj);
    const updatedList = getStoredBooks();
    setBooks(updatedList);
    setIsEditorOpen(false);
    setEditingBookId(null);
    setEditorError(null);

    if (selectedBook?.id === bookObj.id) {
      setSelectedBook(bookObj);
    }

    setEditorToast(lang === 'bn' ? 'বইটি সফলভাবে সংরক্ষিত হয়েছে!' : 'Book saved successfully!');
    setTimeout(() => setEditorToast(null), 3500);
  };

  // Insert image to chapter from device gallery or camera
  const handleInsertImageFromFile = (chapterIndex: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 900;
        let w = img.width;
        let h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) {
            h = Math.round((h * MAX_SIZE) / w);
            w = MAX_SIZE;
          } else {
            w = Math.round((w * MAX_SIZE) / h);
            h = MAX_SIZE;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          const caption = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'চিত্র';
          const markdownImg = `\n\n![${caption}](${compressed})\n\n`;
          const updated = [...bChapters];
          updated[chapterIndex].content = (updated[chapterIndex].content || '') + markdownImg;
          setBChapters(updated);
        }
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  // Insert image from Web URL
  const handleConfirmImageUrl = () => {
    if (urlModalChapterIdx === null || !customImgUrl.trim()) return;
    const caption = customImgCaption.trim() || 'চিত্র';
    const markdownImg = `\n\n![${caption}](${customImgUrl.trim()})\n\n`;
    const updated = [...bChapters];
    updated[urlModalChapterIdx].content = (updated[urlModalChapterIdx].content || '') + markdownImg;
    setBChapters(updated);
    setUrlModalChapterIdx(null);
    setCustomImgUrl('');
    setCustomImgCaption('');
  };

  const activeChapter: BookChapter | null = selectedBook && selectedBook.chapters[activeChapterIndex]
    ? selectedBook.chapters[activeChapterIndex]
    : null;

  // Render markdown bold text
  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Parse chapter content into images, callouts, headings, lists, and formatted text
  const renderFormattedContent = (content: string) => {
    const baseFontSizePx = Math.round((16 * zoomLevel) / 100);
    const h1SizePx = Math.round((24 * zoomLevel) / 100);
    const h2SizePx = Math.round((20 * zoomLevel) / 100);
    const h3SizePx = Math.round((18 * zoomLevel) / 100);
    const calloutSizePx = Math.round((15 * zoomLevel) / 100);

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = (key: string | number) => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join('\n').trim();
        if (text) {
          elements.push(
            <p
              key={`p-${key}`}
              style={{ fontSize: `${baseFontSizePx}px`, lineHeight: 1.75 }}
              className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans my-2.5 transition-all duration-150"
            >
              {renderInlineStyles(text)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check for markdown image: ![caption](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        flushParagraph(idx);
        const caption = imgMatch[1];
        const url = imgMatch[2];
        elements.push(
          <figure key={`img-${idx}`} className="my-4 flex flex-col items-center w-full">
            <div
              onClick={() => setZoomedImage({ url, caption })}
              className="relative group cursor-pointer max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 transition hover:shadow-md"
            >
              <img
                src={url}
                alt={caption}
                className="max-h-80 sm:max-h-96 w-auto max-w-full object-contain mx-auto transition group-hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none">
                <ZoomIn className="w-4 h-4" />
                <span>বড় করে দেখুন</span>
              </div>
            </div>
            {caption && (
              <figcaption className="text-center text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 px-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#0B63F6] shrink-0" />
                <span>চিত্র: {caption}</span>
              </figcaption>
            )}
          </figure>
        );
        return;
      }

      // Check for Callout Box: > ...
      if (trimmed.startsWith('>')) {
        flushParagraph(idx);
        elements.push(
          <div
            key={`callout-${idx}`}
            style={{ fontSize: `${calloutSizePx}px`, lineHeight: 1.6 }}
            className="my-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-l-4 border-[#0B63F6] text-slate-800 dark:text-slate-200 font-medium transition-all duration-150"
          >
            {trimmed.replace(/^>\s*/, '')}
          </div>
        );
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        flushParagraph(idx);
        elements.push(
          <h3
            key={`h3-${idx}`}
            style={{ fontSize: `${h3SizePx}px` }}
            className="font-bold text-slate-900 dark:text-white mt-4 mb-1 transition-all duration-150"
          >
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushParagraph(idx);
        elements.push(
          <h2
            key={`h2-${idx}`}
            style={{ fontSize: `${h2SizePx}px` }}
            className="font-extrabold text-[#0B63F6] mt-5 mb-2 transition-all duration-150"
          >
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushParagraph(idx);
        elements.push(
          <h1
            key={`h1-${idx}`}
            style={{ fontSize: `${h1SizePx}px` }}
            className="font-black text-slate-900 dark:text-white mt-6 mb-2 transition-all duration-150"
          >
            {trimmed.replace(/^#\s*/, '')}
          </h1>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        flushParagraph(idx);
        elements.push(
          <div
            key={`bullet-${idx}`}
            style={{ fontSize: `${baseFontSizePx}px`, lineHeight: 1.65 }}
            className="flex items-start gap-2 my-1 text-slate-700 dark:text-slate-200 transition-all duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B63F6] mt-2 shrink-0" />
            <span>{renderInlineStyles(trimmed.replace(/^[-•]\s*/, ''))}</span>
          </div>
        );
        return;
      }

      currentParagraph.push(line);
    });

    flushParagraph('final');
    return elements;
  };

  // Filter books by search
  const filteredBooks = books.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.titleBn.toLowerCase().includes(q) ||
      b.titleEn.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.descriptionBn.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // 1. ADMIN BOOK EDITOR VIEW (EXCLUSIVELY FOR LOGGED-IN ADMIN)
  // =========================================================================
  if (isEditorOpen && isAdmin) {
    return (
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                {editingBookId ? 'বই সম্পাদনা করুন (অ্যাডমিন)' : 'নতুন বই লিখুন (অ্যাডমিন)'}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                লেখক: জুলফিকার হাসান
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              বাতিল
            </button>
            <button
              onClick={handleSaveBook}
              className="px-4 py-1.5 bg-[#0B63F6] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {editorError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{editorError}</span>
          </div>
        )}

        {/* Book Details Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3.5">
          <h4 className="font-bold text-xs text-[#0B63F6] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>বইয়ের প্রাথমিক তথ্য</span>
          </h4>

          {/* Book Title (Bengali) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বইয়ের শিরোনাম (বাংলা) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={bTitleBn}
              onChange={(e) => {
                setBTitleBn(e.target.value);
                if (editorError) setEditorError(null);
              }}
              placeholder="যেমন: ব্যবহারিক ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং ও সার্কিট হ্যান্ডবুক"
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
            />
          </div>

          {/* Author & Category */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                লেখকের নাম
              </label>
              <input
                type="text"
                value={bAuthor}
                onChange={(e) => setBAuthor(e.target.value)}
                placeholder="জুলফিকার হাসান"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ক্যাটাগরি
              </label>
              <input
                type="text"
                value={bCategory}
                onChange={(e) => setBCategory(e.target.value)}
                placeholder="ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cover Color Gradient */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              বইয়ের কভার থিম
            </label>
            <div className="flex flex-wrap gap-2">
              {COVER_GRADIENTS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBCoverColor(c.value)}
                  className={`h-8 px-3 rounded-xl bg-gradient-to-r ${c.value} text-white text-[11px] font-bold transition flex items-center gap-1.5 ${
                    bCoverColor === c.value ? 'ring-2 ring-offset-2 ring-[#0B63F6] scale-105' : 'opacity-80'
                  }`}
                >
                  {bCoverColor === c.value && <Check className="w-3 h-3" />}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বইয়ের সংক্ষিপ্ত বিবরণ
            </label>
            <textarea
              rows={2}
              value={bDescBn}
              onChange={(e) => setBDescBn(e.target.value)}
              placeholder="এই বইটিতে পাঠকরা কী কী জানতে পারবেন তার সারমর্ম..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
            />
          </div>
        </div>

        {/* Chapters Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              বইয়ের অধ্যায়সমূহ ({bChapters.length} টি অধ্যায়)
            </h4>
            <button
              type="button"
              onClick={() => {
                setBChapters((prev) => [
                  ...prev,
                  {
                    id: `ch-${Date.now()}`,
                    titleBn: `অধ্যায় ${prev.length + 1}: নতুন শিরোনাম`,
                    titleEn: `Chapter ${prev.length + 1}`,
                    content: '',
                  },
                ]);
              }}
              className="px-3 py-1.5 bg-blue-50 dark:bg-slate-800 text-[#0B63F6] dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-200/60 dark:border-slate-700 hover:bg-blue-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন অধ্যায় যোগ</span>
            </button>
          </div>

          {/* Chapter Cards */}
          {bChapters.map((ch, idx) => {
            const imgMatches = Array.from(ch.content.matchAll(/!\[(.*?)\]\((.*?)\)/g));
            return (
              <div
                key={ch.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3"
              >
                {/* Chapter Title Input */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-[#0B63F6] block uppercase tracking-wider">
                      অধ্যায় {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={ch.titleBn}
                      onChange={(e) => {
                        const updated = [...bChapters];
                        updated[idx].titleBn = e.target.value;
                        setBChapters(updated);
                      }}
                      placeholder="অধ্যায়ের শিরোনাম বাংলায় লিখুন..."
                      className="w-full font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
                    />
                  </div>

                  {bChapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBChapters(bChapters.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                      title="অধ্যায় মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Visual Content Toolbar for Chapter */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                  {/* Photo Upload from Gallery */}
                  <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-[#0B63F6] hover:bg-blue-50 font-bold flex items-center gap-1 text-[11px] border border-blue-200/60 dark:border-slate-700 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ ছবি (গ্যালারি)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleInsertImageFromFile(idx, file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  {/* Web Image URL */}
                  <button
                    type="button"
                    onClick={() => {
                      setUrlModalChapterIdx(idx);
                      setCustomImgUrl('');
                      setCustomImgCaption('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs hover:text-[#0B63F6] transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>ছবির লিঙ্ক</span>
                  </button>

                  {/* Formula Box Insertion */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...bChapters];
                      updated[idx].content =
                        (updated[idx].content || '') +
                        '\n\n> ⚡ সূত্র: V = I × R (ভোল্টেজ = কারেন্ট × রেজিস্ট্যান্স)\n\n';
                      setBChapters(updated);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px] border border-emerald-200/60 dark:border-slate-700 shadow-xs hover:bg-emerald-50 transition"
                  >
                    <span>⚡ সূত্র যোগ</span>
                  </button>

                  {/* Bullet Points */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...bChapters];
                      updated[idx].content =
                        (updated[idx].content || '') +
                        '\n\n- মূল পয়েন্ট ১\n- মূল পয়েন্ট ২\n- মূল পয়েন্ট ৩\n';
                      setBChapters(updated);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 transition"
                  >
                    <span>• পয়েন্ট</span>
                  </button>

                  {/* Heading 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...bChapters];
                      updated[idx].content =
                        (updated[idx].content || '') +
                        '\n\n## নতুন সাব-হেডিং\nএখানে বিবরণ লিখুন...\n';
                      setBChapters(updated);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    H2
                  </button>
                </div>

                {/* Chapter Content Textarea (Full Bengali Typing) */}
                <div className="relative">
                  <textarea
                    rows={8}
                    value={ch.content}
                    onChange={(e) => {
                      const updated = [...bChapters];
                      updated[idx].content = e.target.value;
                      setBChapters(updated);
                    }}
                    placeholder="অধ্যায়ের বিস্তারিত বিষয়বস্তু বাংলায় লিখুন... আপনি যেকোনো কীবোর্ড দিয়ে স্বাভাবিকভাবে বাংলায় লিখতে পারবেন।"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-sans leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
                  />
                </div>

                {/* Attached Images Preview List */}
                {imgMatches.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-[#0B63F6]" />
                      <span>এই অধ্যায়ের ছবিসমূহ ({imgMatches.length}):</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {imgMatches.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="relative border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-white dark:bg-slate-800 flex items-center gap-2 shadow-2xs"
                        >
                          <img src={m[2]} alt={m[1]} className="w-10 h-10 object-cover rounded" />
                          <div className="max-w-[130px]">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                              {m[1]}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...bChapters];
                                updated[idx].content = updated[idx].content.replace(m[0], '');
                                setBChapters(updated);
                              }}
                              className="text-[10px] text-rose-500 hover:underline font-semibold"
                            >
                              মুছে ফেলুন
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-lg flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsEditorOpen(false)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSaveBook}
            className="px-6 py-2.5 bg-[#0B63F6] hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>বইটি সংরক্ষণ করুন</span>
          </button>
        </div>

        {/* Image URL Modal */}
        {urlModalChapterIdx !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">ছবির লিঙ্ক যোগ করুন</h4>
                <button onClick={() => setUrlModalChapterIdx(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">ছবির URL লিঙ্ক</label>
                <input
                  type="url"
                  value={customImgUrl}
                  onChange={(e) => setCustomImgUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">ছবির ক্যাপশন (বাংলা)</label>
                <input
                  type="text"
                  value={customImgCaption}
                  onChange={(e) => setCustomImgCaption(e.target.value)}
                  placeholder="যেমন: সিঙ্গেল ফেজ মিটার ওয়্যারিং ডায়াগ্রাম"
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUrlModalChapterIdx(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={!customImgUrl.trim()}
                  onClick={handleConfirmImageUrl}
                  className="px-4 py-1.5 bg-[#0B63F6] text-white text-xs font-bold rounded-xl disabled:opacity-40"
                >
                  যোগ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. BOOK LIST VIEW (সকল ইউজারদের জন্য পড়ার তালিকা — শুধুমাত্র অ্যাডমিন এডিট করতে পারে)
  // =========================================================================
  if (!selectedBook) {
    return (
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full relative">
        {/* Toast feedback */}
        {editorToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{editorToast}</span>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B63F6] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {filteredBooks.length} {lang === 'bn' ? 'টি বই' : 'Books'}
            </span>

            {/* ONLY ADMIN SEES WRITE BOOK BUTTON */}
            {isAdmin ? (
              <button
                onClick={handleOpenNewBook}
                className="px-3 py-1.5 bg-[#0B63F6] hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'অ্যাডমিন: নতুন বই লিখুন' : 'Admin: Write Book'}</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/50">
                ই-লাইব্রেরি
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'বই বা রেফারেন্স খুঁজুন...' : 'Search books & guides...'}
            className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 text-xs sm:text-sm font-medium"
          />
        </div>

        {/* Book Cards */}
        <div className="flex flex-col gap-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => {
                setSelectedBook(book);
                setActiveChapterIndex(0);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B63F6] rounded-2xl p-4 shadow-xs flex gap-3.5 cursor-pointer transition active:scale-[0.99] group"
            >
              {/* Cover Spine */}
              <div
                className={`w-14 h-20 rounded-xl bg-gradient-to-br ${book.coverColor || 'from-blue-600 to-indigo-800'} text-white p-2 flex flex-col justify-between shrink-0 shadow-md`}
              >
                <Book className="w-5 h-5 text-white/90" />
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-100 line-clamp-1">
                  E-BOOK
                </span>
              </div>

              {/* Book Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/50 truncate">
                      {book.category}
                    </span>

                    {/* ONLY LOGGED-IN ADMIN CAN SEE EDIT & DELETE BUTTONS */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={(e) => handleOpenEditBook(book, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#0B63F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="অ্যাডমিন সম্পাদনা"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteBook(book.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#0B63F6] transition">
                    {lang === 'bn' ? book.titleBn : book.titleEn}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    লেখক: {book.author}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {lang === 'bn' ? book.descriptionBn : book.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <span>{book.chapters.length} টি অধ্যায়</span>
                  <span className="text-[#0B63F6] font-bold flex items-center gap-0.5">
                    <span>পড়ুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ACTIVE READING MODE (বই পড়ার ভিউ ও জুম — সকল ইউজারের জন্য)
  // =========================================================================
  return (
    <div className="flex flex-col gap-3 max-w-lg mx-auto w-full">
      {/* Reader Nav & Zoom Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-xs gap-1.5">
        <button
          onClick={() => setSelectedBook(null)}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B63F6] shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'সকল বই' : 'All Books'}</span>
        </button>

        {/* Zoom In & Zoom Out Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => handleZoom(-15)}
            disabled={zoomLevel <= 70}
            className="h-7 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition active:scale-95"
            title="লেখা ছোট করুন (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="text-[11px]">A-</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold text-[#0B63F6] hover:bg-white dark:hover:bg-slate-700 transition"
            title="রিসেট করুন (100%)"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => handleZoom(15)}
            disabled={zoomLevel >= 220}
            className="h-7 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition active:scale-95"
            title="লেখা বড় করুন (Zoom In)"
          >
            <span className="text-[11px]">A+</span>
            <ZoomIn className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* ONLY ADMIN CAN EDIT FROM READER */}
          {isAdmin && (
            <button
              onClick={(e) => handleOpenEditBook(selectedBook, e)}
              className="p-1.5 text-slate-500 hover:text-[#0B63F6] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
              title="অ্যাডমিন হিসেবে সম্পাদনা করুন"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="flex items-center gap-1 text-xs font-bold text-[#0B63F6] bg-blue-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-blue-200/60 shrink-0"
          >
            <List className="w-3.5 h-3.5" />
            <span>সূচি ({activeChapterIndex + 1}/{selectedBook.chapters.length})</span>
          </button>
        </div>
      </div>

      {/* Chapter Selection Drawer */}
      {showChapterList && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            বইয়ের সকল অধ্যায়:
          </span>
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
            {selectedBook.chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  setShowChapterList(false);
                }}
                className={`text-left text-xs font-semibold p-2.5 rounded-xl transition flex items-center justify-between ${
                  activeChapterIndex === idx
                    ? 'bg-[#0B63F6] text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{ch.titleBn || ch.titleEn}</span>
                {activeChapterIndex === idx && <Bookmark className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reader Paper Card */}
      {activeChapter && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-[11px] font-bold text-[#0B63F6] uppercase tracking-wider block">
              {lang === 'bn' ? selectedBook.titleBn : selectedBook.titleEn}
            </span>
            <h1
              style={{ fontSize: `${Math.max(16, Math.round((22 * zoomLevel) / 100))}px`, lineHeight: 1.35 }}
              className="font-bold text-slate-900 dark:text-white mt-1 transition-all duration-150"
            >
              {activeChapter.titleBn || activeChapter.titleEn}
            </h1>
          </div>

          {/* Chapter Content Typography & Images with Scaled Zoom Level */}
          <div
            className="flex flex-col gap-1 transition-all duration-150 origin-top"
            style={{ fontSize: `${zoomLevel}%` }}
          >
            {renderFormattedContent(activeChapter.content)}
          </div>

          {/* Bottom Next/Prev Chapter buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              disabled={activeChapterIndex === 0}
              onClick={() => setActiveChapterIndex((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
            >
              ← আগের অধ্যায়
            </button>

            <button
              disabled={activeChapterIndex >= selectedBook.chapters.length - 1}
              onClick={() =>
                setActiveChapterIndex((prev) => Math.min(selectedBook.chapters.length - 1, prev + 1))
              }
              className="px-3.5 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
            >
              <span>পরবর্তী অধ্যায়</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for Diagrams and Schematics */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 flex flex-col items-center shadow-2xl"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage.url}
              alt={zoomedImage.caption}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl bg-white dark:bg-slate-950 p-1"
            />
            {zoomedImage.caption && (
              <span className="text-xs font-semibold text-slate-300 mt-2 text-center px-4">
                {zoomedImage.caption}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
