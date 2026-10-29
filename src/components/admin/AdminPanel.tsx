import React, { useState, useEffect, useRef } from 'react';
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
  Book,
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
  Image as ImageIcon,
  Link,
  Upload,
  Info,
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
import {
  QuranSurah,
  QuranAyah,
  getStoredSurahs,
  addOrUpdateSurah,
  deleteSurah,
  resetSurahsToDefault,
} from '../../utils/quranStorage';

interface Props {
  lang: Language;
  onOpenTool?: (toolId: string) => void;
  onRefreshTools?: () => void;
}

type AdminTab = 'books' | 'quran' | 'notes' | 'tools' | 'backup' | 'security';

export const AdminPanel: React.FC<Props> = ({ lang, onOpenTool, onRefreshTools }) => {
  // Auth state
  const [emailInput, setEmailInput] = useState<string>('zulfiqar1hasan@gmail.com');
  const [passInput, setPassInput] = useState<string>('');
  const [session, setSession] = useState(getAdminSession());
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<AdminTab>('books');

  // ==========================================
  // QURAN SURAH & AYAH WRITER STATE FOR ADMIN
  // ==========================================
  const [quranSurahs, setQuranSurahs] = useState<QuranSurah[]>(getStoredSurahs());
  const [editingSurah, setEditingSurah] = useState<QuranSurah | null>(null);
  const [isCreatingSurah, setIsCreatingSurah] = useState<boolean>(false);
  const [qSurahNum, setQSurahNum] = useState<number>(1);
  const [qNameBn, setQNameBn] = useState<string>('');
  const [qNameEn, setQNameEn] = useState<string>('');
  const [qNameAr, setQNameAr] = useState<string>('');
  const [qMeaningBn, setQMeaningBn] = useState<string>('');
  const [qRevType, setQRevType] = useState<'মাক্কী' | 'মাদানী'>('মাক্কী');
  const [qAyahs, setQAyahs] = useState<QuranAyah[]>([
    { ayahNumber: 1, arabic: '', pronunciation: '', bangla: '' },
  ]);
  const [adminQuranSearch, setAdminQuranSearch] = useState<string>('');
  const [quranSuccessMsg, setQuranSuccessMsg] = useState<string | null>(null);

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
    const effectiveTitle = bTitleBn.trim() || "নতুন ইলেকট্রিক্যাল গাইড";
    const bookObj: BookItem = {
      id: editingBook ? editingBook.id : `book-${Date.now()}`,
      titleBn: effectiveTitle,
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
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          const caption = prompt('ছবির ক্যাপশন বা শিরোনাম দিন (যেমন: ওয়্যারিং সার্কিট চিত্র):', 'সার্কিট ডায়াগ্রাম') || 'চিত্র';
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

  // Insert image to chapter from web URL
  const handleInsertImageUrl = (chapterIndex: number) => {
    const url = prompt('ছবির সরাসরি ওয়েব লিঙ্ক (Image URL) দিন:');
    if (!url || !url.trim()) return;
    const caption = prompt('ছবির ক্যাপশন বা শিরোনাম দিন:', 'সার্কিট চিত্র') || 'চিত্র';
    const markdownImg = `\n\n![${caption}](${url.trim()})\n\n`;
    const updated = [...bChapters];
    updated[chapterIndex].content = (updated[chapterIndex].content || '') + markdownImg;
    setBChapters(updated);
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
  // CUSTOM CALCULATORS HANDLERS & PRESETS
  // ==========================================
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'single-phase-p':
        setFormTitleBn('সিঙ্গেল ফেজ এসি পাওয়ার (Watt)');
        setFormTitleEn('Single Phase AC Power');
        setFormDescBn('ভোল্টেজ, কারেন্ট ও পাওয়ার ফ্যাক্টরের সাহায্যে মোট পাওয়ার (W) গণনা।');
        setFormCategory('electrical');
        setFormFormula('v * i * pf');
        setFormOutputLabelBn('মোট কার্যকর শক্তি');
        setFormOutputUnit('Watts');
        setFormInputs([
          { id: '1', labelBn: 'ভোল্টেজ (V)', labelEn: 'Voltage (V)', variable: 'v', defaultValue: 220, unit: 'V' },
          { id: '2', labelBn: 'কারেন্ট (I)', labelEn: 'Current (I)', variable: 'i', defaultValue: 5, unit: 'A' },
          { id: '3', labelBn: 'পাওয়ার ফ্যাক্টর (PF)', labelEn: 'Power Factor', variable: 'pf', defaultValue: 0.85, unit: 'cos θ', step: 0.01 },
        ]);
        setTestVals({ v: 220, i: 5, pf: 0.85 });
        break;

      case 'three-phase-kw':
        setFormTitleBn('৩-ফেজ মোট পাওয়ার (kW)');
        setFormTitleEn('3-Phase Power (kW)');
        setFormDescBn('৩-ফেজ লাইনে ভোল্টেজ, কারেন্ট ও পিএফ দিয়ে মোট কিলোওয়াট হিসাব।');
        setFormCategory('electrical');
        setFormFormula('(Math.sqrt(3) * v * i * pf) / 1000');
        setFormOutputLabelBn('মোট ৩-ফেজ পাওয়ার');
        setFormOutputUnit('kW');
        setFormInputs([
          { id: '1', labelBn: 'লাইন ভোল্টেজ (V)', labelEn: 'Line Voltage (V)', variable: 'v', defaultValue: 415, unit: 'V' },
          { id: '2', labelBn: 'ফেজ কারেন্ট (A)', labelEn: 'Line Current (A)', variable: 'i', defaultValue: 25, unit: 'A' },
          { id: '3', labelBn: 'পাওয়ার ফ্যাক্টর', labelEn: 'Power Factor', variable: 'pf', defaultValue: 0.85, unit: 'cos θ', step: 0.01 },
        ]);
        setTestVals({ v: 415, i: 25, pf: 0.85 });
        break;

      case 'motor-fla':
        setFormTitleBn('৩-ফেজ মোটর কারেন্ট (FLA)');
        setFormTitleEn('3-Phase Motor FLA');
        setFormDescBn('মোটর হর্সপাওয়ার (HP) থেকে ৩-ফেজ ফুল লোড অ্যাম্পিয়ার নির্ণয়।');
        setFormCategory('electrical');
        setFormFormula('(hp * 746) / (Math.sqrt(3) * v * (eff / 100) * pf)');
        setFormOutputLabelBn('ফুল লোড কারেন্ট (FLA)');
        setFormOutputUnit('Amps');
        setFormInputs([
          { id: '1', labelBn: 'মোটর ক্ষমতা (HP)', labelEn: 'Motor Horsepower', variable: 'hp', defaultValue: 10, unit: 'HP' },
          { id: '2', labelBn: 'লাইন ভোল্টেজ (V)', labelEn: 'Line Voltage', variable: 'v', defaultValue: 415, unit: 'V' },
          { id: '3', labelBn: 'মোটর দক্ষতা (%)', labelEn: 'Efficiency %', variable: 'eff', defaultValue: 88, unit: '%' },
          { id: '4', labelBn: 'পাওয়ার ফ্যাক্টর (PF)', labelEn: 'Power Factor', variable: 'pf', defaultValue: 0.85, unit: 'cos θ', step: 0.01 },
        ]);
        setTestVals({ hp: 10, v: 415, eff: 88, pf: 0.85 });
        break;

      case 'cap-reactance':
        setFormTitleBn('ক্যাপাসিটিভ রিঅ্যাকট্যান্স (Xc)');
        setFormTitleEn('Capacitive Reactance (Xc)');
        setFormDescBn('ফ্রিকোয়েন্সি এবং ক্যাপাসিট্যান্স মান থেকে ক্যাপাসিটিভ রেজিস্ট্যান্স (ওহম)।');
        setFormCategory('electrical');
        setFormFormula('1 / (2 * Math.PI * f * (c / 1000000))');
        setFormOutputLabelBn('রিঅ্যাকট্যান্স মান (Xc)');
        setFormOutputUnit('Ω');
        setFormInputs([
          { id: '1', labelBn: 'ফ্রিকোয়েন্সি (Hz)', labelEn: 'Frequency (Hz)', variable: 'f', defaultValue: 50, unit: 'Hz' },
          { id: '2', labelBn: 'ক্যাপাসিট্যান্স (µF)', labelEn: 'Capacitance (µF)', variable: 'c', defaultValue: 25, unit: 'µF' },
        ]);
        setTestVals({ f: 50, c: 25 });
        break;

      case 'battery-time':
        setFormTitleBn('ব্যাটারি চার্জিং সময় (ঘণ্টা)');
        setFormTitleEn('Battery Charge Time');
        setFormDescBn('ব্যাটারি ক্যাপাসিটি (Ah) এবং চার্জার কারেন্ট দিয়ে ফুল চার্জ হতে প্রয়োজনীয় সময়।');
        setFormCategory('electrical');
        setFormFormula('(ah * 1.2) / i');
        setFormOutputLabelBn('চার্জ হতে প্রয়োজনীয় সময়');
        setFormOutputUnit('ঘণ্টা');
        setFormInputs([
          { id: '1', labelBn: 'ব্যাটারি রেটিং (Ah)', labelEn: 'Battery Rating (Ah)', variable: 'ah', defaultValue: 100, unit: 'Ah' },
          { id: '2', labelBn: 'চার্জার কারেন্ট (A)', labelEn: 'Charger Current (A)', variable: 'i', defaultValue: 10, unit: 'A' },
        ]);
        setTestVals({ ah: 100, i: 10 });
        break;

      case 'custom-blank':
        setFormTitleBn('');
        setFormTitleEn('');
        setFormDescBn('');
        setFormCategory('electrical');
        setFormFormula('a * b');
        setFormOutputLabelBn('ফলাফল');
        setFormOutputUnit('একক');
        setFormInputs([
          { id: '1', labelBn: 'ইনপুট ১ (A)', labelEn: 'Input 1 (A)', variable: 'a', defaultValue: 10, unit: 'মান' },
          { id: '2', labelBn: 'ইনপুট ২ (B)', labelEn: 'Input 2 (B)', variable: 'b', defaultValue: 2, unit: 'মান' },
        ]);
        setTestVals({ a: 10, b: 2 });
        break;
    }
  };

  const handleEditTool = (tool: CustomTool) => {
    setEditingTool(tool);
    setIsCreatingTool(true);
    setFormTitleBn(tool.titleBn);
    setFormTitleEn(tool.titleEn);
    setFormDescBn(tool.descBn);
    setFormCategory(tool.category);
    setFormFormula(tool.formula);
    setFormOutputLabelBn(tool.outputLabelBn);
    setFormOutputUnit(tool.outputUnit);
    setFormInputs(tool.inputs);
    const initialTestVals: Record<string, number> = {};
    tool.inputs.forEach((inp) => {
      initialTestVals[inp.variable] = inp.defaultValue;
    });
    setTestVals(initialTestVals);
  };

  const handleSaveTool = () => {
    if (!formTitleBn.trim()) {
      alert('দয়া করে ক্যালকুলেটরের বাংলা নাম দিন।');
      return;
    }
    if (!formFormula.trim()) {
      alert('দয়া করে গণনার সূত্র (Formula) প্রদান করুন।');
      return;
    }
    if (formInputs.length === 0) {
      alert('কমপক্ষে একটি ইনপুট প্যারামিটার যোগ করুন।');
      return;
    }

    const testEval = evaluateCustomFormula(formFormula, testVals);
    if (!testEval.success) {
      if (!confirm(`সূত্রে সতর্কতা রয়েছে: "${testEval.error}"। তবুও কি সংরক্ষণ করতে চান?`)) {
        return;
      }
    }

    const toolObj: CustomTool = {
      id: editingTool ? editingTool.id : `custom-tool-${Date.now()}`,
      titleBn: formTitleBn.trim(),
      titleEn: formTitleEn.trim() || formTitleBn.trim(),
      descBn: formDescBn.trim() || `${formTitleBn} নিখুঁতভাবে গণনার জন্য স্মার্ট ডিজিটাল টুল।`,
      descEn: formDescBn.trim() || 'Custom calculation utility',
      category: formCategory,
      badgeBn: 'কাস্টম',
      badgeEn: 'Custom',
      iconName: 'Cpu',
      gradient: 'from-blue-600 to-indigo-700',
      inputs: formInputs,
      formula: formFormula.trim(),
      outputLabelBn: formOutputLabelBn.trim() || 'ফলাফল',
      outputLabelEn: formOutputLabelBn.trim() || 'Calculated Result',
      outputUnit: formOutputUnit.trim() || '',
      formulaDesc: `সূত্র: ${formFormula}`,
      createdAt: editingTool ? editingTool.createdAt : Date.now(),
    };

    addCustomTool(toolObj);
    setTools(getStoredCustomTools());
    if (onRefreshTools) onRefreshTools();
    setIsCreatingTool(false);
    setEditingTool(null);
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
            সিস্টেম পরিচালনা ও কনটেন্ট ব্যবস্থাপনার জন্য অনুমোদিত অ্যাকাউন্টে লগইন করুন।
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
                  placeholder="আপনার অনুমোদিত ইমেইল লিখুন"
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
                  placeholder="গোপন পাসওয়ার্ড লিখুন"
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

          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-400 w-full text-center flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>শুধুমাত্র অনুমোদিত সিস্টেম অ্যাডমিনদের জন্য এনক্রিপ্ট করা ও সুরক্ষিত</span>
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
          { id: 'quran', label: 'আল-কুরআন', icon: Book },
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
                  {bChapters.map((ch, idx) => {
                    const imgMatches = Array.from(ch.content.matchAll(/!\[(.*?)\]\((.*?)\)/g));

                    return (
                      <div key={ch.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={ch.titleBn}
                            onChange={(e) => {
                              const updated = [...bChapters];
                              updated[idx].titleBn = e.target.value;
                              setBChapters(updated);
                            }}
                            placeholder="অধ্যায়ের শিরোনাম..."
                            className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 pb-0.5 w-3/4"
                          />
                          {bChapters.length > 1 && (
                            <button
                              onClick={() => setBChapters(bChapters.filter((_, i) => i !== idx))}
                              className="text-xs text-rose-500 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Chapter Visual Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                          {/* Device Image Upload Button */}
                          <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold flex items-center gap-1 text-[11px] transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>+ ছবি আপলোড (গ্যালারি)</span>
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

                          {/* Web Image URL Button */}
                          <button
                            type="button"
                            onClick={() => handleInsertImageUrl(idx)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0B63F6] font-bold flex items-center gap-1 text-[11px] transition"
                          >
                            <Link className="w-3.5 h-3.5" />
                            <span>ছবির লিঙ্ক</span>
                          </button>

                          {/* Quick Formula Callout */}
                          <button
                            type="button"
                            onClick={() => {
                              const formula = prompt('সূত্রটি লিখুন (যেমন: P = V × I × cosθ):', 'V = I × R');
                              if (formula) {
                                const updated = [...bChapters];
                                updated[idx].content = (updated[idx].content || '') + `\n\n> ⚡ সূত্র: ${formula}\n\n`;
                                setBChapters(updated);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold flex items-center gap-1 text-[11px] transition"
                          >
                            <span>⚡ সূত্র বক্স</span>
                          </button>

                          {/* Quick Bullet List */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...bChapters];
                              updated[idx].content = (updated[idx].content || '') + `\n\n- পয়েন্ট ১\n- পয়েন্ট ২\n`;
                              setBChapters(updated);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]"
                          >
                            <span>• পয়েন্ট</span>
                          </button>
                        </div>

                        {/* Textarea */}
                        <textarea
                          rows={6}
                          value={ch.content}
                          onChange={(e) => {
                            const updated = [...bChapters];
                            updated[idx].content = e.target.value;
                            setBChapters(updated);
                          }}
                          placeholder="অধ্যায়ের বিস্তারিত বিষয়বস্তু লিখুন... উপরের বাটন দিয়ে যেকোনো জায়গায় ছবি ও সূত্র যুক্ত করতে পারেন।"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-sans leading-relaxed focus:ring-2 focus:ring-[#0B63F6] focus:outline-none"
                        />

                        {/* Thumbnails of Added Images */}
                        {imgMatches.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-[#0B63F6]" />
                              <span>এই অধ্যায়ে যুক্ত ছবিসমূহ ({imgMatches.length}):</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {imgMatches.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="relative group border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-800 flex items-center gap-1.5"
                                >
                                  <img src={m[2]} alt={m[1]} className="w-10 h-10 object-cover rounded" />
                                  <div className="max-w-[120px]">
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block truncate">
                                      {m[1]}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`"${m[1]}" ছবিটি অধ্যায় থেকে মুছে ফেলবেন?`)) {
                                          const updated = [...bChapters];
                                          updated[idx].content = updated[idx].content.replace(m[0], '');
                                          setBChapters(updated);
                                        }
                                      }}
                                      className="text-[9px] text-rose-500 hover:underline font-semibold"
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
          TAB: QURAN WRITER & MANAGER (পবিত্র কুরআন সূরা ও আয়াত লেখক)
         ========================================================================= */}
      {activeTab === 'quran' && (
        <div className="flex flex-col gap-4">
          {!isCreatingSurah && !editingSurah ? (
            <>
              {/* Header Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Book className="w-4 h-4" />
                    <span>পবিত্র কুরআনুল কারীম লেখক ও সম্পাদক</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    অ্যাডমিন প্যানেল
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  কুরআন সূরা ও আয়াতসমূহ লিখুন ও পরিচালনা করুন
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  এখানে আপনি সরাসরি যেকোনো নতুন সূরা, আরবি আয়াত, বাংলা উচ্চারণ ও বাংলা অনুবাদ লিখে যুক্ত করতে পারেন। আপনার সংরক্ষিত সকল সূরা সাধারণ ব্যবহারকারীরা সরাসরি পড়তে পারবেন।
                </p>

                {quranSuccessMsg && (
                  <div className="p-3 mt-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{quranSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  সংরক্ষিত সূরাসমূহ ({quranSurahs.length})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('আপনি কি পূর্বনির্ধারিত বিশুদ্ধ সূরাসমূহ পুনরায় লোড করতে চান?')) {
                        const resetList = resetSurahsToDefault();
                        setQuranSurahs(resetList);
                        setQuranSuccessMsg('ডিফল্ট সূরাসমূহ সফলভাবে পুনরুদ্ধার করা হয়েছে।');
                        setTimeout(() => setQuranSuccessMsg(null), 3000);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                    title="রিসেট"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>রিসেট</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreatingSurah(true);
                      setEditingSurah(null);
                      setQSurahNum(quranSurahs.length + 1);
                      setQNameBn('');
                      setQNameEn('');
                      setQNameAr('');
                      setQMeaningBn('');
                      setQRevType('মাক্কী');
                      setQAyahs([
                        { ayahNumber: 1, arabic: '', pronunciation: '', bangla: '' },
                      ]);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ নতুন সূরা লিখুন</span>
                  </button>
                </div>
              </div>

              {/* Search Bar for 114 Surahs */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="সূরার নাম বা নম্বর লিখে খুঁজুন (১-১১৪)..."
                  value={adminQuranSearch}
                  onChange={(e) => setAdminQuranSearch(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Surahs List */}
              <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {quranSurahs
                  .filter(
                    (s) =>
                      s.nameBn.toLowerCase().includes(adminQuranSearch.toLowerCase()) ||
                      s.nameAr.includes(adminQuranSearch) ||
                      String(s.surahNumber).includes(adminQuranSearch)
                  )
                  .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {s.surahNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {s.nameBn}
                          </h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {s.revelationType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block mt-0.5 truncate">
                          {s.nameAr} • {s.ayahs?.length || 0} টি আয়াত • অর্থ: {s.meaningBn || 'সাধারণ'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => {
                          setEditingSurah(s);
                          setIsCreatingSurah(false);
                          setQSurahNum(s.surahNumber);
                          setQNameBn(s.nameBn);
                          setQNameEn(s.nameEn || '');
                          setQNameAr(s.nameAr);
                          setQMeaningBn(s.meaningBn || '');
                          setQRevType(s.revelationType || 'মাক্কী');
                          setQAyahs(
                            s.ayahs && s.ayahs.length > 0
                              ? s.ayahs
                              : [{ ayahNumber: 1, arabic: '', pronunciation: '', bangla: '' }]
                          );
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`আপনি কি "${s.nameBn}" মুছে ফেলতে চান?`)) {
                            const updated = deleteSurah(s.id);
                            setQuranSurahs(updated);
                            setQuranSuccessMsg('সূরা মুছে ফেলা হয়েছে।');
                            setTimeout(() => setQuranSuccessMsg(null), 3000);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Open Link to Quran Reader */}
              {onOpenTool && (
                <button
                  onClick={() => onOpenTool('quran-pdf')}
                  className="w-full py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition border border-emerald-200 dark:border-emerald-800/60"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>কুরআন পাঠে সরাসরি যান (ইউজার ভিউ দেখুন)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            /* ==========================================
               CREATE / EDIT SURAH & AYAHS FORM
               ========================================== */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Book className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingSurah ? 'সূরা ও আয়াত সম্পাদনা করুন' : 'নতুন সূরা ও আয়াত লিখুন'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingSurah(false);
                    setEditingSurah(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  বাতিল (Cancel)
                </button>
              </div>

              {/* Basic Surah Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    সূরা নম্বর (Surah Number)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={114}
                    value={qSurahNum}
                    onChange={(e) => setQSurahNum(Number(e.target.value))}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    অবতীর্ণের স্থান (মাক্কী/মাদানী)
                  </label>
                  <select
                    value={qRevType}
                    onChange={(e) => setQRevType(e.target.value as 'মাক্কী' | 'মাদানী')}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  >
                    <option value="মাক্কী">মাক্কী (Meccan)</option>
                    <option value="মাদানী">মাদানী (Medinan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    সূরার নাম (বাংলা, যেমন: সূরা আল-ফাতিহা)
                  </label>
                  <input
                    type="text"
                    value={qNameBn}
                    onChange={(e) => setQNameBn(e.target.value)}
                    placeholder="সূরা আল-ফাতিহা"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    সূরার নাম (আরবি, যেমন: الفاتحة)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={qNameAr}
                    onChange={(e) => setQNameAr(e.target.value)}
                    placeholder="الفاتحة"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-arabic font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    সূরার বাংলা অর্থ ও তাৎপর্য (যেমন: প্রারম্ভিক / সূচনা)
                  </label>
                  <input
                    type="text"
                    value={qMeaningBn}
                    onChange={(e) => setQMeaningBn(e.target.value)}
                    placeholder="সূচনা বা প্রারম্ভিক"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                  />
                </div>
              </div>

              {/* Ayahs Editor Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    আয়াতসমূহ ({qAyahs.length} টি আয়াত):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQAyahs([
                        ...qAyahs,
                        {
                          ayahNumber: qAyahs.length + 1,
                          arabic: '',
                          pronunciation: '',
                          bangla: '',
                        },
                      ]);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ পরবর্তী আয়াত যোগ করুন</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3.5">
                  {qAyahs.map((ayah, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>আয়াত #{idx + 1}</span>
                        </span>

                        {qAyahs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = qAyahs
                                .filter((_, i) => i !== idx)
                                .map((item, newIdx) => ({
                                  ...item,
                                  ayahNumber: newIdx + 1,
                                }));
                              setQAyahs(updated);
                            }}
                            className="text-xs text-rose-500 font-bold hover:underline"
                          >
                            মুছুন
                          </button>
                        )}
                      </div>

                      {/* Arabic Text */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          আরবি মূল পাঠ (Arabic):
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={ayah.arabic}
                          onChange={(e) => {
                            const updated = [...qAyahs];
                            updated[idx].arabic = e.target.value;
                            setQAyahs(updated);
                          }}
                          placeholder="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-arabic font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Bangla Pronunciation */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          বাংলা উচ্চারণ (Pronunciation):
                        </label>
                        <input
                          type="text"
                          value={ayah.pronunciation}
                          onChange={(e) => {
                            const updated = [...qAyahs];
                            updated[idx].pronunciation = e.target.value;
                            setQAyahs(updated);
                          }}
                          placeholder="বিসমিল্লাহির রাহমানির রাহীম"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Bangla Translation */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          বাংলা অর্থ ও অনুবাদ (Translation):
                        </label>
                        <textarea
                          rows={2}
                          value={ayah.bangla}
                          onChange={(e) => {
                            const updated = [...qAyahs];
                            updated[idx].bangla = e.target.value;
                            setQAyahs(updated);
                          }}
                          placeholder="শুরু করছি পরম করুণাময় অসীম দয়ালু আল্লাহর নামে..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSurah(false);
                    setEditingSurah(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  বাতিল
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!qNameBn.trim()) {
                      alert('অনুগ্রহ করে সূরার বাংলা নাম লিখুন।');
                      return;
                    }
                    if (!qNameAr.trim()) {
                      alert('অনুগ্রহ করে সূরার আরবি নাম লিখুন।');
                      return;
                    }

                    const surahData: QuranSurah = {
                      id: editingSurah ? editingSurah.id : `surah-${qSurahNum}-${Date.now()}`,
                      surahNumber: qSurahNum,
                      nameBn: qNameBn.trim(),
                      nameEn: qNameEn.trim() || qNameBn.trim(),
                      nameAr: qNameAr.trim(),
                      totalAyahs: qAyahs.length,
                      revelationType: qRevType,
                      meaningBn: qMeaningBn.trim(),
                      ayahs: qAyahs.map((a, i) => ({ ...a, ayahNumber: i + 1 })),
                    };

                    const updated = addOrUpdateSurah(surahData);
                    setQuranSurahs(updated);
                    setIsCreatingSurah(false);
                    setEditingSurah(null);
                    setQuranSuccessMsg(`"${qNameBn}" সফলভাবে সংরক্ষণ করা হয়েছে!`);
                    setTimeout(() => setQuranSuccessMsg(null), 3500);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>সূরা সংরক্ষণ করুন</span>
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
          TAB 3: CUSTOM CALCULATORS BUILDER (ক্যালকুলেটর বিল্ডার)
         ========================================================================= */}
      {activeTab === 'tools' && (
        <div className="flex flex-col gap-4">
          {!isCreatingTool && !editingTool ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    কাস্টম ক্যালকুলেটরসমূহ ({tools.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    আপনার তৈরি সকল টুল অ্যাপের হোমস্ক্রিনে প্রদর্শিত হবে
                  </span>
                </div>
                <button
                  onClick={() => {
                    applyPreset('custom-blank');
                    setIsCreatingTool(true);
                    setEditingTool(null);
                  }}
                  className="px-3.5 py-2 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন টুল তৈরি করুন</span>
                </button>
              </div>

              {/* Ready-made Quick Presets Bar */}
              <div className="bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl p-3 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-[#0B63F6] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>১-ক্লিকে রেডিমেড ইলেকট্রিক্যাল ফর্মুলা টুল শুরু করুন:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'single-phase-p', label: '১-ফেজ পাওয়ার (W)' },
                    { key: 'three-phase-kw', label: '৩-ফেজ পাওয়ার (kW)' },
                    { key: 'motor-fla', label: 'মোটর FLA কারেন্ট' },
                    { key: 'cap-reactance', label: 'ক্যাপাসিটর Xc' },
                    { key: 'battery-time', label: 'ব্যাটারি চার্জিং টাইম' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        applyPreset(p.key);
                        setIsCreatingTool(true);
                        setEditingTool(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#0B63F6] hover:text-[#0B63F6] transition"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools List */}
              <div className="flex flex-col gap-2.5">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs hover:border-blue-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            {t.category}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {t.inputs.length} Inputs
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          {t.titleBn}
                        </h4>
                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {t.descBn}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenTool && (
                          <button
                            onClick={() => onOpenTool(t.id)}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] rounded-lg text-xs font-bold flex items-center gap-1"
                            title="অ্যাপে চালান"
                          >
                            <Play className="w-3 h-3" />
                            <span>রান</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTool(t)}
                          className="p-1.5 text-slate-400 hover:text-[#0B63F6] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="সম্পাদনা"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${t.titleBn}" টুলটি কি মুছে ফেলতে চান?`)) {
                              deleteCustomTool(t.id);
                              setTools(getStoredCustomTools());
                              if (onRefreshTools) onRefreshTools();
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Formula & Outputs */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-sans text-[11px]">সূত্র:</span>
                        <span className="text-[#0B63F6] font-bold">{t.formula}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        আউটপুট: {t.outputUnit || 'একক'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* ===================================================================
               INTERACTIVE CALCULATOR BUILDER FORM
               =================================================================== */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingTool ? 'ক্যালকুলেটর সম্পাদনা' : 'নতুন ক্যালকুলেটর ও সূত্র স্টুডিও'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    এখানে সূত্র এবং ইনপুট ফিল্ড লিখে সরাসরি নতুন ক্যালকুলেটর তৈরি করুন
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingTool(false);
                    setEditingTool(null);
                  }}
                  className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  বাতিল
                </button>
              </div>

              {/* Presets quick load buttons inside form */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="font-bold text-slate-500 shrink-0 text-[11px]">টেমপ্লেট:</span>
                {[
                  { key: 'single-phase-p', label: '১-ফেজ পাওয়ার' },
                  { key: 'three-phase-kw', label: '৩-ফেজ পাওয়ার' },
                  { key: 'motor-fla', label: 'মোটর কারেন্ট' },
                  { key: 'cap-reactance', label: 'ক্যাপাসিটর Xc' },
                  { key: 'battery-time', label: 'ব্যাটারি টাইম' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-[11px] font-semibold text-[#0B63F6] shrink-0 border border-blue-200 dark:border-blue-900"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Title & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    টুলের বাংলা নাম *
                  </label>
                  <input
                    type="text"
                    value={formTitleBn}
                    onChange={(e) => setFormTitleBn(e.target.value)}
                    placeholder="e.g. ট্রান্সফরমার ইম্পিড্যান্স ক্যালকুলেটর"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    English Title
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Transformer Impedance Calculator"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    সংক্ষিপ্ত বিবরণ
                  </label>
                  <input
                    type="text"
                    value={formDescBn}
                    onChange={(e) => setFormDescBn(e.target.value)}
                    placeholder="এই টুল দিয়ে কী কী গণনা করা যাবে..."
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Inputs Management */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      ইনপুট প্যারামিটারসমূহ ({formInputs.length})
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      ব্যবহারকারী যে মানগুলো ইনপুট করবেন (যেমন: ভোল্টেজ, কারেন্ট, ইত্যাদি)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar = `x${formInputs.length + 1}`;
                      const nextInput: CustomToolInput = {
                        id: `inp-${Date.now()}`,
                        labelBn: `ইনপুট ${formInputs.length + 1}`,
                        labelEn: `Input ${formInputs.length + 1}`,
                        variable: newVar,
                        defaultValue: 10,
                        unit: 'মান',
                      };
                      setFormInputs([...formInputs, nextInput]);
                      setTestVals({ ...testVals, [newVar]: 10 });
                    }}
                    className="px-2.5 py-1 bg-[#0B63F6] text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ইনপুট যোগ</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {formInputs.map((inp, idx) => (
                    <div
                      key={inp.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                    >
                      <div className="w-full sm:w-28 shrink-0">
                        <label className="text-[10px] font-bold text-slate-400 block">চলক প্রতীক (Var)</label>
                        <input
                          type="text"
                          value={inp.variable}
                          onChange={(e) => {
                            const updated = [...formInputs];
                            const oldVar = updated[idx].variable;
                            const newV = e.target.value.trim().toLowerCase();
                            updated[idx].variable = newV;
                            setFormInputs(updated);
                            const updatedTest = { ...testVals };
                            delete updatedTest[oldVar];
                            updatedTest[newV] = inp.defaultValue;
                            setTestVals(updatedTest);
                          }}
                          className="w-full h-8 px-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg text-[#0B63F6]"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block">বাংলা লেবেল</label>
                        <input
                          type="text"
                          value={inp.labelBn}
                          onChange={(e) => {
                            const updated = [...formInputs];
                            updated[idx].labelBn = e.target.value;
                            setFormInputs(updated);
                          }}
                          className="w-full h-8 px-2 font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-400 block">একক (Unit)</label>
                        <input
                          type="text"
                          value={inp.unit}
                          onChange={(e) => {
                            const updated = [...formInputs];
                            updated[idx].unit = e.target.value;
                            setFormInputs(updated);
                          }}
                          placeholder="e.g. V, A, kW"
                          className="w-full h-8 px-2 font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-400 block">ডিফল্ট মান</label>
                        <input
                          type="number"
                          value={inp.defaultValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...formInputs];
                            updated[idx].defaultValue = val;
                            setFormInputs(updated);
                            setTestVals({ ...testVals, [inp.variable]: val });
                          }}
                          className="w-full h-8 px-2 font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>

                      {formInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormInputs(formInputs.filter((_, i) => i !== idx));
                            const updatedTest = { ...testVals };
                            delete updatedTest[inp.variable];
                            setTestVals(updatedTest);
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg self-end sm:self-center"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Formula Input */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    গণনার সূত্র (Mathematical Formula) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    উপরে সংজ্ঞায়িত চলক প্রতীকসমূহ ব্যবহার করুন
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value)}
                    placeholder="e.g. v * i * pf অথবা (hp * 746) / (v * 1.732)"
                    className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-mono font-bold text-sm text-[#0B63F6]"
                  />
                </div>

                {/* Formula Quick Symbols Helper */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">সহায়ক প্রতীক:</span>
                  {[
                    { label: '+', insert: ' + ' },
                    { label: '-', insert: ' - ' },
                    { label: '×', insert: ' * ' },
                    { label: '÷', insert: ' / ' },
                    { label: '( )', insert: '( )' },
                    { label: '√3 (1.732)', insert: 'Math.sqrt(3)' },
                    { label: 'π (PI)', insert: 'Math.PI' },
                    { label: 'Power(x,y)', insert: 'Math.pow(x, 2)' },
                  ].map((sym) => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => setFormFormula(formFormula + sym.insert)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold hover:bg-blue-50 text-slate-700 dark:text-slate-300"
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Label & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    আউটপুট লেবেল (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={formOutputLabelBn}
                    onChange={(e) => setFormOutputLabelBn(e.target.value)}
                    placeholder="e.g. মোট কার্যকর শক্তি"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    আউটপুট ইউনিট / একক
                  </label>
                  <input
                    type="text"
                    value={formOutputUnit}
                    onChange={(e) => setFormOutputUnit(e.target.value)}
                    placeholder="e.g. Watts, kW, Amps, Ω"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Real-time Interactive Test Runner */}
              {(() => {
                const evalLive = evaluateCustomFormula(formFormula, testVals);
                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-900 text-white flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>লাইভ ক্যালকুলেটর টেস্ট ও প্রিভিউ:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        সংরক্ষণ করার আগেই মান পরিবর্তন করে যাচাই করুন
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {formInputs.map((inp) => (
                        <div key={inp.id} className="bg-slate-800 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-mono">{inp.variable} ({inp.labelBn})</span>
                          <input
                            type="number"
                            value={testVals[inp.variable] ?? inp.defaultValue}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTestVals({ ...testVals, [inp.variable]: val });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-emerald-400 mt-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-semibold">
                        {formOutputLabelBn || 'ফলাফল'}:
                      </span>
                      {evalLive.success ? (
                        <span className="text-xl font-mono font-black text-emerald-400">
                          {evalLive.result.toFixed(2)} <span className="text-xs text-slate-400 font-sans">{formOutputUnit}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{evalLive.error}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTool(false);
                    setEditingTool(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveTool}
                  className="px-5 py-2.5 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-98 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>ক্যালকুলেটরটি সংরক্ষণ ও পাবলিশ করুন</span>
                </button>
              </div>
            </div>
          )}
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
            লগইন করার জন্য আপনার নতুন একটি শক্তিশালী সিক্রেট পাসওয়ার্ড সেট করুন।
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
