import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Mail,
  Plus,
  Trash2,
  Edit3,
  Play,
  Save,
  Download,
  BookOpen,
  FileText,
  FolderPlus,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
  RotateCcw,
  LogOut,
  ShieldAlert,
  Sliders,
  Bookmark,
} from 'lucide-react';
import { Language, CustomTool, CustomToolInput, BookItem, BookChapter, NoteFolder, NoteItem } from '../../types';
import {
  AUTHORIZED_ADMIN_EMAIL,
  getAdminSession,
  verifyAdminCredentials,
  clearAdminSession,
  getAdminPassword,
  setAdminPassword,
} from '../../utils/adminAuth';
import {
  getStoredCustomTools,
  saveStoredCustomTools,
  addCustomTool,
  deleteCustomTool,
  evaluateCustomFormula,
} from '../../utils/customToolsStorage';
import { getStoredBooks, saveStoredBooks, addOrUpdateBook, deleteBook } from '../../utils/booksStorage';
import {
  getStoredFolders,
  saveStoredFolders,
  addFolder,
  deleteFolder,
  getStoredNotes,
  saveStoredNotes,
  addOrUpdateNote,
  deleteNote,
} from '../../utils/notesStorage';

interface Props {
  lang: Language;
  onOpenTool?: (toolId: string) => void;
  onRefreshTools?: () => void;
}

type AdminTab = 'books' | 'notes' | 'tools' | 'backup' | 'security';

export const AdminPanel: React.FC<Props> = ({ lang, onOpenTool, onRefreshTools }) => {
  // Auth state
  const [emailInput, setEmailInput] = useState<string>(AUTHORIZED_ADMIN_EMAIL);
  const [passInput, setPassInput] = useState<string>('');
  const [session, setSession] = useState(getAdminSession());
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<AdminTab>('books');

  // ==========================================
  // BOOKS STATE
  // ==========================================
  const [books, setBooks] = useState<BookItem[]>(getStoredBooks());
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState<boolean>(false);
  const [bTitleBn, setBTitleBn] = useState<string>('');
  const [bTitleEn, setBTitleEn] = useState<string>('');
  const [bAuthor, setBAuthor] = useState<string>('জুলফিকার হাসান');
  const [bCategory, setBCategory] = useState<string>('ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং');
  const [bDescBn, setBDescBn] = useState<string>('');
  const [bCoverColor, setBCoverColor] = useState<string>('from-blue-600 to-indigo-800');
  const [bChapters, setBChapters] = useState<BookChapter[]>([
    { id: 'ch-1', titleBn: 'অধ্যায় ১: ভূমিকা ও বেসিক', titleEn: 'Chapter 1: Basics', content: 'এখানে বিস্তারিত বিষয়বস্তু লিখুন...' },
  ]);

  // ==========================================
  // NOTES & FOLDERS STATE
  // ==========================================
  const [folders, setFolders] = useState<NoteFolder[]>(getStoredFolders());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>('#0B63F6');
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteFormula, setNoteFormula] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteFolderId, setNoteFolderId] = useState<string>(folders[0]?.id || 'f-formula');
  const [noteTags, setNoteTags] = useState<string>('ইলেকট্রিক্যাল, সূত্র');
  const [noteIsPinned, setNoteIsPinned] = useState<boolean>(false);

  // ==========================================
  // CALCULATORS STATE
  // ==========================================
  const [tools, setTools] = useState<CustomTool[]>(getStoredCustomTools());
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  const [isCreatingTool, setIsCreatingTool] = useState<boolean>(false);
  const [formTitleBn, setFormTitleBn] = useState<string>('');
  const [formTitleEn, setFormTitleEn] = useState<string>('');
  const [formDescBn, setFormDescBn] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'electrical' | 'utility' | 'finance' | 'daily'>('electrical');
  const [formFormula, setFormFormula] = useState<string>('v * i');
  const [formOutputLabelBn, setFormOutputLabelBn] = useState<string>('মোট শক্তি');
  const [formOutputUnit, setFormOutputUnit] = useState<string>('Watts');
  const [formInputs, setFormInputs] = useState<CustomToolInput[]>([
    { id: '1', labelEn: 'Voltage (V)', labelBn: 'ভোল্টেজ (V)', variable: 'v', defaultValue: 220, unit: 'V' },
    { id: '2', labelEn: 'Current (A)', labelBn: 'কারেন্ট (A)', variable: 'i', defaultValue: 5, unit: 'A' },
  ]);
  const [testVals, setTestVals] = useState<Record<string, number>>({ v: 220, i: 5 });
  const [testResult, setTestResult] = useState<string | null>(null);

  // ==========================================
  // SECURITY & BACKUP
  // ==========================================
  const [newPass, setNewPass] = useState<string>('');
  const [passMessage, setPassMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyAdminCredentials(emailInput, passInput);
    if (res.success) {
      setSession(getAdminSession());
      setAuthError(null);
      setPassInput('');
    } else {
      setAuthError(res.error || 'Login failed');
    }
  };

  // Logout handler
  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  // Save Book Handler
  const handleSaveBook = () => {
    if (!bTitleBn.trim()) {
      alert('বইয়ের শিরোনাম দিন।');
      return;
    }
    const bookObj: BookItem = {
      id: editingBook ? editingBook.id : `book-${Date.now()}`,
      titleBn: bTitleBn.trim(),
      titleEn: bTitleEn.trim() || bTitleBn.trim(),
      author: bAuthor.trim() || 'জুলফিকার হাসান',
      category: bCategory,
      coverColor: bCoverColor,
      descriptionBn: bDescBn.trim() || 'রেফারেন্স গাইড',
      descriptionEn: bDescBn.trim() || 'Reference guide',
      chapters: bChapters,
      createdAt: editingBook ? editingBook.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    addOrUpdateBook(bookObj);
    setBooks(getStoredBooks());
    setIsCreatingBook(false);
    setEditingBook(null);
  };

  // Save Note Handler
  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      alert('নোটের শিরোনাম দিন।');
      return;
    }
    const noteObj: NoteItem = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      folderId: noteFolderId,
      title: noteTitle.trim(),
      formula: noteFormula.trim() || undefined,
      content: noteContent.trim(),
      tags: noteTags.split(',').map((t) => t.trim()).filter(Boolean),
      isPinned: noteIsPinned,
      createdAt: editingNote ? editingNote.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    addOrUpdateNote(noteObj);
    setNotes(getStoredNotes());
    setIsCreatingNote(false);
    setEditingNote(null);
  };

  // Create Folder Handler
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const fObj: NoteFolder = {
      id: `f-${Date.now()}`,
      nameBn: newFolderName.trim(),
      nameEn: newFolderName.trim(),
      color: newFolderColor,
    };
    addFolder(fObj);
    setFolders(getStoredFolders());
    setNewFolderName('');
  };

  // ==========================================
  // VIEW: STRICT EMAIL AUTHENTICATION SCREEN
  // ==========================================
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-6 max-w-sm mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md w-full flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0B63F6] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            অ্যাডমিন লগইন
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            শুধুমাত্র অনুমোদিত ডেভেলপার ইমেইল দিয়ে লগইন করতে পারবেন। অন্য কারো প্রবেশাধিকার নেই।
          </p>

          <form onSubmit={handleLogin} className="w-full mt-5 flex flex-col gap-3">
            {/* Email input */}
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                অ্যাডমিন ইমেইল (Admin Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="zulfiqar1hasan@gmail.com"
                  className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password input */}
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="ডিফল্ট পাসওয়ার্ড: zulfiqar2026"
                  className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-semibold leading-relaxed text-left flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white font-bold rounded-xl transition active:scale-98 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-xs mt-1"
            >
              <Unlock className="w-4 h-4" />
              <span>লগইন করে প্রবেশ করুন</span>
            </button>
          </form>

          <div className="mt-4 p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800/80 text-[11px] text-slate-500 w-full text-left flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0B63F6] shrink-0 mt-0.5" />
            <span>
              লক করা ইমেইল: <strong className="text-[#0B63F6]">{AUTHORIZED_ADMIN_EMAIL}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATED MASTER ADMIN STUDIO
  // ==========================================
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-[#0B63F6] to-blue-800 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-full">
            Master Admin Panel
          </span>
          <h1 className="text-base sm:text-lg font-bold mt-1">
            জুলফিকার হাসান ক্রিয়েটর স্টুডিও
          </h1>
          <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            <span>{AUTHORIZED_ADMIN_EMAIL}</span>
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-semibold flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট</span>
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl no-scrollbar">
        {[
          { id: 'books', label: 'বই রাইটার', icon: BookOpen },
          { id: 'notes', label: 'নোট ও সূত্র খাতা', icon: FileText },
          { id: 'tools', label: 'ক্যালকুলেটর বিল্ডার', icon: Cpu },
          { id: 'backup', label: 'ব্যাকআপ ও JSON', icon: Download },
          { id: 'security', label: 'পাসওয়ার্ড', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: BOOKS & GUIDES WRITER (বই ও গাইড রাইটার)
         ========================================================================= */}
      {activeTab === 'books' && (
        <div className="flex flex-col gap-4">
          {!isCreatingBook && !editingBook ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  আপনার প্রকাশিত বইসমূহ ({books.length})
                </span>
                <button
                  onClick={() => {
                    setIsCreatingBook(true);
                    setBTitleBn('');
                    setBTitleEn('');
                    setBDescBn('');
                    setBChapters([
                      { id: 'ch-1', titleBn: 'অধ্যায় ১: শিরোনাম', titleEn: 'Chapter 1', content: '' },
                    ]);
                  }}
                  className="px-3 py-1.5 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন বই লিখুন</span>
                </button>
              </div>

              {/* Book Cards */}
              <div className="flex flex-col gap-3">
                {books.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0B63F6]">
                        {b.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {b.titleBn}
                      </h3>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {b.chapters.length} টি অধ্যায় · লেখক: {b.author}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBook(b);
                          setBTitleBn(b.titleBn);
                          setBTitleEn(b.titleEn);
                          setBAuthor(b.author);
                          setBCategory(b.category);
                          setBDescBn(b.descriptionBn);
                          setBCoverColor(b.coverColor);
                          setBChapters(b.chapters);
                        }}
                        className="p-2 text-slate-400 hover:text-[#0B63F6]"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('বইটি মুছে ফেলতে চান?')) {
                            deleteBook(b.id);
                            setBooks(getStoredBooks());
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* CREATE / EDIT BOOK FORM */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingBook ? 'বই সম্পাদনা করুন' : 'নতুন বই লিখুন'}
                </h3>
                <button
                  onClick={() => { setIsCreatingBook(false); setEditingBook(null); }}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">বইয়ের নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={bTitleBn}
                    onChange={(e) => setBTitleBn(e.target.value)}
                    placeholder="e.g. অ্যাডভান্সড ইলেকট্রিক্যাল ওয়্যারিং"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={bCategory}
                    onChange={(e) => setBCategory(e.target.value)}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">সংক্ষিপ্ত বিবরণ</label>
                  <textarea
                    rows={2}
                    value={bDescBn}
                    onChange={(e) => setBDescBn(e.target.value)}
                    placeholder="বইটি পড়ার পর পাঠক কী কী জানতে পারবেন..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Chapters Editor */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    অধ্যায়সমূহ (Chapters):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBChapters([
                        ...bChapters,
                        { id: `ch-${Date.now()}`, titleBn: `অধ্যায় ${bChapters.length + 1}: শিরোনাম`, titleEn: `Chapter ${bChapters.length + 1}`, content: '' },
                      ]);
                    }}
                    className="px-2.5 py-1 bg-blue-50 text-[#0B63F6] rounded-lg text-xs font-bold"
                  >
                    + Add Chapter
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {bChapters.map((ch, idx) => (
                    <div key={ch.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={ch.titleBn}
                          onChange={(e) => {
                            const updated = [...bChapters];
                            updated[idx].titleBn = e.target.value;
                            setBChapters(updated);
                          }}
                          className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 pb-0.5 w-3/4"
                        />
                        {bChapters.length > 1 && (
                          <button
                            onClick={() => setBChapters(bChapters.filter((_, i) => i !== idx))}
                            className="text-xs text-rose-500 font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={5}
                        value={ch.content}
                        onChange={(e) => {
                          const updated = [...bChapters];
                          updated[idx].content = e.target.value;
                          setBChapters(updated);
                        }}
                        placeholder="অধ্যায়ের বিস্তারিত পাঠ্যবস্তু ও সূত্র লিখুন..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-sans"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setIsCreatingBook(false); setEditingBook(null); }}
                  className="px-4 py-2 border rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSaveBook}
                  className="px-5 py-2 bg-[#0B63F6] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>বইটি সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: NOTEPAD & FORMULAS (নোট ও সূত্র খাতা)
         ========================================================================= */}
      {activeTab === 'notes' && (
        <div className="flex flex-col gap-4">
          {/* Create Folder Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5">
            <span className="text-xs font-black uppercase text-slate-500">
              নতুন ফোল্ডার বা সেকশন তৈরি করুন:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="ফোল্ডারের নাম (e.g. জেনারেটর নোটস)"
                className="flex-1 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 h-9 bg-[#0B63F6] text-white text-xs font-bold rounded-xl shrink-0"
              >
                + ফোল্ডার যোগ
              </button>
            </div>
            {/* Folder Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {folders.map((f) => (
                <span key={f.id} className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-[#0B63F6] flex items-center gap-1">
                  📁 {f.nameBn}
                  {folders.length > 1 && (
                    <button
                      onClick={() => {
                        deleteFolder(f.id);
                        setFolders(getStoredFolders());
                      }}
                      className="ml-1 hover:text-rose-500"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Notes Manager */}
          {!isCreatingNote && !editingNote ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  নোট ও সূত্র তালিকা ({notes.length})
                </span>
                <button
                  onClick={() => {
                    setIsCreatingNote(true);
                    setNoteTitle('');
                    setNoteFormula('');
                    setNoteContent('');
                  }}
                  className="px-3 py-1.5 bg-[#0B63F6] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন সূত্র বা নোট</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {notes.map((n) => (
                  <div key={n.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-start justify-between shadow-xs">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</h4>
                      {n.formula && <span className="font-mono text-[11px] text-[#0B63F6] block font-bold mt-0.5">{n.formula}</span>}
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{n.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingNote(n);
                          setNoteTitle(n.title);
                          setNoteFormula(n.formula || '');
                          setNoteContent(n.content);
                          setNoteFolderId(n.folderId);
                        }}
                        className="p-1 text-slate-400 hover:text-[#0B63F6]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteNote(n.id);
                          setNotes(getStoredNotes());
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* CREATE / EDIT NOTE FORM */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                {editingNote ? 'নোট সম্পাদনা' : 'নতুন সূত্র বা নোট লিখুন'}
              </h3>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">ফোল্ডার নির্বাচন করুন</label>
                <select
                  value={noteFolderId}
                  onChange={(e) => setNoteFolderId(e.target.value)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.nameBn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">শিরোনাম</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. ভোল্টেজ ড্রপ থাম্বরুল"
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">সূত্র (Formula - ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={noteFormula}
                  onChange={(e) => setNoteFormula(e.target.value)}
                  placeholder="e.g. V = I × R"
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-mono font-bold text-[#0B63F6]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">বিস্তারিত নোট</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="সূত্র বা কাজের নিয়ম এখানে নোট রাখুন..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setIsCreatingNote(false); setEditingNote(null); }}
                  className="px-3 py-1.5 border rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 bg-[#0B63F6] text-white rounded-xl text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: CUSTOM CALCULATORS BUILDER
         ========================================================================= */}
      {activeTab === 'tools' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              কাস্টম ক্যালকুলেটর তালিকা ({tools.length})
            </span>
            <button
              onClick={() => {
                setIsCreatingTool(true);
                setFormTitleBn('');
                setFormFormula('a * b');
              }}
              className="px-3 py-1.5 bg-[#0B63F6] text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন ক্যালকুলেটর</span>
            </button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2.5">
            {tools.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.titleBn}</h4>
                  <span className="font-mono text-[11px] text-emerald-600 font-bold block mt-0.5">{t.formula}</span>
                </div>
                <button
                  onClick={() => {
                    deleteCustomTool(t.id);
                    setTools(getStoredCustomTools());
                    if (onRefreshTools) onRefreshTools();
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BACKUP & JSON EXPORT
         ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3 text-left">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            সম্পূর্ণ ডেটা ব্যাকআপ ও এক্সপোর্ট
          </h3>
          <p className="text-xs text-slate-500">
            আপনার লেখা সকল বই, নোট, সূত্র এবং কাস্টম ক্যালকুলেটর এক ক্লিকে ব্যাকআপ ফাইল আকারে কপি করে সংরক্ষণ করুন।
          </p>

          <button
            onClick={() => {
              const fullBackup = {
                books: getStoredBooks(),
                notes: getStoredNotes(),
                folders: getStoredFolders(),
                tools: getStoredCustomTools(),
                exportedAt: new Date().toISOString(),
                admin: AUTHORIZED_ADMIN_EMAIL,
              };
              navigator.clipboard.writeText(JSON.stringify(fullBackup, null, 2));
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2000);
            }}
            className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
          >
            {copySuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{copySuccess ? 'সম্পূর্ণ ব্যাকআপ কপি হয়েছে!' : 'সম্পূর্ণ ব্যাকআপ JSON কপি করুন'}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SECURITY & MASTER PASSWORD
         ========================================================================= */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3 text-left">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            অ্যাডমিন পাসওয়ার্ড পরিবর্তন
          </h3>
          <p className="text-xs text-slate-500">
            লগইন করার জন্য নতুন একটি সিক্রেট পাসওয়ার্ড সেট করুন (বর্তমান পাসওয়ার্ড: {getAdminPassword()})।
          </p>

          <div className="flex gap-2 mt-1">
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড লিখুন"
              className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
            />
            <button
              onClick={() => {
                if (newPass.trim().length >= 4) {
                  setAdminPassword(newPass.trim());
                  setPassMessage('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
                  setNewPass('');
                  setTimeout(() => setPassMessage(null), 2500);
                } else {
                  alert('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
                }
              }}
              className="px-4 h-10 bg-[#0B63F6] text-white rounded-xl text-xs font-bold shrink-0"
            >
              সংরক্ষণ
            </button>
          </div>
          {passMessage && <span className="text-xs text-emerald-500 font-bold">{passMessage}</span>}
        </div>
      )}
    </div>
  );
};
