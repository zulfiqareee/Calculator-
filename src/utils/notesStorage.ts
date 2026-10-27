import { NoteFolder, NoteItem } from '../types';

const STORAGE_KEY_FOLDERS = 'smart_utility_note_folders_v2';
const STORAGE_KEY_NOTES = 'smart_utility_notes_v2';

export const INITIAL_FOLDERS: NoteFolder[] = [
  { id: 'f-daily', nameBn: 'দৈনন্দিন নোট', nameEn: 'Daily Notes', color: '#0B63F6' },
  { id: 'f-work', nameBn: 'কাজের হিসাব ও লিস্ট', nameEn: 'Work & Tasks', color: '#10B981' },
  { id: 'f-personal', nameBn: 'ব্যক্তিগত তথ্য', nameEn: 'Personal Memo', color: '#F59E0B' },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n-1',
    folderId: 'f-daily',
    title: 'আজকের বাজার ফর্দ ও দরকারি জিনিস',
    content: 'সকাল ১০টায় বাজারে গিয়ে নিচের প্রয়োজনীয় জিনিসগুলো কিনতে হবে:',
    checklist: [
      { id: 'c-1', text: 'মিনিকেট চাল - ২৫ কেজি', completed: true },
      { id: 'c-2', text: 'সয়াবিন তেল - ৫ লিটার', completed: true },
      { id: 'c-3', text: 'মসুর ডাল ও পেঁয়াজ', completed: false },
      { id: 'c-4', text: 'ডিম ও তাজা শাকসবজি', completed: false },
    ],
    color: 'amber',
    tags: ['বাজার', 'দৈনন্দিন'],
    isPinned: true,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'n-2',
    folderId: 'f-work',
    title: 'জরুরি কাজের চেকলিস্ট',
    content: 'এই সপ্তাহের মধ্যে শেষ করতে হবে:',
    checklist: [
      { id: 'c-5', text: 'চলতি মাসের বিদ্যুৎ বিল পরিশোধ করা', completed: true },
      { id: 'c-6', text: 'মোটর ও আইপিএস ব্যাটারির ওয়াটার লেভেল চেক করা', completed: false },
      { id: 'c-7', text: 'প্রয়োজনীয় জিনিসপত্রের হিসাব সংরক্ষণ করা', completed: false },
    ],
    color: 'blue',
    tags: ['কাজ', 'চেকলিস্ট'],
    isPinned: true,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'n-3',
    folderId: 'f-personal',
    title: 'ব্যক্তিগত নোট ও প্রয়োজনীয় মেমো',
    content: 'যেকোনো ব্যক্তিগত তথ্য, হিসাব, ঠিকানা, মোবাইল নম্বর বা কাজের বিবরণ এই নোটপ্যাডে নিরাপদভাবে লিখে সংরক্ষণ করে রাখুন।\n\nউপরে সার্চ বারে যেকোনো শব্দ লিখে তৎক্ষণাৎ আপনার নোট খুঁজে পেতে পারবেন।',
    color: 'emerald',
    tags: ['মেমো', 'তথ্য'],
    isPinned: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FOLDERS;
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTES;
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
