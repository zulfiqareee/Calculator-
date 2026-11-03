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
  visualDescription: string;
  imagePrompt: string;
  visualImageUrl?: string;
  audioWavBase64?: string;
  transitionType: 'fade' | 'zoom' | 'slide' | 'dissolve';
  cameraMotion: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'subtle_drift';
}

export interface VideoScript {
  topic: string;
  hookOpening: string;
  scenes: VideoScene[];
  closingStatement: string;
  callToAction: string;
  sourcesAndReferences?: string[];
  totalEstimatedSeconds: number;
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
}

export interface VideoProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  language: VideoLanguage;
  format: VideoFormat;
  durationSec: VideoDurationSec;
  style: VideoStyle;
  customInstructions?: string;
  script: VideoScript;
  voiceGender: 'male' | 'female';
  voiceSpeed: number; // 0.8 to 1.3
  bgMusicTrack: string;
  bgMusicVolume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
  subtitleFontSize: number;
  subtitleEnabled: boolean;
  metadataSEO?: VideoMetadataSEO;
  thumbnailDataUrl?: string;
  renderedVideoBlobUrl?: string;
  renderedVideoSizeMb?: number;
  renderStatus: 'draft' | 'scripted' | 'rendering' | 'ready' | 'published';
}

export interface PublishingRecord {
  id: string;
  projectId: string;
  videoTitle: string;
  platform: 'youtube' | 'facebook' | 'both';
  publishedAt: number;
  status: 'success' | 'failed' | 'scheduled';
  scheduledFor?: number;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  facebookPostId?: string;
  facebookUrl?: string;
  errorDetails?: string;
}

export interface SocialAccountConfig {
  youtube: {
    connected: boolean;
    channelTitle?: string;
    channelId?: string;
    accessToken?: string;
    tokenExpiry?: number;
    clientId?: string;
  };
  facebook: {
    connected: boolean;
    pageName?: string;
    pageId?: string;
    pageAccessToken?: string;
  };
}

export interface VideoStudioSettings {
  geminiApiKey?: string;
  defaultLanguage: VideoLanguage;
  defaultFormat: VideoFormat;
  defaultDuration: VideoDurationSec;
  defaultStyle: VideoStyle;
  voicePreference: 'male' | 'female';
  speechRate: number;
  enableOfflineFallback: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
}
