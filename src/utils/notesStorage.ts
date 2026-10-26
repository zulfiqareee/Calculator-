import { NoteFolder, NoteItem } from '../types';

const STORAGE_KEY_FOLDERS = 'smart_utility_note_folders_v1';
const STORAGE_KEY_NOTES = 'smart_utility_notes_v1';

export const INITIAL_FOLDERS: NoteFolder[] = [
  { id: 'f-formula', nameBn: 'ইলেকট্রিক্যাল সূত্র ব্যাঙ্ক', nameEn: 'Electrical Formula Bank', color: '#0B63F6' },
  { id: 'f-wiring', nameBn: 'সাইট ওয়্যারিং নোট ও টিপস', nameEn: 'Site Wiring Notes', color: '#10B981' },
  { id: 'f-daily', nameBn: 'জরুরি কাজের হিসাব', nameEn: 'Quick Work Log', color: '#F59E0B' },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n-1',
    folderId: 'f-formula',
    title: '৩-ফেজ মোটরের ফুল লোড কারেন্ট সূত্র',
    formula: 'I = P / (√3 × V × cosφ × η)',
    content: 'মোটর কিলোওয়াট (kW) জানা থাকলে: কারেন্ট = (kW × 1000) ÷ (1.732 × 400 × 0.85 × 0.88)। সাধারণ থাম্বরুল: প্রতি ১ HP তে প্রায় ১.৪৫ অ্যাম্পিয়ার কারেন্ট।',
    tags: ['মোটর', 'ফর্মুলা', '৩-ফেজ'],
    isPinned: true,
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000,
  },
  {
    id: 'n-2',
    folderId: 'f-formula',
    title: 'ক্যাপাসিটর ব্যাংক kVAR নির্ণয়',
    formula: 'kVAR = kW × (tan θ1 - tan θ2)',
    content: 'বিদ্যুৎ বিলের লো-পাওয়ার ফ্যাক্টর জরিমানা কমাতে এই সূত্রের সাহায্যে সঠিক সাইজের ক্যাপাসিটর ব্যাংক নির্বাচন করা যায়।',
    tags: ['পাওয়ার ফ্যাক্টর', 'ক্যাপাসিটর'],
    isPinned: false,
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
  },
  {
    id: 'n-3',
    folderId: 'f-wiring',
    title: 'বাসাবাড়ির এসি ও গিজার ওয়্যারিং চেকলিস্ট',
    formula: 'Cable Size: 4.0 mm² / Breaker: 20A',
    content: '১. প্রতিটি এসির জন্য অবশ্যই আলাদা ৪.০ mm² ক্যাবল টানতে হবে।\n২. নিউট্রাল কখনো অন্য কোনো রুমের সাথে কমন করা যাবে না।\n৩. নির্ভরযোগ্য আর্থিং ওয়্যার (২.৫ mm² গ্রিন) ফ্রেমের সাথে কানেক্ট নিশ্চিত করতে হবে।',
    tags: ['ওয়্যারিং', 'এসি', 'নিরাপত্তা'],
    isPinned: true,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
  },
];

export function getStoredFolders(): NoteFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(INITIAL_FOLDERS));
      return INITIAL_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_FOLDERS;
  } catch {
    return INITIAL_FOLDERS;
  }
}

export function saveStoredFolders(folders: NoteFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders', err);
  }
}

export function addFolder(folder: NoteFolder): void {
  const current = getStoredFolders();
  saveStoredFolders([...current, folder]);
}

export function deleteFolder(folderId: string): void {
  const current = getStoredFolders();
  saveStoredFolders(current.filter((f) => f.id !== folderId));
}

export function getStoredNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTES;
  } catch {
    return INITIAL_NOTES;
  }
}

export function saveStoredNotes(notes: NoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes', err);
  }
}

export function addOrUpdateNote(note: NoteItem): void {
  const current = getStoredNotes();
  const index = current.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    current[index] = { ...note, updatedAt: Date.now() };
    saveStoredNotes(current);
  } else {
    saveStoredNotes([{ ...note, createdAt: Date.now(), updatedAt: Date.now() }, ...current]);
  }
}

export function deleteNote(noteId: string): void {
  const current = getStoredNotes();
  saveStoredNotes(current.filter((n) => n.id !== noteId));
}
