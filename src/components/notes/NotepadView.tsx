import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Pin,
  Copy,
  Check,
  Search,
  ArrowLeft,
  FileText,
  Bookmark,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Save,
  Tag,
  Zap,
} from 'lucide-react';
import { NoteFolder, NoteItem, Language } from '../../types';
import {
  getStoredFolders,
  getStoredNotes,
  addOrUpdateNote,
  deleteNote,
  addFolder,
  deleteFolder,
} from '../../utils/notesStorage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}

export const NotepadView: React.FC<Props> = ({ lang, onBack }) => {
  const [folders, setFolders] = useState<NoteFolder[]>(getStoredFolders());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Note Editor State (Accessible to EVERY user)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteFormula, setNoteFormula] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteFolderId, setNoteFolderId] = useState<string>(folders[0]?.id || 'f-formula');
  const [noteTagsStr, setNoteTagsStr] = useState<string>('');
  const [noteIsPinned, setNoteIsPinned] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Folder Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>('#0B63F6');

  const FOLDER_COLORS = ['#0B63F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyFormula = async (id: string, formulaStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await copyToClipboard(formulaStr);
    if (ok) {
      setCopiedId(id);
      showToast('সূত্র কপি করা হয়েছে!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Open note editor for new note
  const handleOpenNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteFormula('');
    setNoteContent('');
    setNoteFolderId(selectedFolderId !== 'all' ? selectedFolderId : folders[0]?.id || 'f-formula');
    setNoteTagsStr('');
    setNoteIsPinned(false);
    setFormError(null);
    setIsEditorOpen(true);
  };

  // Open note editor for editing
  const handleOpenEditNote = (note: NoteItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteFormula(note.formula || '');
    setNoteContent(note.content);
    setNoteFolderId(note.folderId);
    setNoteTagsStr(note.tags.join(', '));
    setNoteIsPinned(note.isPinned);
    setFormError(null);
    setIsEditorOpen(true);
  };

  // Delete note
  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(noteId);
    setNotes(getStoredNotes());
    showToast('নোটটি মুছে ফেলা হয়েছে।');
  };

  // Save note
  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      setFormError('দয়া করে নোটের একটি শিরোনাম দিন।');
      return;
    }

    const tags = noteTagsStr
      .split(/[,，]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const noteObj: NoteItem = {
      id: editingNoteId || `note-${Date.now()}`,
      folderId: noteFolderId,
      title: noteTitle.trim(),
      formula: noteFormula.trim() || undefined,
      content: noteContent.trim(),
      tags,
      isPinned: noteIsPinned,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addOrUpdateNote(noteObj);
    setNotes(getStoredNotes());
    setIsEditorOpen(false);
    setEditingNoteId(null);
    showToast('নোট সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Create new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folderObj: NoteFolder = {
      id: `folder-${Date.now()}`,
      nameBn: newFolderName.trim(),
      nameEn: newFolderName.trim(),
      color: newFolderColor,
    };
    addFolder(folderObj);
    setFolders(getStoredFolders());
    setNewFolderName('');
    setIsFolderModalOpen(false);
    showToast('নতুন ফোল্ডার তৈরি হয়েছে!');
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedFolderId !== 'all' && n.folderId !== selectedFolderId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchFormula = n.formula?.toLowerCase().includes(q);
      const matchTag = n.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchFormula || matchTag;
    }
    return true;
  });

  // Sort: pinned first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
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
            {notes.length} {lang === 'bn' ? 'টি নোট' : 'Notes'}
          </span>
          <button
            onClick={handleOpenNewNote}
            className="px-3.5 py-1.5 bg-[#0B63F6] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন নোট লিখুন' : '+ New Note'}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'bn' ? 'সূত্র, হিসাব বা কাজের নোট খুঁজুন...' : 'Search formulas & notes...'}
          className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Folders Filter Ribbon with Add Folder Option */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
            selectedFolderId === 'all'
              ? 'bg-[#0B63F6] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {lang === 'bn' ? 'সকল নোট' : 'All Notes'}
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFolderId(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
              selectedFolderId === f.id
                ? 'bg-[#0B63F6] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Folder className="w-3.5 h-3.5" style={{ color: selectedFolderId === f.id ? '#ffffff' : f.color }} />
            <span>{lang === 'bn' ? f.nameBn : f.nameEn}</span>
          </button>
        ))}

        {/* Add New Folder Button */}
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/60 dark:border-slate-700 hover:bg-blue-100 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ফোল্ডার' : 'Folder'}</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="flex flex-col gap-3">
        {sortedNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">
              {lang === 'bn' ? 'কোনো নোট বা সূত্র সংরক্ষিত নেই।' : 'No notes saved yet.'}
            </p>
            <button
              onClick={handleOpenNewNote}
              className="px-4 py-2 bg-[#0B63F6] text-white text-xs font-bold rounded-xl mt-1 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রথম নোটটি লিখুন' : 'Write First Note'}</span>
            </button>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const folderObj = folders.find((f) => f.id === note.folderId);
            return (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 hover:border-blue-400 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {note.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>পিন</span>
                        </span>
                      )}
                      {folderObj && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: folderObj.color }}
                          />
                          <span>{folderObj.nameBn}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleOpenEditNote(note, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B63F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="নোট সম্পাদনা"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      title="নোট মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Formula Highlight Banner */}
                {note.formula && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono text-xs font-black text-[#0B63F6] dark:text-blue-400 truncate">
                        {note.formula}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleCopyFormula(note.id, note.formula!, e)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:text-[#0B63F6] flex items-center gap-1 text-[11px] font-bold shrink-0 shadow-xs"
                      title="কপি করুন"
                    >
                      {copiedId === note.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">কপি</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Content Body */}
                {note.content && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          NOTE EDITOR MODAL (Direct note writing for anyone)
         ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0B63F6]" />
                <span>{editingNoteId ? 'নোট সম্পাদনা করুন' : 'নতুন নোট বা সূত্র লিখুন'}</span>
              </h4>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Note Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                নোটের শিরোনাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => {
                  setNoteTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="যেমন: ৩-ফেজ লোড হিসাব বা তারের সাইজ চার্ট"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Folder selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ফোল্ডার নির্বাচন করুন
              </label>
              <select
                value={noteFolderId}
                onChange={(e) => setNoteFolderId(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.nameBn}
                  </option>
                ))}
              </select>
            </div>

            {/* Formula (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                <span>সূত্র বা ফর্মুলা (ঐচ্ছিক)</span>
                <span className="text-[10px] text-slate-400 font-normal">যেমন: P = V × I</span>
              </label>
              <input
                type="text"
                value={noteFormula}
                onChange={(e) => setNoteFormula(e.target.value)}
                placeholder="যেমন: I = P / (V × cosθ)"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-mono font-bold text-[#0B63F6] dark:text-blue-400"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                বিস্তারিত বিষয়বস্তু বা বিবরণ
              </label>
              <textarea
                rows={5}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="আপনার কাজের বিবরণ, হিসাবের পয়েন্ট বা যেকোনো তথ্য বাংলায় লিখুন..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-sans leading-relaxed text-slate-900 dark:text-white"
              />
            </div>

            {/* Tags & Pin Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ট্যাগসমূহ (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  value={noteTagsStr}
                  onChange={(e) => setNoteTagsStr(e.target.value)}
                  placeholder="ওয়্যারিং, এসি, মোটর"
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noteIsPinned}
                    onChange={(e) => setNoteIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B63F6] focus:ring-[#0B63F6]"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>উপরে পিন করে রাখুন</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-5 py-2 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE FOLDER MODAL
         ========================================================================= */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-[#0B63F6]" />
                <span>নতুন ফোল্ডার তৈরি</span>
              </h4>
              <button onClick={() => setIsFolderModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ফোল্ডারের নাম (বাংলা)
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="যেমন: সাইট হিসাব, ট্রান্সফরমার নোটস"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                ফোল্ডারের রঙ
              </label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewFolderColor(col)}
                    className={`w-7 h-7 rounded-full transition ${
                      newFolderColor === col ? 'ring-2 ring-offset-2 ring-[#0B63F6] scale-110' : 'opacity-80'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={!newFolderName.trim()}
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-[#0B63F6] text-white text-xs font-bold rounded-xl disabled:opacity-40"
              >
                তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
