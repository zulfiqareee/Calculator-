import React, { useState, useEffect } from 'react';
import { X, Youtube, Facebook, ShieldCheck, CheckCircle2, AlertCircle, Save, ExternalLink, Key, HelpCircle } from 'lucide-react';
import { SocialAccountConfig } from '../../types/multiAi';
import { getStoredSocialAccounts, saveStoredSocialAccounts } from '../../utils/multiAiStudioStorage';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
}) => {
  const [config, setConfig] = useState<SocialAccountConfig>(getStoredSocialAccounts());
  const [activeTab, setActiveTab] = useState<'youtube' | 'facebook'>('youtube');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredSocialAccounts());
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredSocialAccounts(config);
    setSaveSuccess(true);
    if (onAccountsUpdated) onAccountsUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isYoutubeConnected = Boolean(config.youtube.accessToken || config.youtube.apiKey);
  const isFbConnected = Boolean(config.facebook.pageAccessToken && config.facebook.pageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl my-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                সোশ্যাল মিডিয়া পাবলিশিং সংযোগ
              </h2>
              <p className="text-xs text-slate-400">YouTube ও Facebook এ সরাসরি ভিডিও আপলোড করার জন্য ক্রেডেনশিয়াল</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Free-First Notice */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white block mb-0.5">নিরাপদ ও ১০০% ফ্রি অফিসিয়াল এপিআই</strong>
            সমস্ত এক্সেস টোকেন শুধুমাত্র আপনার ব্রাউজারের এনক্রিপ্টেড লোকাল স্টোরেজে সংরক্ষিত থাকে। কোনো বহিরাগত সার্ভারে ডেটা যায় না। মেটা ও গুগলের ফ্রি কোটা ব্যবহার করে প্রতি মাসে আনলিমিটেড ভিডিও শিডিউল ও আপলোড করা যায়।
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Youtube className="w-4 h-4" />
            YouTube Channel
            {isYoutubeConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('facebook')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'facebook'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Facebook className="w-4 h-4" />
            Facebook Page
            {isFbConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'youtube' ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                চ্যানেল নাম / লেবেল (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={config.youtube.channelTitle || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    youtube: { ...config.youtube, channelTitle: e.target.value },
                  })
                }
                placeholder="যেমন: My Tech Bangla Channel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                YouTube OAuth Access Token (আপলোড ও ম্যানেজমেন্ট এর জন্য)
              </label>
              <textarea
                value={config.youtube.accessToken || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    youtube: {
                      ...config.youtube,
                      accessToken: e.target.value.trim(),
                      isConnected: Boolean(e.target.value.trim()),
                    },
                  })
                }
                rows={3}
                placeholder="ya29.a0AfH6SM... (Google Cloud Console থেকে সংগৃহীত OAuth Access Token)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Google Cloud Console থেকে YouTube Data API v3 এনাবল করে ক্লায়েন্ট আইডি দিয়ে তৈরি করুন।
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">সংযোগ স্ট্যাটাস:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  config.youtube.isConnected ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {config.youtube.isConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> কানেক্টেড
                  </>
                ) : (
                  'কানেক্টেড নয়'
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Facebook Page নাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={config.facebook.pageName || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    facebook: { ...config.facebook, pageName: e.target.value },
                  })
                }
                placeholder="যেমন: Smart Daily Tips Page"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={config.facebook.pageId || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    facebook: { ...config.facebook, pageId: e.target.value.trim() },
                  })
                }
                placeholder="যেমন: 104829104928174"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Facebook Page Access Token (Never-Expiring)
              </label>
              <textarea
                value={config.facebook.pageAccessToken || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    facebook: {
                      ...config.facebook,
                      pageAccessToken: e.target.value.trim(),
                      isConnected: Boolean(e.target.value.trim() && config.facebook.pageId),
                    },
                  })
                }
                rows={3}
                placeholder="EAA... (Meta for Developers Graph API Explorer থেকে সংগ্রহ করুন)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                অনুমতি: <code className="text-slate-300">pages_show_list</code>, <code className="text-slate-300">pages_read_engagement</code>, <code className="text-slate-300">pages_manage_posts</code>
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">সংযোগ স্ট্যাটাস:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  config.facebook.isConnected ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {config.facebook.isConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> কানেক্টেড
                  </>
                ) : (
                  'কানেক্টেড নয়'
                )}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> সফলভাবে সেভ হয়েছে!
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              সব ক্রেডেনশিয়াল আপনার ডিভাইসে নিরাপদে সুরক্ষিত
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              বন্ধ করুন
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              ক্রেডেনশিয়াল সেভ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
