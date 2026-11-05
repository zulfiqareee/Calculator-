import { VideoProject, PublishingRecord, SocialAccountConfig } from '../types/multiAi';

const STORAGE_KEY_PROJECTS = 'smart_multi_ai_video_projects_v2';
const STORAGE_KEY_PUBLISH_HISTORY = 'smart_multi_ai_publish_history_v2';
const STORAGE_KEY_SOCIAL_ACCOUNTS = 'smart_multi_ai_social_accounts_v2';

export function getStoredVideoProjects(): VideoProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load video projects:', err);
    return [];
  }
}

export function saveVideoProject(project: VideoProject): void {
  try {
    const current = getStoredVideoProjects();
    const idx = current.findIndex((p) => p.id === project.id);
    let updated: VideoProject[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...project, updatedAt: Date.now() };
    } else {
      updated = [project, ...current];
    }
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save video project:', err);
  }
}

export function deleteVideoProject(projectId: string): void {
  try {
    const current = getStoredVideoProjects();
    const updated = current.filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete video project:', err);
  }
}

export function getStoredPublishingRecords(): PublishingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUBLISH_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function addPublishingRecord(record: PublishingRecord): void {
  try {
    const current = getStoredPublishingRecords();
    const updated = [record, ...current];
    localStorage.setItem(STORAGE_KEY_PUBLISH_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save publishing record:', err);
  }
}

export function getStoredSocialAccounts(): SocialAccountConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOCIAL_ACCOUNTS);
    if (!raw) {
      return {
        youtube: { isConnected: false },
        facebook: { isConnected: false },
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      youtube: { isConnected: false },
      facebook: { isConnected: false },
    };
  }
}

export function saveStoredSocialAccounts(accounts: SocialAccountConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOCIAL_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save social accounts:', err);
  }
}
