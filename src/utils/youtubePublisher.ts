import { PublishingRecord } from '../types/videoStudio';
import { getSocialAccountConfig, savePublishingRecord } from './videoStudioStorage';

export interface YouTubeUploadOptions {
  projectId: string;
  videoBlob: Blob;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
  onProgress?: (percent: number) => void;
}

/**
 * Official YouTube Data API v3 Upload implementation
 */
export async function uploadVideoToYouTube(
  options: YouTubeUploadOptions
): Promise<{ success: boolean; videoId?: string; videoUrl?: string; error?: string }> {
  const config = getSocialAccountConfig();
  const token = config.youtube.accessToken;

  if (!token) {
    return {
      success: false,
      error: 'ইউটিউব একাউন্ট যুক্ত করা হয়নি। অনুগ্রহ করে প্রথমে গুগল OAuth অ্যাক্সেস টোকেন প্রদান করুন।',
    };
  }

  try {
    options.onProgress?.(10);

    // Metadata payload
    const metadata = {
      snippet: {
        title: options.title.slice(0, 100),
        description: options.description.slice(0, 5000),
        tags: options.tags || ['SmartHub', 'Shorts'],
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: options.privacyStatus || 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // Multipart upload
    const boundary = '---------------------------' + Date.now().toString(16);
    const metadataPart =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n`;

    const closingBoundary = `\r\n--${boundary}--\r\n`;

    const videoBytes = await options.videoBlob.arrayBuffer();

    // Assemble multipart payload
    const payloadBlob = new Blob(
      [
        metadataPart,
        `--${boundary}\r\nContent-Type: ${options.videoBlob.type || 'video/mp4'}\r\n\r\n`,
        videoBytes,
        closingBoundary,
      ],
      { type: `multipart/related; boundary=${boundary}` }
    );

    options.onProgress?.(40);

    const uploadUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status';

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payloadBlob,
    });

    options.onProgress?.(85);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${response.status}: YouTube upload failed`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const videoId = data.id;
    const videoUrl = `https://youtu.be/${videoId}`;

    options.onProgress?.(100);

    // Save to Publishing Records
    const record: PublishingRecord = {
      id: `pub-${Date.now()}`,
      projectId: options.projectId,
      videoTitle: options.title,
      platform: 'youtube',
      publishedAt: Date.now(),
      status: 'success',
      youtubeVideoId: videoId,
      youtubeUrl: videoUrl,
    };
    savePublishingRecord(record);

    return {
      success: true,
      videoId,
      videoUrl,
    };
  } catch (err: any) {
    const errorMsg = err.message || 'YouTube Upload Failed';
    // Save failed record
    savePublishingRecord({
      id: `pub-${Date.now()}`,
      projectId: options.projectId,
      videoTitle: options.title,
      platform: 'youtube',
      publishedAt: Date.now(),
      status: 'failed',
      errorDetails: errorMsg,
    });
    return {
      success: false,
      error: errorMsg,
    };
  }
}
