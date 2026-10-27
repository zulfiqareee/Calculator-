export type Language = 'en' | 'bn';
export type ThemeMode = 'light' | 'dark' | 'system';

export type ToolCategory = 'all' | 'finance' | 'utility' | 'daily' | 'electrical';

export type ToolId =
  | 'calculator'
  | 'electricity'
  | 'percentage'
  | 'converter'
  | 'age'
  | 'electrical'
  | 'energy'
  | 'date-diff'
  | 'emi'
  | 'land'
  | 'bmi-calorie'
  | 'battery-ips'
  | 'weather'
  | 'prayer-times'
  | string;

export interface ToolItem {
  id: ToolId;
  category: 'finance' | 'utility' | 'daily' | 'electrical';
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  badgeEn: string;
  badgeBn: string;
  iconName: string;
  gradient: string;
  accentColor: string;
  isCustom?: boolean;
}

export interface CustomToolInput {
  id: string;
  labelEn: string;
  labelBn: string;
  variable: string; // e.g. "x", "v", "amps"
  defaultValue: number;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface CustomTool {
  id: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  category: 'finance' | 'utility' | 'daily' | 'electrical';
  badgeEn: string;
  badgeBn: string;
  iconName: string;
  gradient: string;
  inputs: CustomToolInput[];
  formula: string; // e.g. "v * i * 0.8" or "p / (v * Math.sqrt(3))"
  outputLabelEn: string;
  outputLabelBn: string;
  outputUnit: string;
  formulaDesc?: string;
  createdAt: number;
}

export interface CalculationRecord {
  id: string;
  toolId: ToolId;
  titleEn: string;
  titleBn: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface BookChapter {
  id: string;
  titleBn: string;
  titleEn: string;
  content: string;
}

export interface BookItem {
  id: string;
  titleBn: string;
  titleEn: string;
  author: string;
  category: string;
  coverColor: string;
  descriptionBn: string;
  descriptionEn: string;
  chapters: BookChapter[];
  createdAt: number;
  updatedAt: number;
}

export interface NoteFolder {
  id: string;
  nameBn: string;
  nameEn: string;
  color: string;
  iconName?: string;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteItem {
  color?: string;
  checklist?: NoteChecklistItem[];
  id: string;
  folderId: string;
  title: string;
  formula?: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AdMobConfig {
  appId: string;
  bannerAdUnitId: string;
  nativeAdUnitId: string;
  interstitialAdUnitId: string;
  isTestMode: boolean;
}
