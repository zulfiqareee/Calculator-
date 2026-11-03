import {
  VideoProject,
  PublishingRecord,
  SocialAccountConfig,
  VideoStudioSettings,
} from '../types/videoStudio';

const STORAGE_KEY_PROJECTS = 'smarthub_video_projects_v1';
const STORAGE_KEY_PUBLISHING = 'smarthub_publishing_records_v1';
const STORAGE_KEY_SOCIAL = 'smarthub_social_accounts_v1';
const STORAGE_KEY_SETTINGS = 'smarthub_video_settings_v1';

export const DEFAULT_STUDIO_SETTINGS: VideoStudioSettings = {
  defaultLanguage: 'bn',
  defaultFormat: 'shorts',
  defaultDuration: 60,
  defaultStyle: 'motivational',
  voicePreference: 'male',
  speechRate: 1.0,
  enableOfflineFallback: true,
  watermarkEnabled: false,
  watermarkText: 'SmartHub Studio',
};

export const DEFAULT_SOCIAL_CONFIG: SocialAccountConfig = {
  youtube: { connected: false },
  facebook: { connected: false },
};

// ==========================================
// 1. Projects Storage
// ==========================================
export function getStoredVideoProjects(): VideoProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveVideoProject(project: VideoProject): VideoProject[] {
  try {
    const current = getStoredVideoProjects();
    const index = current.findIndex((p) => p.id === project.id);
    let updated: VideoProject[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...project, updatedAt: Date.now() };
    } else {
      updated = [{ ...project, updatedAt: Date.now() }, ...current];
    }
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save video project:', err);
    return getStoredVideoProjects();
  }
}

export function deleteVideoProject(id: string): VideoProject[] {
  try {
    const current = getStoredVideoProjects();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    return updated;
  } catch {
    return getStoredVideoProjects();
  }
}

// ==========================================
// 2. Publishing Records Storage
// ==========================================
export function getPublishingRecords(): PublishingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUBLISHING);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePublishingRecord(record: PublishingRecord): PublishingRecord[] {
  try {
    const current = getPublishingRecords();
    const updated = [record, ...current];
    localStorage.setItem(STORAGE_KEY_PUBLISHING, JSON.stringify(updated));
    return updated;
  } catch {
    return getPublishingRecords();
  }
}

export function deletePublishingRecord(id: string): PublishingRecord[] {
  try {
    const current = getPublishingRecords();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_PUBLISHING, JSON.stringify(updated));
    return updated;
  } catch {
    return getPublishingRecords();
  }
}

// ==========================================
// 3. Social Account Credentials
// ==========================================
export function getSocialAccountConfig(): SocialAccountConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOCIAL);
    if (!raw) return DEFAULT_SOCIAL_CONFIG;
    return { ...DEFAULT_SOCIAL_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOCIAL_CONFIG;
  }
}

export function saveSocialAccountConfig(config: SocialAccountConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOCIAL, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save social config:', err);
  }
}

// ==========================================
// 4. Video Studio Settings
// ==========================================
export function getVideoStudioSettings(): VideoStudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_STUDIO_SETTINGS;
    return { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STUDIO_SETTINGS;
  }
}

export function saveVideoStudioSettings(settings: VideoStudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save studio settings:', err);
  }
}
