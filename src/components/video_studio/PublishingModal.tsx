import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  ShieldAlert,
  Share2,
  AlertTriangle,
  Lock,
  Globe,
  Eye,
} from 'lucide-react';
import { VideoProject } from '../../types/videoStudio';
import { getSocialAccountConfig } from '../../utils/videoStudioStorage';
import { uploadVideoToYouTube } from '../../utils/youtubePublisher';
import { uploadVideoToFacebook } from '../../utils/facebookPublisher';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  videoBlob: Blob;
  lang: 'bn' | 'en';
  onPublishedSuccess?: () => void;
}

export const PublishingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  videoBlob,
  lang,
  onPublishedSuccess,
}) => {
  if (!isOpen) return null;

  const isBn = lang === 'bn';
  const socialConfig = getSocialAccountConfig();

  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'both'>('youtube');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{
    youtubeUrl?: string;
    facebookUrl?: string;
    error?: string;
  } | null>(null);

  const handleStartPublishing = async () => {
    setIsUploading(true);
    setProgress(5);
    setUploadResult(null);

    let ytSuccess = false;
    let fbSuccess = false;
    let ytLink: string | undefined;
    let fbLink: string | undefined;
    let lastError: string | undefined;

    // 1. YouTube Upload
    if (platform === 'youtube' || platform === 'both') {
      setStatusMessage(isBn ? 'ইউটিউবে ভিডিও আপলোড হচ্ছে...' : 'Uploading to YouTube Channel...');
      const ytRes = await uploadVideoToYouTube({
        projectId: project.id,
        videoBlob,
        title: project.metadataSEO?.youtube.title || project.title,
        description: project.metadataSEO?.youtube.description || project.title,
        tags: project.metadataSEO?.youtube.tags,
        privacyStatus: privacy,
        onProgress: (p) => setProgress(platform === 'both' ? Math.round(p / 2) : p),
      });

      if (ytRes.success) {
        ytSuccess = true;
        ytLink = ytRes.videoUrl;
      } else {
        lastError = ytRes.error;
      }
    }

    // 2. Facebook Upload
    if (platform === 'facebook' || platform === 'both') {
      setStatusMessage(isBn ? 'ফেসবুক পেজে ভিডিও আপলোড হচ্ছে...' : 'Publishing to Facebook Page...');
      const fbRes = await uploadVideoToFacebook({
        projectId: project.id,
        videoBlob,
        title: project.title,
        description: project.metadataSEO?.facebook.caption || project.title,
        isReel: project.format === 'shorts',
        onProgress: (p) => setProgress(platform === 'both' ? 50 + Math.round(p / 2) : p),
      });

      if (fbRes.success) {
        fbSuccess = true;
        fbLink = fbRes.postUrl;
      } else {
        lastError = fbRes.error;
      }
    }

    setIsUploading(false);
    setProgress(100);

    setUploadResult({
      youtubeUrl: ytLink,
      facebookUrl: fbLink,
      error: (!ytSuccess && !fbSuccess) ? lastError : undefined,
    });

    if (ytSuccess || fbSuccess) {
      onPublishedSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B63F6] to-emerald-600 flex items-center justify-center text-white shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isBn ? 'সোশাল মিডিয়ায় সরাসরি পাবলিশ' : 'Direct Social Media Publishing'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'ইউটিউব ও ফেসবুক পেজে অফিশিয়াল এপিআই দিয়ে আপলোড' : 'Publish to your official accounts'}
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Video Overview Card */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
          {project.thumbnailDataUrl ? (
            <img
              src={project.thumbnailDataUrl}
              alt="Thumbnail"
              className="w-16 h-16 rounded-xl object-cover border border-slate-600 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              🎬
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {project.metadataSEO?.youtube.title || project.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                {project.format === 'shorts' ? 'Shorts / Reel' : 'Landscape'}
              </span>
              <span>•</span>
              <span>{project.durationSec}s</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{project.renderedVideoSizeMb || 4.2} MB</span>
            </div>
          </div>
        </div>

        {/* Upload Success View */}
        {uploadResult && (uploadResult.youtubeUrl || uploadResult.facebookUrl) && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{isBn ? 'ভিডিও সফলভাবে পাবলিশ হয়েছে!' : 'Video Published Successfully!'}</span>
            </div>

            {uploadResult.youtubeUrl && (
              <a
                href={uploadResult.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-red-600/20 border border-red-500/40 text-red-200 text-xs font-bold flex items-center justify-between hover:bg-red-600/30 transition"
              >
                <span>▶ YouTube Link: {uploadResult.youtubeUrl}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            )}

            {uploadResult.facebookUrl && (
              <a
                href={uploadResult.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-200 text-xs font-bold flex items-center justify-between hover:bg-blue-600/30 transition"
              >
                <span>f Facebook Post: {uploadResult.facebookUrl}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition"
            >
              {isBn ? 'সম্পন্ন (Done)' : 'Done'}
            </button>
          </div>
        )}

        {/* Upload Failure View */}
        {uploadResult?.error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <XCircle className="w-4 h-4" />
              <span>{isBn ? 'পাবলিশিং ব্যর্থ হয়েছে' : 'Publishing Failed'}</span>
            </div>
            <p className="leading-relaxed text-[11px]">{uploadResult.error}</p>
          </div>
        )}

        {/* Upload In-Progress Bar */}
        {isUploading && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-center">
            <span className="text-xs font-bold text-blue-300 block">{statusMessage}</span>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{progress}% Completed</span>
          </div>
        )}

        {!uploadResult?.youtubeUrl && !uploadResult?.facebookUrl && !isUploading && (
          <div className="space-y-4 text-xs">
            {/* Target Platform Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                {isBn ? 'পাবলিশিং প্ল্যাটফর্ম নির্বাচন করুন:' : 'Select Target Platform:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPlatform('youtube')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    platform === 'youtube'
                      ? 'bg-red-600/30 border-red-500 text-white ring-1 ring-red-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-lg">▶</span>
                  <span className="font-bold text-[11px]">YouTube</span>
                  <span className="text-[9px] text-slate-400">
                    {socialConfig.youtube.connected ? (isBn ? 'সংযুক্ত' : 'Connected') : (isBn ? 'অফলাইন' : 'Not Connected')}
                  </span>
                </button>

                <button
                  onClick={() => setPlatform('facebook')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    platform === 'facebook'
                      ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-lg font-bold">f</span>
                  <span className="font-bold text-[11px]">Facebook</span>
                  <span className="text-[9px] text-slate-400">
                    {socialConfig.facebook.connected ? (isBn ? 'সংযুক্ত' : 'Connected') : (isBn ? 'অফলাইন' : 'Not Connected')}
                  </span>
                </button>

                <button
                  onClick={() => setPlatform('both')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    platform === 'both'
                      ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-lg">⚡</span>
                  <span className="font-bold text-[11px]">{isBn ? 'উভয় প্ল্যাটফর্ম' : 'Both'}</span>
                  <span className="text-[9px] text-slate-400">YouTube + FB</span>
                </button>
              </div>
            </div>

            {/* Privacy Setting for YouTube */}
            {(platform === 'youtube' || platform === 'both') && (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {isBn ? 'ইউটিউব ভিজিবিলিটি (Privacy Status):' : 'YouTube Visibility:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['public', 'unlisted', 'private'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrivacy(p)}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-bold capitalize transition ${
                        privacy === p
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {p === 'public'
                        ? (isBn ? 'পাবলিক (Public)' : 'Public')
                        : p === 'unlisted'
                        ? (isBn ? 'আনলিস্টেড (Unlisted)' : 'Unlisted')
                        : (isBn ? 'প্রাইভেট (Private)' : 'Private')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Explicit Confirmation Requirement */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                {isBn
                  ? 'নিরাপত্তা বার্তা: আপনার সুস্পষ্ট অনুমোদন ছাড়া কোনো ভিডিও স্বয়ংক্রিয়ভাবে পাবলিশ হবে না। নিচের বাটনে ক্লিক করলে তবেই আপলোড সম্পন্ন হবে।'
                  : 'Explicit Approval Required: No video is published automatically without your manual click.'}
              </span>
            </div>

            {/* Start Upload Button */}
            <button
              onClick={handleStartPublishing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-blue-600 to-emerald-600 hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-blue-500/20"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {platform === 'youtube'
                  ? (isBn ? 'ইউটিউবে ভিডিও আপলোড করুন' : 'Publish to YouTube')
                  : platform === 'facebook'
                  ? (isBn ? 'ফেসবুক পেজে পোস্ট করুন' : 'Publish to Facebook Page')
                  : (isBn ? 'উভয় প্ল্যাটফর্মে একসাথে পাবলিশ করুন' : 'Publish to Both Platforms')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
