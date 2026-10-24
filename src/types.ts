export type Language = 'en' | 'bn';
export type ThemeMode = 'light' | 'dark' | 'system';

export type ToolCategory = 'all' | 'finance' | 'utility' | 'daily';

export type ToolId =
  | 'calculator'
  | 'electricity'
  | 'percentage'
  | 'converter'
  | 'age'
  | 'electrical'
  | 'energy'
  | 'date-diff';

export interface ToolItem {
  id: ToolId;
  category: 'finance' | 'utility' | 'daily';
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  badgeEn: string;
  badgeBn: string;
  iconName: string;
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

export interface AdMobConfig {
  appId: string;
  bannerAdUnitId: string;
  nativeAdUnitId: string;
  interstitialAdUnitId: string;
  isTestMode: boolean;
}
