import { HealthTipItem, HealthCategory, HealthCategoryItem } from '../types';
import { HEALTH_TIPS_DATA } from '../data/healthTipsData';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';

export interface FirebaseHealthConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface ReadingHistoryItem {
  id: string;
  tipId: string;
  titleBn: string;
  titleEn: string;
  category: string;
  readAt: number;
}

const STORAGE_KEYS = {
  HEALTH_LANG: 'sut_health_lang_v1',
  HEALTH_TIPS: 'sut_custom_health_tips_v2',
  HEALTH_CATEGORIES: 'sut_health_categories_v2',
  HEALTH_SAVED: 'sut_saved_health_tips_v2',
  HEALTH_HISTORY: 'sut_health_reading_history_v1',
  HEALTH_FONT_SIZE: 'sut_health_font_size_v1',
  FIREBASE_CONFIG: 'sut_firebase_health_config_v1',
  LAST_SYNC: 'sut_firebase_health_last_sync_v1',
};

// =========================================================================
// 8 HEALTH CATEGORIES DEFINITION & METADATA
// =========================================================================
export interface CategoryMeta {
  id: HealthCategory;
  labelBn: string;
  labelEn: string;
  icon: string;
  descriptionBn: string;
  descriptionEn: string;
}

export const DEFAULT_HEALTH_CATEGORIES: HealthCategoryItem[] = [
  {
    id: 'nutrition',
    nameBn: 'পুষ্টি ও খাদ্যাভ্যাস',
    nameEn: 'Nutrition & Diet',
    icon: '🥗',
    descriptionBn: 'সুষম খাদ্য, ভিটামিন, খনিজ ও প্রতিদিনের পুষ্টি তালিকা',
    descriptionEn: 'Balanced meals, vitamins, minerals, and dietary guidelines',
    order: 1,
    isActive: true,
  },
  {
    id: 'fitness',
    nameBn: 'ব্যায়াম ও ফিটনেস',
    nameEn: 'Exercise & Fitness',
    icon: '🏃',
    descriptionBn: 'হাঁটা, কার্ডিও, স্ট্রেচিং ও মেরুদণ্ডের স্বাস্থ্য',
    descriptionEn: 'Walking routines, cardio endurance, and spinal ergonomics',
    order: 2,
    isActive: true,
  },
  {
    id: 'mental',
    nameBn: 'ঘুম ও মানসিক সুস্থতা',
    nameEn: 'Sleep & Mental Wellness',
    icon: '🧠',
    descriptionBn: 'গভীর ঘুম, মানসিক চাপ ও উদ্বেগ প্রশমনের উপায়',
    descriptionEn: 'Deep restorative sleep, mindfulness, and stress resilience',
    order: 3,
    isActive: true,
  },
  {
    id: 'hygiene',
    nameBn: 'ব্যক্তিগত পরিচ্ছন্নতা',
    nameEn: 'Personal Hygiene',
    icon: '🧼',
    descriptionBn: 'হাত ধোয়া, দাঁতের যত্ন ও জীবাণু সংক্রমণ প্রতিরোধ',
    descriptionEn: 'Hand hygiene, dental care, and microbial protection',
    order: 4,
    isActive: true,
  },
  {
    id: 'firstaid',
    nameBn: 'প্রাথমিক চিকিৎসা',
    nameEn: 'First Aid',
    icon: '🩹',
    descriptionBn: 'জরুরি পোড়া, আঘাত, হিটস্ট্রোক ও প্রাথমিক উদ্ধার',
    descriptionEn: 'Burns, injuries, heatstroke, and acute resuscitation',
    order: 5,
    isActive: true,
  },
  {
    id: 'prevention',
    nameBn: 'রোগ প্রতিরোধ',
    nameEn: 'Disease Prevention',
    icon: '🛡️',
    descriptionBn: 'ডেঙ্গু, উচ্চ রক্তচাপ, ডায়াবেটিস ও সংক্রমণ প্রতিরোধ',
    descriptionEn: 'Dengue, hypertension, diabetes, and cardiovascular care',
    order: 6,
    isActive: true,
  },
  {
    id: 'family',
    nameBn: 'শিশু ও পারিবারিক স্বাস্থ্য',
    nameEn: 'Child & Family Health',
    icon: '👨‍👩‍👧',
    descriptionBn: 'প্রথম ১০০০ দিন, শিশুর পুষ্টি ও বয়স্কদের যত্ন',
    descriptionEn: 'Pediatric milestones, child immunity, and senior eldercare',
    order: 7,
    isActive: true,
  },
  {
    id: 'seasonal',
    nameBn: 'মৌসুমি স্বাস্থ্য পরামর্শ',
    nameEn: 'Seasonal Health',
    icon: '🌦️',
    descriptionBn: 'শীতকালীন যত্ন, বর্ষার পানিবাহিত রোগ ও আবহাওয়াজনিত রোগ',
    descriptionEn: 'Winter dryness, monsoon waterborne hazards, and weather care',
    order: 8,
    isActive: true,
  },
];

// Backward compatible CategoryMeta array
export const HEALTH_CATEGORIES: CategoryMeta[] = DEFAULT_HEALTH_CATEGORIES.map((c) => ({
  id: c.id as HealthCategory,
  labelBn: c.nameBn,
  labelEn: c.nameEn,
  icon: c.icon,
  descriptionBn: c.descriptionBn,
  descriptionEn: c.descriptionEn,
}));

// =========================================================================
// CATEGORY LOCAL STORAGE (CRUD)
// =========================================================================
export function getStoredHealthCategories(): HealthCategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }
  } catch (err) {
    console.warn('Failed to read categories:', err);
  }
  saveStoredHealthCategories(DEFAULT_HEALTH_CATEGORIES);
  return DEFAULT_HEALTH_CATEGORIES;
}

export function saveStoredHealthCategories(cats: HealthCategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_CATEGORIES, JSON.stringify(cats));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function addOrUpdateHealthCategory(category: HealthCategoryItem): HealthCategoryItem[] {
  const cats = getStoredHealthCategories();
  const idx = cats.findIndex((c) => c.id === category.id);
  let updated: HealthCategoryItem[];
  if (idx >= 0) {
    updated = [...cats];
    updated[idx] = category;
  } else {
    updated = [...cats, category];
  }
  updated.sort((a, b) => (a.order || 0) - (b.order || 0));
  saveStoredHealthCategories(updated);
  saveCategoryToFirestore(category).catch(() => {});
  return updated;
}

export function deleteHealthCategory(id: string): HealthCategoryItem[] {
  const cats = getStoredHealthCategories();
  const updated = cats.filter((c) => c.id !== id);
  saveStoredHealthCategories(updated);
  deleteCategoryFromFirestore(id).catch(() => {});
  return updated;
}

export function resetHealthCategoriesToDefault(): HealthCategoryItem[] {
  saveStoredHealthCategories(DEFAULT_HEALTH_CATEGORIES);
  return DEFAULT_HEALTH_CATEGORIES;
}

// =========================================================================
// LANGUAGE SWITCHING & PERSISTENCE
// =========================================================================
export function getHealthLanguage(): 'bn' | 'en' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH_LANG);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch (err) {
    console.warn('Failed to read health language:', err);
  }
  return 'bn'; // Default language is Bengali
}

export function setHealthLanguage(lang: 'bn' | 'en'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_LANG, lang);
  } catch (err) {
    console.warn('Failed to save health language:', err);
  }
}

// =========================================================================
// FONT SIZE ADJUSTMENT
// =========================================================================
export type HealthFontSize = 'normal' | 'large' | 'huge';

export function getHealthFontSize(): HealthFontSize {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH_FONT_SIZE);
    if (saved === 'normal' || saved === 'large' || saved === 'huge') return saved;
  } catch {
    // fallback
  }
  return 'normal';
}

export function setHealthFontSize(size: HealthFontSize): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_FONT_SIZE, size);
  } catch (err) {
    console.warn('Failed to save font size:', err);
  }
}

// =========================================================================
// READING HISTORY
// =========================================================================
export function getHealthReadingHistory(): ReadingHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load health history:', err);
  }
  return [];
}

export function addHealthReadingHistory(tip: HealthTipItem): void {
  try {
    const history = getHealthReadingHistory().filter((item) => item.tipId !== tip.id);
    const newItem: ReadingHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      tipId: tip.id,
      titleBn: tip.titleBn || 'অনুবাদহীন',
      titleEn: tip.titleEn || 'Untitled',
      category: tip.category,
      readAt: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.HEALTH_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to append reading history:', err);
  }
}

export function clearHealthReadingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HEALTH_HISTORY);
  } catch (err) {
    console.warn('Failed to clear reading history:', err);
  }
}

// =========================================================================
// BOOKMARKS / FAVORITES
// =========================================================================
export function getSavedHealthTipIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_SAVED);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function toggleSaveHealthTip(tipId: string): string[] {
  const current = getSavedHealthTipIds();
  const next = current.includes(tipId)
    ? current.filter((id) => id !== tipId)
    : [...current, tipId];
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_SAVED, JSON.stringify(next));
  } catch (err) {
    console.warn('Failed to save bookmark:', err);
  }
  return next;
}

// =========================================================================
// HEALTH ARTICLES LOCAL STORAGE (CRUD)
// =========================================================================
export function getStoredHealthTips(): HealthTipItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_TIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load stored health tips:', err);
  }
  // Initialize with curated dataset if empty
  saveStoredHealthTips(HEALTH_TIPS_DATA);
  return HEALTH_TIPS_DATA;
}

export async function pushHealthTipsToServer(tips: HealthTipItem[]): Promise<boolean> {
  try {
    const res = await fetch('/api/health-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tips }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch (err) {
    console.warn('[Sync] Could not push health tips to server:', err);
    return false;
  }
}

export async function fetchHealthTipsFromServer(): Promise<HealthTipItem[]> {
  try {
    const res = await fetch('/api/health-tips');
    if (!res.ok) return getStoredHealthTips();
    const data = await res.json();
    if (data?.success && Array.isArray(data.tips) && data.tips.length > 0) {
      saveStoredHealthTips(data.tips, false);
      return data.tips;
    }
  } catch (err) {
    console.warn('[Sync] Could not fetch health tips from server:', err);
  }
  return getStoredHealthTips();
}

export function saveStoredHealthTips(tips: HealthTipItem[], pushToServer: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_TIPS, JSON.stringify(tips));
    if (pushToServer) {
      pushHealthTipsToServer(tips).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save health tips to storage:', err);
  }
}

export function addOrUpdateHealthTip(tip: HealthTipItem): HealthTipItem[] {
  const tips = getStoredHealthTips();
  const index = tips.findIndex((t) => t.id === tip.id);
  let updated: HealthTipItem[];
  if (index >= 0) {
    updated = [...tips];
    updated[index] = tip;
  } else {
    updated = [tip, ...tips];
  }
  saveStoredHealthTips(updated);

  // Sync to Firestore in background if available
  saveTipToFirestore(tip).catch(() => {});
  return updated;
}

export function deleteHealthTip(id: string): HealthTipItem[] {
  const tips = getStoredHealthTips();
  const updated = tips.filter((t) => t.id !== id);
  saveStoredHealthTips(updated);

  // Delete from Firestore in background if available
  deleteTipFromFirestore(id).catch(() => {});
  return updated;
}

export function togglePublishTip(id: string): HealthTipItem[] {
  const tips = getStoredHealthTips();
  const updated = tips.map((t) => {
    if (t.id === id) {
      const isPublished = t.isPublished !== undefined ? !t.isPublished : false;
      const modified = { ...t, isPublished };
      saveTipToFirestore(modified).catch(() => {});
      return modified;
    }
    return t;
  });
  saveStoredHealthTips(updated);
  return updated;
}

export function toggleFeaturedTip(id: string): HealthTipItem[] {
  const tips = getStoredHealthTips();
  const updated = tips.map((t) => {
    if (t.id === id) {
      const isFeatured = !t.isFeatured;
      const modified = { ...t, isFeatured };
      saveTipToFirestore(modified).catch(() => {});
      return modified;
    }
    return t;
  });
  saveStoredHealthTips(updated);
  return updated;
}

export function togglePopularTip(id: string): HealthTipItem[] {
  const tips = getStoredHealthTips();
  const updated = tips.map((t) => {
    if (t.id === id) {
      const isPopular = !t.isPopular;
      const modified = { ...t, isPopular };
      saveTipToFirestore(modified).catch(() => {});
      return modified;
    }
    return t;
  });
  saveStoredHealthTips(updated);
  return updated;
}

export function resetHealthTipsToDefault(): HealthTipItem[] {
  saveStoredHealthTips(HEALTH_TIPS_DATA);
  return HEALTH_TIPS_DATA;
}

// =========================================================================
// FIREBASE FIRESTORE INTEGRATION
// =========================================================================
let cachedFirestore: Firestore | null = null;

export function getActiveFirebaseConfig(): FirebaseHealthConfig | null {
  // 1. Check custom manual config saved by admin in UI
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 2. Check Vite client environment variables if provided
  const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      projectId: envProjectId,
      authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
      appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
    };
  }

  return null;
}

export function saveManualFirebaseConfig(config: FirebaseHealthConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
    }
    cachedFirestore = null; // reset cached instance
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

export function getFirestoreInstance(): Firestore | null {
  if (cachedFirestore) return cachedFirestore;

  const cfg = getActiveFirebaseConfig();
  if (!cfg) return null;

  try {
    const appName = 'SmartHubHealthApp';
    let app: FirebaseApp;
    const existing = getApps().find((a) => a.name === appName);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(
        {
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
          projectId: cfg.projectId,
          storageBucket: cfg.storageBucket || `${cfg.projectId}.appspot.com`,
          appId: cfg.appId,
        },
        appName
      );
    }
    cachedFirestore = getFirestore(app);
    return cachedFirestore;
  } catch (err) {
    console.warn('Could not initialize Firebase Firestore:', err);
    return null;
  }
}

export async function fetchHealthTipsFromFirestore(): Promise<HealthTipItem[] | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const colRef = collection(db, 'health_tips');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;

    const tips: HealthTipItem[] = [];
    snapshot.forEach((d) => {
      tips.push({ id: d.id, ...d.data() } as HealthTipItem);
    });

    if (tips.length > 0) {
      // update local cache
      saveStoredHealthTips(tips);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      return tips;
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetch failed (using local offline storage):', err);
    return null;
  }
}

export async function fetchHealthCategoriesFromFirestore(): Promise<HealthCategoryItem[] | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const colRef = collection(db, 'health_categories');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;

    const cats: HealthCategoryItem[] = [];
    snapshot.forEach((d) => {
      cats.push({ id: d.id, ...d.data() } as HealthCategoryItem);
    });

    if (cats.length > 0) {
      saveStoredHealthCategories(cats);
      return cats;
    }
    return null;
  } catch (err) {
    console.warn('Firestore categories fetch failed:', err);
    return null;
  }
}

export async function saveCategoryToFirestore(cat: HealthCategoryItem): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef = doc(db, 'health_categories', cat.id);
    await setDoc(docRef, cat, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to save category to Firestore:', err);
    return false;
  }
}

export async function deleteCategoryFromFirestore(catId: string): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef = doc(db, 'health_categories', catId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete category from Firestore:', err);
    return false;
  }
}

export async function saveTipToFirestore(tip: HealthTipItem): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef1 = doc(db, 'health_tips', tip.id);
    const docRef2 = doc(db, 'health_articles', tip.id);
    await Promise.all([
      setDoc(docRef1, tip, { merge: true }),
      setDoc(docRef2, tip, { merge: true }),
    ]);
    return true;
  } catch (err) {
    console.warn('Failed to save to Firestore:', err);
    return false;
  }
}

export async function deleteTipFromFirestore(tipId: string): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const docRef1 = doc(db, 'health_tips', tipId);
    const docRef2 = doc(db, 'health_articles', tipId);
    await Promise.all([
      deleteDoc(docRef1),
      deleteDoc(docRef2),
    ]);
    return true;
  } catch (err) {
    console.warn('Failed to delete from Firestore:', err);
    return false;
  }
}

export async function syncAllLocalTipsToFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
  const db = getFirestoreInstance();
  if (!db) {
    return { success: false, count: 0, error: 'Firebase কনফিগারেশন সেট করা নেই।' };
  }

  const tips = getStoredHealthTips();
  const categories = getStoredHealthCategories();
  let count = 0;
  try {
    for (const cat of categories) {
      const catRef = doc(db, 'health_categories', cat.id);
      await setDoc(catRef, cat, { merge: true });
    }
    for (const tip of tips) {
      const docRef1 = doc(db, 'health_tips', tip.id);
      const docRef2 = doc(db, 'health_articles', tip.id);
      await Promise.all([
        setDoc(docRef1, tip, { merge: true }),
        setDoc(docRef2, tip, { merge: true }),
      ]);
      count++;
    }
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    return { success: true, count };
  } catch (err: any) {
    return { success: false, count, error: err?.message || 'সিঙ্ক ব্যর্থ হয়েছে' };
  }
}

export function getFirebaseStatus(): {
  isConfigured: boolean;
  projectId?: string;
  lastSyncTime?: number;
} {
  const cfg = getActiveFirebaseConfig();
  let lastSyncTime: number | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (raw) lastSyncTime = parseInt(raw, 10);
  } catch {
    // ignore
  }

  return {
    isConfigured: !!cfg,
    projectId: cfg?.projectId,
    lastSyncTime,
  };
}

// =========================================================================
// TEXT-TO-SPEECH (TTS) - WEB SPEECH API
// =========================================================================
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakHealthArticle(
  text: string,
  lang: 'bn' | 'en',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): boolean {
  if (!isSpeechSupported()) return false;

  try {
    window.speechSynthesis.cancel(); // stop any existing utterance

    const cleanText = text.replace(/[*#_~`]/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = lang === 'bn' ? 0.9 : 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      onError?.();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    return false;
  }
}

export function stopSpeakingArticle(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}
