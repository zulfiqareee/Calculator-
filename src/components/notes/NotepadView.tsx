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
} from 'lucide-react';
import { NoteFolder, NoteItem, Language } from '../../types';
import { getStoredFolders, getStoredNotes } from '../../utils/notesStorage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
  onBack?: () => void;
  onOpenAdmin?: () => void;
}

export const NotepadView: React.FC<Props> = ({ lang, onBack, onOpenAdmin }) => {
  const [folders, setFolders] = useState<NoteFolder[]>(getStoredFolders());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyFormula = async (id: string, formulaStr: string) => {
    const ok = await copyToClipboard(formulaStr);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
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
      return matchTitle || matchContent || matchFormula;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
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
            {filteredNotes.length} {lang === 'bn' ? 'টি নোট' : 'Notes'}
          </span>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-xs font-bold text-[#0B63F6] hover:underline"
            >
              {lang === 'bn' ? '+ নতুন সূত্র বা নোট' : '+ New Note'}
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'bn' ? 'সূত্র বা কাজের নোট খুঁজুন...' : 'Search formulas & notes...'}
          className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-3 text-xs sm:text-sm font-medium"
        />
      </div>

      {/* Folders Filter Ribbon */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar py-0.5">
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
      </div>

      {/* Notes List */}
      <div className="flex flex-col gap-3">
        {filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            {lang === 'bn' ? 'কোনো নোট পাওয়া যায়নি।' : 'No notes found.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {note.title}
                  </h3>
                </div>

                {note.formula && (
                  <button
                    onClick={() => handleCopyFormula(note.id, note.formula!)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B63F6] hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                    title="সূত্র কপি করুন"
                  >
                    {copiedId === note.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Formula Highlight Banner */}
              {note.formula && (
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Formula:</span>
                  <span className="font-mono text-xs font-black text-[#0B63F6] dark:text-blue-400">
                    {note.formula}
                  </span>
                </div>
              )}

              {/* Content Body */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
