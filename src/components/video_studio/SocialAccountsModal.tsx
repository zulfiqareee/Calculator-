import React, { useState } from 'react';
import {
  Share2,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Save,
  Trash2,
  KeyRound,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SocialAccountConfig } from '../../types/videoStudio';
import { getSocialAccountConfig, saveSocialAccountConfig } from '../../utils/videoStudioStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
}

export const SocialAccountsModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const isBn = lang === 'bn';
  const [config, setConfig] = useState<SocialAccountConfig>(getSocialAccountConfig());
  const [activeTab, setActiveTab] = useState<'youtube' | 'facebook'>('youtube');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form states
  const [ytChannelTitle, setYtChannelTitle] = useState(config.youtube.channelTitle || '');
  const [ytToken, setYtToken] = useState(config.youtube.accessToken || '');
  const [ytClientId, setYtClientId] = useState(config.youtube.clientId || '');

  const [fbPageName, setFbPageName] = useState(config.facebook.pageName || '');
  const [fbPageId, setFbPageId] = useState(config.facebook.pageId || '');
  const [fbToken, setFbToken] = useState(config.facebook.pageAccessToken || '');

  const handleSaveYouTube = () => {
    const updated: SocialAccountConfig = {
      ...config,
      youtube: {
        connected: !!ytToken.trim(),
        channelTitle: ytChannelTitle.trim() || 'My YouTube Channel',
        accessToken: ytToken.trim(),
        clientId: ytClientId.trim(),
      },
    };
    saveSocialAccountConfig(updated);
    setConfig(updated);
    setSaveSuccessMsg(isBn ? 'ইউটিউব কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!' : 'YouTube config saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleDisconnectYouTube = () => {
    const updated: SocialAccountConfig = {
      ...config,
      youtube: { connected: false },
    };
    saveSocialAccountConfig(updated);
    setConfig(updated);
    setYtToken('');
    setYtChannelTitle('');
    setYtClientId('');
  };

  const handleSaveFacebook = () => {
    const updated: SocialAccountConfig = {
      ...config,
      facebook: {
        connected: !!fbToken.trim() && !!fbPageId.trim(),
        pageName: fbPageName.trim() || 'My Facebook Page',
        pageId: fbPageId.trim(),
        pageAccessToken: fbToken.trim(),
      },
    };
    saveSocialAccountConfig(updated);
    setConfig(updated);
    setSaveSuccessMsg(isBn ? 'ফেসবুক পেজ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!' : 'Facebook config saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleDisconnectFacebook = () => {
    const updated: SocialAccountConfig = {
      ...config,
      facebook: { connected: false },
    };
    saveSocialAccountConfig(updated);
    setConfig(updated);
    setFbToken('');
    setFbPageId('');
    setFbPageName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isBn ? 'সোশাল মিডিয়া একাউন্ট সংযোগ' : 'Connect Social Media Accounts'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'ইউটিউব চ্যানেল ও ফেসবুক পেজে সরাসরি ভিডিও আপলোড' : 'Direct publishing to YouTube & Facebook'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in shadow-md">
            {saveSuccessMsg}
          </div>
        )}

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-800 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>▶</span>
            <span>YouTube ({config.youtube.connected ? (isBn ? 'সংযুক্ত' : 'Connected') : (isBn ? 'অসংযুক্ত' : 'Off')})</span>
          </button>

          <button
            onClick={() => setActiveTab('facebook')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'facebook'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>f</span>
            <span>Facebook ({config.facebook.connected ? (isBn ? 'সংযুক্ত' : 'Connected') : (isBn ? 'অসংযুক্ত' : 'Off')})</span>
          </button>
        </div>

        {/* 1. YouTube Tab */}
        {activeTab === 'youtube' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {config.youtube.connected
                    ? `${config.youtube.channelTitle || 'YouTube Channel'} (সক্রিয়)`
                    : (isBn ? 'ইউটিউব ডাটা এপিআই সংযোগ প্রয়োজন' : 'YouTube Data API connection required')}
                </span>
              </div>
              {config.youtube.connected && (
                <button
                  onClick={handleDisconnectYouTube}
                  className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40 text-[11px] font-bold"
                >
                  {isBn ? 'বিচ্ছিন্ন করুন' : 'Disconnect'}
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'চ্যানেলের নাম (Channel Name):' : 'Channel Name:'}
              </label>
              <input
                type="text"
                value={ytChannelTitle}
                onChange={(e) => setYtChannelTitle(e.target.value)}
                placeholder="My Official Channel"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-red-400" />
                <span>{isBn ? 'গুগল OAuth এক্সেস টোকেন (Access Token):' : 'Google OAuth Access Token:'}</span>
              </label>
              <textarea
                rows={2}
                value={ytToken}
                onChange={(e) => setYtToken(e.target.value)}
                placeholder="ya29.a0AfH6SMC..."
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <span className="font-bold text-slate-300 block flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                {isBn ? 'টোকেন পাওয়ার নিয়ম:' : 'How to get free token:'}
              </span>
              <p>
                {isBn
                  ? 'গুগল ক্লাউড কনসোল (Google Cloud Console) থেকে বিনামূল্যে YouTube Data API v3 সক্রিয় করে OAuth 2.0 Playground থেকে সহজেই এক্সেস টোকেন সংগ্রহ করা যায়।'
                  : 'Enable YouTube Data API v3 for free in Google Cloud Console, then obtain a client token via Google OAuth 2.0 Playground.'}
              </p>
            </div>

            <button
              onClick={handleSaveYouTube}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-red-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isBn ? 'ইউটিউব সেটিংস সংরক্ষণ করুন' : 'Save YouTube Configuration'}</span>
            </button>
          </div>
        )}

        {/* 2. Facebook Tab */}
        {activeTab === 'facebook' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {config.facebook.connected
                    ? `${config.facebook.pageName || 'Facebook Page'} (সক্রিয়)`
                    : (isBn ? 'ফেসবুক পেজ সংযোগ প্রয়োজন' : 'Facebook Page connection required')}
                </span>
              </div>
              {config.facebook.connected && (
                <button
                  onClick={handleDisconnectFacebook}
                  className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 text-[11px] font-bold"
                >
                  {isBn ? 'বিচ্ছিন্ন করুন' : 'Disconnect'}
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'ফেসবুক পেজ নাম (Page Name):' : 'Page Name:'}
              </label>
              <input
                type="text"
                value={fbPageName}
                onChange={(e) => setFbPageName(e.target.value)}
                placeholder="SmartHub Official"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'ফেসবুক পেজ আইডি (Page ID):' : 'Facebook Page ID:'}
              </label>
              <input
                type="text"
                value={fbPageId}
                onChange={(e) => setFbPageId(e.target.value)}
                placeholder="104928392019..."
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>{isBn ? 'পেজ অ্যাক্সেস টোকেন (Page Access Token):' : 'Page Access Token:'}</span>
              </label>
              <textarea
                rows={2}
                value={fbToken}
                onChange={(e) => setFbToken(e.target.value)}
                placeholder="EAA..."
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <span className="font-bold text-slate-300 block flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                {isBn ? 'পেজ টোকেন পাওয়ার নিয়ম:' : 'How to get Page token:'}
              </span>
              <p>
                {isBn
                  ? 'মেটা ডেভেলপার পোর্টাল (Meta for Developers) এর Graph API Explorer থেকে বিনামূল্যে আপনার পেজের Never-Expiring Page Access Token নিয়ে পেস্ট করুন।'
                  : 'Generate a Page Access Token via Meta Graph API Explorer under your owned Page.'}
              </p>
            </div>

            <button
              onClick={handleSaveFacebook}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-blue-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isBn ? 'ফেসবুক পেজ সেটিংস সংরক্ষণ করুন' : 'Save Facebook Configuration'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
