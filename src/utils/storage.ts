import { Language, ThemeMode, CalculationRecord, AdMobConfig } from '../types';

const STORAGE_KEYS = {
  LANG: 'sut_language_v1',
  THEME: 'sut_theme_v1',
  FAVORITES: 'sut_favorites_v1',
  RECENTS: 'sut_recents_v1',
  HISTORY: 'sut_history_v1',
  ADMOB: 'sut_admob_config_v1',
};

// Default Google AdMob Test Identifiers for Android
export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-3940256099942544~3347511713', // Google Android Test App ID
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111', // Android Banner Test Ad Unit ID
  nativeAdUnitId: 'ca-app-pub-3940256099942544/2247696110', // Android Native Test Ad Unit ID
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712', // Android Interstitial Test Ad Unit ID
  isTestMode: true,
};

export const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return 'bn'; // Default to Bengali as requested
};

export const setStoredLanguage = (lang: Language) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

export const getStoredTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return 'system';
};

export const setStoredTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

const DELETED_TOOLS = new Set([
  'percentage',
  'converter',
  'electrical',
  'energy',
  'battery-ips',
  'custom-solar-pv',
  'custom-led-resistor',
]);

export const getStoredFavorites = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => !DELETED_TOOLS.has(id));
      }
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return ['calculator', 'electricity', 'land'];
};

export const setStoredFavorites = (favs: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

export const getStoredRecents = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RECENTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => !DELETED_TOOLS.has(id));
      }
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return ['calculator', 'electricity'];
};

export const addStoredRecent = (toolId: string) => {
  try {
    const current = getStoredRecents().filter((id) => id !== toolId);
    current.unshift(toolId);
    const trimmed = current.slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

export const getStoredHistory = (): CalculationRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return [];
};

export const addStoredHistory = (record: Omit<CalculationRecord, 'id' | 'timestamp'>) => {
  try {
    const current = getStoredHistory();
    const newRecord: CalculationRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    const updated = [newRecord, ...current].slice(0, 30); // keep recent 30
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return newRecord;
  } catch (e) {
    console.warn('Storage write error:', e);
  }
  return null;
};

export const clearStoredHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

export const getStoredAdMobConfig = (): AdMobConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMOB);
    if (saved) return { ...DEFAULT_ADMOB_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return DEFAULT_ADMOB_CONFIG;
};

export const setStoredAdMobConfig = (config: AdMobConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMOB, JSON.stringify(config));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};
