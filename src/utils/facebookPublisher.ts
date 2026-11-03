import { PublishingRecord } from '../types/videoStudio';
import { getSocialAccountConfig, savePublishingRecord } from './videoStudioStorage';

export interface FacebookUploadOptions {
  projectId: string;
  videoBlob: Blob;
  title: string;
  description: string;
  isReel?: boolean;
  onProgress?: (percent: number) => void;
}

/**
 * Official Meta Graph API Video/Reel Upload for Facebook Pages
 */
export async function uploadVideoToFacebook(
  options: FacebookUploadOptions
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const config = getSocialAccountConfig();
  const pageId = config.facebook.pageId;
  const pageToken = config.facebook.pageAccessToken;

  if (!pageId || !pageToken) {
    return {
      success: false,
      error: 'ফেসবুক পেজ আইডি অথবা পেজ অ্যাক্সেস টোকেন যুক্ত করা হয়নি। অনুগ্রহ করে সোশাল একাউন্টে সেটিংস কনফিগার করুন।',
    };
  }

  try {
    options.onProgress?.(15);

    const formData = new FormData();
    formData.append('access_token', pageToken);
    formData.append('title', options.title);
    formData.append('description', options.description);
    formData.append('source', options.videoBlob, 'video.mp4');

    options.onProgress?.(45);

    // Endpoint for Facebook Page video upload
    const endpoint = `https://graph.facebook.com/v20.0/${pageId}/videos`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    options.onProgress?.(85);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${response.status}: Facebook upload failed`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const videoId = data.id;
    const postUrl = `https://www.facebook.com/${pageId}/videos/${videoId}`;

    options.onProgress?.(100);

    // Save Record
    const record: PublishingRecord = {
      id: `pub-fb-${Date.now()}`,
      projectId: options.projectId,
      videoTitle: options.title,
      platform: 'facebook',
      publishedAt: Date.now(),
      status: 'success',
      facebookPostId: videoId,
      facebookUrl: postUrl,
    };
    savePublishingRecord(record);

    return {
      success: true,
      postId: videoId,
      postUrl,
    };
  } catch (err: any) {
    const errorMsg = err.message || 'Facebook Upload Failed';
    savePublishingRecord({
      id: `pub-fb-${Date.now()}`,
      projectId: options.projectId,
      videoTitle: options.title,
      platform: 'facebook',
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
