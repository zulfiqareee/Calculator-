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
} from 'lucide-react';
import { BookItem, BookChapter, Language } from '../../types';
import { getStoredBooks } from '../../utils/booksStorage';

interface Props {
  lang: Language;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}

export const BookReaderView: React.FC<Props> = ({ lang, onBack, onOpenAdmin }) => {
  const [books, setBooks] = useState<BookItem[]>(getStoredBooks());
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [showChapterList, setShowChapterList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeChapter: BookChapter | null = selectedBook && selectedBook.chapters[activeChapterIndex]
    ? selectedBook.chapters[activeChapterIndex]
    : null;

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

  // BOOK LIST VIEW
  if (!selectedBook) {
    return (
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
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
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-xs font-bold text-[#0B63F6] hover:underline"
              >
                {lang === 'bn' ? '+ নতুন বই লিখুন' : '+ Write Book'}
              </button>
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0B63F6] rounded-2xl p-4 shadow-xs flex gap-3.5 cursor-pointer transition active:scale-98"
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
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/50">
                      {book.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
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

  // ACTIVE READING MODE
  return (
    <div className="flex flex-col gap-3 max-w-lg mx-auto w-full">
      {/* Reader Nav Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-xs">
        <button
          onClick={() => setSelectedBook(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B63F6]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? 'সকল বই' : 'All Books'}</span>
        </button>

        <button
          onClick={() => setShowChapterList(!showChapterList)}
          className="flex items-center gap-1 text-xs font-bold text-[#0B63F6] bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-blue-200/60"
        >
          <List className="w-3.5 h-3.5" />
          <span>সূচিপত্র ({activeChapterIndex + 1}/{selectedBook.chapters.length})</span>
        </button>
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
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              {activeChapter.titleBn || activeChapter.titleEn}
            </h1>
          </div>

          {/* Chapter Content Typography */}
          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {activeChapter.content}
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
    </div>
  );
};
