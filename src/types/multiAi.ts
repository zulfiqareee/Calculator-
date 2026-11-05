export type AIProviderId = 'gemini' | 'groq' | 'huggingface' | 'pollinations' | 'local_offline';

export type AITaskType =
  | 'script_generation'
  | 'scene_prompts'
  | 'image_generation'
  | 'text_to_speech'
  | 'seo_metadata'
  | 'video_rendering';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  supportedTasks: AITaskType[];
  priority: number;
  enabled: boolean;
  hasApiKey: boolean;
  apiKey?: string;
  status: 'active' | 'rate_limited' | 'error' | 'disabled';
  lastUsedAt?: number;
  lastError?: string | null;
  successCount: number;
  failureCount: number;
  freeTierInfo: string;
  rateLimitResetAt?: number;
}

export type VideoMode = 'voice' | 'voiceless';
export type VideoFormat = 'shorts' | 'landscape'; // shorts = 9:16, landscape = 16:9
export type VideoDurationSec = 15 | 30 | 60 | 90 | 120 | 180;
export type VideoLanguage = 'bn' | 'en';
export type VideoStyle =
  | 'realistic'
  | 'cinematic'
  | 'documentary'
  | 'educational'
  | 'motivational'
  | 'islamic'
  | 'tech'
  | 'health';

export interface VideoScene {
  id: string;
  sceneNumber: number;
  durationSec: number;
  narrationText: string;
  onScreenText: string;
  visualDescription: string;
  imagePrompt: string;
  visualImageUrl?: string;
  audioWavBase64?: string;
  transitionType: 'fade' | 'zoom' | 'slide' | 'dissolve';
  cameraMotion: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'subtle_drift';
}

export interface VideoScript {
  topic: string;
  mode: VideoMode;
  hookOpening: string;
  scenes: VideoScene[];
  closingStatement: string;
  callToAction: string;
  sourcesAndReferences?: string[];
  totalEstimatedSeconds: number;
  generatedByProvider: AIProviderId;
  providerName: string;
}

export interface VideoMetadataSEO {
  youtube: {
    title: string;
    description: string;
    tags: string[];
    keywords: string[];
    hashtags: string[];
    suggestedCategory: string;
    thumbnailText: string;
    pinnedComment: string;
  };
  facebook: {
    caption: string;
    description: string;
    hashtags: string[];
    hookSentence: string;
    callToAction: string;
  };
  generatedByProvider: AIProviderId;
}

export interface VideoProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: VideoMode;
  language: VideoLanguage;
  format: VideoFormat;
  durationSec: VideoDurationSec;
  style: VideoStyle;
  customInstructions?: string;
  script: VideoScript;
  voiceGender: 'male' | 'female';
  voiceSpeed: number;
  bgMusicTrack: string;
  bgMusicVolume: number;
  voiceVolume: number;
  subtitleFontSize: number;
  subtitleEnabled: boolean;
  renderedVideoBlobUrl?: string;
  renderedVideoSizeMb?: number;
  renderStatus: 'draft' | 'rendering' | 'ready' | 'failed';
  metadataSEO?: VideoMetadataSEO;
  thumbnailDataUrl?: string;
}

export interface PublishingRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  platform: 'youtube' | 'facebook' | 'both';
  youtubeUrl?: string;
  facebookUrl?: string;
  publishedAt: number;
  status: 'published' | 'failed' | 'scheduled';
  privacy: 'public' | 'unlisted' | 'private';
  notes?: string;
}

export interface SocialAccountConfig {
  youtube: {
    channelTitle?: string;
    apiKey?: string;
    accessToken?: string;
    isConnected: boolean;
  };
  facebook: {
    pageName?: string;
    pageId?: string;
    pageAccessToken?: string;
    isConnected: boolean;
  };
}
