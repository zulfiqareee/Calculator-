import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Pin,
  Check,
  Trash2,
  Share2,
  Copy,
  LayoutGrid,
  List as ListIcon,
  X,
  Palette,
  CheckSquare,
  Square,
  Clock,
  Folder,
  FileText,
  Save,
} from 'lucide-react';
import { NoteFolder, NoteItem, NoteChecklistItem, Language } from '../../types';
import {
  getStoredFolders,
  getStoredNotes,
  addOrUpdateNote,
  deleteNote,
  addFolder,
} from '../../utils/notesStorage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}

// Xiaomi / Samsung Notes inspired color palette
const NOTE_COLORS: Record<string, { bg: string; border: string; darkBg: string; darkBorder: string; dot: string }> = {
  default: {
    bg: 'bg-white',
    border: 'border-slate-200',
    darkBg: 'dark:bg-slate-900',
    darkBorder: 'dark:border-slate-800',
    dot: '#94a3b8',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/40',
    darkBorder: 'dark:border-amber-800/60',
    dot: '#f59e0b',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-950/40',
    darkBorder: 'dark:border-blue-800/60',
    dot: '#3b82f6',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-950/40',
    darkBorder: 'dark:border-emerald-800/60',
    dot: '#10b981',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    darkBg: 'dark:bg-purple-950/40',
    darkBorder: 'dark:border-purple-800/60',
    dot: '#8b5cf6',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    darkBg: 'dark:bg-rose-950/40',
    darkBorder: 'dark:border-rose-800/60',
    dot: '#f43f5e',
  },
};

export const NotepadView: React.FC<Props> = ({ lang, onBack }) => {
  const [folders, setFolders] = useState<NoteFolder[]>(getStoredFolders());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorColor, setEditorColor] = useState<string>('amber');
  const [editorIsPinned, setEditorIsPinned] = useState<boolean>(false);
  const [editorFolderId, setEditorFolderId] = useState<string>('f-daily');
  const [isChecklistMode, setIsChecklistMode] = useState<boolean>(false);
  const [checklistItems, setChecklistItems] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  // New Folder Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return lang === 'bn' ? `আজ ${timeStr}` : `Today, ${timeStr}`;
    }
    return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Open Editor for New Note
  const handleCreateNote = () => {
    setActiveNoteId(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorColor('amber');
    setEditorIsPinned(false);
    setEditorFolderId(selectedFolderId !== 'all' ? selectedFolderId : folders[0]?.id || 'f-daily');
    setIsChecklistMode(false);
    setChecklistItems([]);
    setNewChecklistText('');
    setIsEditorOpen(true);
  };

  // Open Editor to View / Modify Note
  const handleEditNote = (note: NoteItem) => {
    setActiveNoteId(note.id);
    setEditorTitle(note.title);
    setEditorContent(note.content || '');
    setEditorColor(note.color || 'amber');
    setEditorIsPinned(note.isPinned);
    setEditorFolderId(note.folderId || 'f-daily');
    if (note.checklist && note.checklist.length > 0) {
      setIsChecklistMode(true);
      setChecklistItems(note.checklist);
    } else {
      setIsChecklistMode(false);
      setChecklistItems([]);
    }
    setNewChecklistText('');
    setIsEditorOpen(true);
  };

  // Toggle Checklist item in reading/card view
  const handleToggleChecklistFromCard = (noteId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = notes.map((n) => {
      if (n.id === noteId && n.checklist) {
        return {
          ...n,
          checklist: n.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
          updatedAt: Date.now(),
        };
      }
      return n;
    });
    setNotes(updatedNotes);
    const target = updatedNotes.find((n) => n.id === noteId);
    if (target) addOrUpdateNote(target);
  };

  // Add checklist item in editor
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems([
      ...checklistItems,
      { id: `c-${Date.now()}-${Math.random()}`, text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  // Toggle checklist item in editor
  const handleToggleEditorChecklistItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    );
  };

  // Remove checklist item in editor
  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  // Save Note
  const handleSaveNote = () => {
    if (!editorTitle.trim() && !editorContent.trim() && checklistItems.length === 0) {
      setIsEditorOpen(false);
      return;
    }

    const effectiveTitle =
      editorTitle.trim() ||
      (editorContent.trim() ? editorContent.trim().slice(0, 30) : '') ||
      (checklistItems[0]?.text ? checklistItems[0].text : 'শিরোনামহীন নোট');

    const noteObj: NoteItem = {
      id: activeNoteId || `note-${Date.now()}`,
      title: effectiveTitle,
      content: editorContent.trim(),
      color: editorColor,
      isPinned: editorIsPinned,
      folderId: editorFolderId,
      checklist: isChecklistMode && checklistItems.length > 0 ? checklistItems : undefined,
      tags: [],
      createdAt: activeNoteId
        ? notes.find((n) => n.id === activeNoteId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
    };

    addOrUpdateNote(noteObj);
    setNotes(getStoredNotes());
    setIsEditorOpen(false);
    showToast(lang === 'bn' ? 'নোটটি সংরক্ষিত হয়েছে' : 'Note saved');
  };

  // Delete Note
  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteNote(id);
    setNotes(getStoredNotes());
    if (activeNoteId === id) {
      setIsEditorOpen(false);
    }
    showToast(lang === 'bn' ? 'নোটটি মুছে ফেলা হয়েছে' : 'Note deleted');
  };

  // Copy Note Text
  const handleCopyNote = async (note: NoteItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let textToCopy = `${note.title}\n\n${note.content}`;
    if (note.checklist && note.checklist.length > 0) {
      textToCopy +=
        '\n\n' +
        note.checklist
          .map((c) => `${c.completed ? '✓' : '○'} ${c.text}`)
          .join('\n');
    }
    await copyToClipboard(textToCopy);
    showToast(lang === 'bn' ? 'সম্পূর্ণ নোট কপি হয়েছে!' : 'Note copied to clipboard!');
  };

  // Create Folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folderObj: NoteFolder = {
      id: `folder-${Date.now()}`,
      nameBn: newFolderName.trim(),
      nameEn: newFolderName.trim(),
      color: '#0B63F6',
    };
    addFolder(folderObj);
    setFolders(getStoredFolders());
    setNewFolderName('');
    setIsFolderModalOpen(false);
    showToast(lang === 'bn' ? 'নতুন ফোল্ডার তৈরি হয়েছে' : 'Folder created');
  };

  // Filter & Sort Notes
  const filteredNotes = useMemo(() => {
    let list = notes;
    if (selectedFolderId !== 'all') {
      list = list.filter((n) => n.folderId === selectedFolderId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.checklist?.some((c) => c.text.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [notes, selectedFolderId, searchQuery]);

  return (
    <div className="flex flex-col gap-3.5 max-w-lg mx-auto w-full relative min-h-[80vh] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-md animate-fade-in border border-slate-700/60">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar (Xiaomi / Smartphone Header) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0B63F6] shadow-xs active:scale-95 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'নোটপ্যাড' : 'Notes'}
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredNotes.length} {lang === 'bn' ? 'টি নোট সংরক্ষিত' : 'notes saved'}
            </span>
          </div>
        </div>

        {/* View Toggle (Grid / List) & Quick Create */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:text-[#0B63F6] transition"
            title={isGridView ? 'তালিকা ভিউ' : 'গ্রিড ভিউ'}
          >
            {isGridView ? <ListIcon className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCreateNote}
            className="px-3.5 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নোট লিখুন' : 'New Note'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'bn' ? 'যেকোনো নোট বা তথ্য খুঁজুন...' : 'Search notes & lists...'}
          className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B63F6] shadow-xs"
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

      {/* Folder Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
            selectedFolderId === 'all'
              ? 'bg-[#0B63F6] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {lang === 'bn' ? 'সকল নোট' : 'All'}
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

        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 bg-blue-50 dark:bg-slate-800 text-[#0B63F6] border border-blue-200/60 dark:border-slate-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ফোল্ডার' : 'Folder'}</span>
        </button>
      </div>

      {/* Notes Masonry / List Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center gap-3 my-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#0B63F6] flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {searchQuery
              ? lang === 'bn'
                ? 'কোনো নোট খুঁজে পাওয়া যায়নি'
                : 'No notes match your search'
              : lang === 'bn'
              ? 'আপনার কোনো নোট নেই'
              : 'No notes yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {lang === 'bn'
              ? 'নিচের বাটনে চাপ দিয়ে যেকোনো তথ্য, কাজের তালিকা, হিসাব বা ফর্দ লিখে রাখুন।'
              : 'Tap below to write down tasks, memos, lists or any notes.'}
          </p>
          <button
            onClick={handleCreateNote}
            className="px-5 py-2.5 bg-[#0B63F6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'প্রথম নোটটি লিখুন' : 'Create First Note'}</span>
          </button>
        </div>
      ) : (
        <div
          className={
            isGridView
              ? 'grid grid-cols-2 gap-2.5'
              : 'flex flex-col gap-2.5'
          }
        >
          {filteredNotes.map((note) => {
            const colorScheme = NOTE_COLORS[note.color || 'amber'] || NOTE_COLORS.default;
            return (
              <div
                key={note.id}
                onClick={() => handleEditNote(note)}
                className={`${colorScheme.bg} ${colorScheme.darkBg} border ${colorScheme.border} ${colorScheme.darkBorder} rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative`}
              >
                <div>
                  {/* Top row: Title & Pin indicator */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {note.title}
                    </h3>
                    {note.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Body Content */}
                  {note.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4 font-sans">
                      {note.content}
                    </p>
                  )}

                  {/* Checklist Items Preview */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {note.checklist.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => handleToggleChecklistFromCard(note.id, item.id, e)}
                          className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 group/item"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : ''
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                      {note.checklist.length > 3 && (
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          +{note.checklist.length - 3} {lang === 'bn' ? 'টি আইটেম...' : 'more items...'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Timestamp & Action Buttons */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-900/5 dark:border-white/5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatTimestamp(note.updatedAt || note.createdAt)}</span>
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleCopyNote(note, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-[#0B63F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                      title="কপি করুন"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) for instant Note creation (Xiaomi / Mobile style) */}
      <button
        onClick={handleCreateNote}
        className="fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-[#0B63F6] hover:bg-blue-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform"
        title="নতুন নোট তৈরি করুন"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* =========================================================================
          FULL-SCREEN NOTE EDITOR (Xiaomi / Google Keep Style)
         ========================================================================= */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-3xl ${NOTE_COLORS[editorColor].bg} ${NOTE_COLORS[editorColor].darkBg} border ${NOTE_COLORS[editorColor].border} ${NOTE_COLORS[editorColor].darkBorder} shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors duration-200`}
          >
            {/* Editor Top Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900/10 dark:border-white/10">
              <button
                onClick={handleSaveNote}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B63F6] px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Pin Button */}
                <button
                  type="button"
                  onClick={() => setEditorIsPinned(!editorIsPinned)}
                  className={`p-2 rounded-xl transition ${
                    editorIsPinned
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 bg-white/60 dark:bg-slate-800/60'
                  }`}
                  title={editorIsPinned ? 'পিন সরানো হবে' : 'উপরে পিন করুন'}
                >
                  <Pin className={`w-4 h-4 ${editorIsPinned ? 'fill-current' : ''}`} />
                </button>

                {/* Checklist Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChecklistMode(!isChecklistMode)}
                  className={`p-2 rounded-xl transition ${
                    isChecklistMode
                      ? 'bg-[#0B63F6] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 bg-white/60 dark:bg-slate-800/60'
                  }`}
                  title="চেকলিস্ট মোড"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                {/* Delete Note (if editing) */}
                {activeNoteId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(activeNoteId)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition"
                    title="নোটটি মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Note Editor Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {/* Note Title Input (Clean & Borderless) */}
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder={lang === 'bn' ? 'শিরোনাম...' : 'Title...'}
                className="w-full text-base sm:text-lg font-bold text-slate-900 dark:text-white bg-transparent placeholder:text-slate-400/80 focus:outline-none"
              />

              {/* Freeform Text Content */}
              <textarea
                rows={isChecklistMode ? 4 : 10}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'যেকোনো তথ্য, হিসাবের বিবরণ, জরুরি নোট বা মেমো এখানে লিখুন...'
                    : 'Write anything freely here (tasks, numbers, thoughts, notes)...'
                }
                className="w-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-transparent placeholder:text-slate-400/80 focus:outline-none resize-none leading-relaxed font-sans"
              />

              {/* Checklist Mode Section */}
              {isChecklistMode && (
                <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'bn' ? 'চেকলিস্ট আইটেমসমূহ:' : 'Checklist Items:'}
                  </span>

                  {/* Existing Checklist Items */}
                  <div className="space-y-1.5">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleEditorChecklistItem(item.id)}
                          className="text-slate-400 hover:text-emerald-500"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-xs text-slate-800 dark:text-slate-200 ${
                            item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Checklist Item Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      placeholder={lang === 'bn' ? '+ নতুন আইটেম লিখুন...' : '+ Add checklist item...'}
                      className="flex-1 h-9 px-3 text-xs bg-white/70 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-3 h-9 bg-[#0B63F6] text-white rounded-xl text-xs font-bold"
                    >
                      {lang === 'bn' ? 'যোগ' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Editor Bottom Palette Bar (Xiaomi Notes style card coloring) */}
            <div className="px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between gap-2">
              {/* Color dots */}
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                {Object.entries(NOTE_COLORS).map(([key, col]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditorColor(key)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      editorColor === key ? 'ring-2 ring-offset-2 ring-[#0B63F6] scale-110' : 'opacity-80'
                    }`}
                    style={{ backgroundColor: col.dot }}
                    title={key}
                  />
                ))}
              </div>

              {/* Folder selection */}
              <select
                value={editorFolderId}
                onChange={(e) => setEditorFolderId(e.target.value)}
                className="h-8 px-2 text-[11px] font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {lang === 'bn' ? f.nameBn : f.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-[#0B63F6]" />
                <span>{lang === 'bn' ? 'নতুন ফোল্ডার তৈরি' : 'New Folder'}</span>
              </h4>
              <button onClick={() => setIsFolderModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'bn' ? 'ফোল্ডারের নাম' : 'Folder Name'}
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: বাজার খরচ, অফিস নোট' : 'e.g. Work, Expenses'}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!newFolderName.trim()}
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-[#0B63F6] text-white text-xs font-bold rounded-xl disabled:opacity-40"
              >
                {lang === 'bn' ? 'তৈরি করুন' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
