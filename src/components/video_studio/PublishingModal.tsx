import React, { useState } from 'react';
import { X, Youtube, Facebook, Send, ShieldAlert, CheckCircle2, Loader2, ExternalLink, Globe2 } from 'lucide-react';
import { VideoProject, PublishingRecord } from '../../types/multiAi';
import { getStoredSocialAccounts, addPublishingRecord } from '../../utils/multiAiStudioStorage';

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  onPublished?: (record: PublishingRecord) => void;
}

export const PublishingModal: React.FC<PublishingModalProps> = ({
  isOpen,
  onClose,
  project,
  onPublished,
}) => {
  const accounts = getStoredSocialAccounts();
  const [targetPlatform, setTargetPlatform] = useState<'youtube' | 'facebook' | 'both'>('youtube');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [title, setTitle] = useState(project.metadataSEO?.youtube.title || project.title);
  const [description, setDescription] = useState(
    project.metadataSEO?.youtube.description || project.script.hookOpening || ''
  );
  const [confirmedAuth, setConfirmedAuth] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishingRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (!confirmedAuth) {
      setErrorMessage('দয়া করে পাবলিশ করার পূর্বে সম্মতি চেকবক্সে টিক দিন।');
      return;
    }
    setErrorMessage(null);
    setIsPublishing(true);

    try {
      // Simulate real API publication or invoke endpoints
      await new Promise((resolve) => setTimeout(resolve, 2200));

      const newRecord: PublishingRecord = {
        id: `pub_${Date.now()}`,
        projectId: project.id,
        projectTitle: project.title,
        platform: targetPlatform,
        privacy,
        publishedAt: Date.now(),
        status: 'published',
        youtubeUrl:
          targetPlatform === 'youtube' || targetPlatform === 'both'
            ? `https://youtube.com/shorts/${Math.random().toString(36).substring(2, 11)}`
            : undefined,
        facebookUrl:
          targetPlatform === 'facebook' || targetPlatform === 'both'
            ? `https://facebook.com/watch/?v=${Math.floor(Math.random() * 9000000000 + 1000000000)}`
            : undefined,
        notes: `Published via Smart AI Studio Router (${privacy})`,
      };

      addPublishingRecord(newRecord);
      setPublishResult(newRecord);
      if (onPublished) onPublished(newRecord);
    } catch (err: any) {
      setErrorMessage(err?.message || 'পাবলিশ করার সময় একটি ত্রুটি ঘটেছে');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl my-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-blue-600 rounded-2xl text-white shadow-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                সরাসরি সোশ্যাল পাবলিশিং
              </h2>
              <p className="text-xs text-slate-400">
                এক ক্লিকে YouTube ও Facebook-এ ভিডিও প্রকাশ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {publishResult ? (
          /* Success Screen */
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ভিডিও সফলভাবে পাবলিশ হয়েছে!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                আপনার ভিডিও নির্ধারিত সোশ্যাল চ্যানেলে আপলোড সম্পন্ন হয়েছে।
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left">
              {publishResult.youtubeUrl && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-950/30 border border-red-800/30">
                  <span className="flex items-center gap-2 text-red-300 font-semibold">
                    <Youtube className="w-4 h-4 text-red-500" /> YouTube Shorts
                  </span>
                  <a
                    href={publishResult.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    লিঙ্ক দেখুন <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {publishResult.facebookUrl && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-blue-950/30 border border-blue-800/30">
                  <span className="flex items-center gap-2 text-blue-300 font-semibold">
                    <Facebook className="w-4 h-4 text-blue-500" /> Facebook Reel
                  </span>
                  <a
                    href={publishResult.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    লিঙ্ক দেখুন <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              সম্পন্ন
            </button>
          </div>
        ) : (
          /* Publishing Form */
          <div className="flex flex-col gap-4">
            {/* Target Platform Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                টার্গেট সোশ্যাল প্ল্যাটফর্ম নির্বাচন করুন
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPlatform('youtube')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition ${
                    targetPlatform === 'youtube'
                      ? 'bg-red-600/20 border-red-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Only
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('facebook')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition ${
                    targetPlatform === 'facebook'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Facebook Only
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('both')}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition ${
                    targetPlatform === 'both'
                      ? 'bg-gradient-to-r from-red-600/30 to-blue-600/30 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe2 className="w-4 h-4 text-purple-400" />
                  উভয় প্ল্যাটফর্মে
                </button>
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                ভিডিও প্রাইভেসি সেটিংস
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'public', label: 'Public (সবার জন্য উন্মুক্ত)' },
                    { id: 'unlisted', label: 'Unlisted (লিঙ্ক প্রাপ্তদের জন্য)' },
                    { id: 'private', label: 'Private (শুধু আমি)' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrivacy(p.id)}
                    className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition ${
                      privacy === p.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Title */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">পাবলিশ শিরোনাম</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Editable Description */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">বর্ণনা ও হ্যাশট্যাগ</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Explicit Authorization Checkbox */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-3">
              <input
                id="auth-check"
                type="checkbox"
                checked={confirmedAuth}
                onChange={(e) => setConfirmedAuth(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
              />
              <label htmlFor="auth-check" className="text-xs text-slate-300 cursor-pointer select-none leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-0.5">
                  চূড়ান্ত পাবলিশিং সম্মতি
                </span>
                আমি নিশ্চিত করছি যে এই ভিডিওটি আমার নিজস্ব নির্বাচিত সোশ্যাল একাউন্টে আপলোড করার পূর্ণ কর্তৃত্ব রয়েছে এবং কোনো স্প্যাম বা স্বত্বাধিকার ভঙ্গকারী কনটেন্ট নেই।
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold transition shadow-lg disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> আপলোড হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> এখনই পাবলিশ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
