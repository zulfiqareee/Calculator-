import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Play,
  Download,
  Trash2,
  Share2,
  Settings as SettingsIcon,
  History,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Video,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { VideoProject, PublishingRecord } from '../../types/videoStudio';
import {
  getStoredVideoProjects,
  deleteVideoProject,
  getPublishingRecords,
  deletePublishingRecord,
  getSocialAccountConfig,
  getVideoStudioSettings,
  saveVideoStudioSettings,
} from '../../utils/videoStudioStorage';
import {
  AUTHORIZED_ADMIN_EMAIL,
  getAdminSession,
  getAdminPassword,
  setAdminSession,
} from '../../utils/adminAuth';
import { VideoCreationWizard } from './VideoCreationWizard';
import { SocialAccountsModal } from './SocialAccountsModal';

interface Props {
  lang: 'bn' | 'en';
  onBackToApp: () => void;
}

export const AiVideoStudioMain: React.FC<Props> = ({ lang, onBackToApp }) => {
  const isBn = lang === 'bn';

  // 1. Authorization check
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const session = getAdminSession();
    return session?.email === AUTHORIZED_ADMIN_EMAIL;
  });
  const [adminInputPassword, setAdminInputPassword] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // 2. Navigation State
  const [activeTab, setActiveTab] = useState<'create' | 'projects' | 'history' | 'social' | 'settings'>('projects');
  const [isWizardActive, setIsWizardActive] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<VideoProject | null>(null);

  // 3. Stored Data
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [historyRecords, setHistoryRecords] = useState<PublishingRecord[]>([]);
  const [socialConfig, setSocialConfig] = useState(getSocialAccountConfig());
  const [studioSettings, setStudioSettings] = useState(getVideoStudioSettings());

  // 4. Modals
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminAuthenticated) {
      setProjects(getStoredVideoProjects());
      setHistoryRecords(getPublishingRecords());
      setSocialConfig(getSocialAccountConfig());
    }
  }, [isAdminAuthenticated, isWizardActive]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const realPass = getAdminPassword();
    if (adminInputPassword.trim() === realPass) {
      setAdminSession(AUTHORIZED_ADMIN_EMAIL);
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
    } else {
      setAdminAuthError(isBn ? 'ভুল পাসওয়ার্ড! শুধুমাত্র অ্যাডমিন প্রবেশ করতে পারবেন।' : 'Incorrect password! Only admin authorized.');
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isBn ? 'এই ভিডিও প্রজেক্টটি মুছে ফেলতে চান?' : 'Delete this video project?')) {
      const updated = deleteVideoProject(id);
      setProjects(updated);
    }
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deletePublishingRecord(id);
    setHistoryRecords(updated);
  };

  const handleSaveSettings = () => {
    saveVideoStudioSettings(studioSettings);
    setSettingsSuccess(isBn ? 'স্টুডিও সেটিংস সংরক্ষিত হয়েছে!' : 'Studio settings saved!');
    setTimeout(() => setSettingsSuccess(null), 3000);
  };

  // -------------------------------------------------------------------------
  // SECURE ADMIN AUTH GATE
  // -------------------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[70vh] text-white">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 w-full">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg text-white">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-black">
              {isBn ? 'প্রশাসক প্রবেশাধিকার সংরক্ষিত' : 'Admin Authorization Required'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'এআই ভিডিও স্টুডিও শুধুমাত্র অ্যাপের সত্ত্বাধিকারী ও অ্যাডমিনের জন্য।' : 'AI Video Studio is strictly restricted to the app owner.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-xs text-slate-300">
            <span className="text-[10px] text-slate-400 block">{isBn ? 'অনুমোদিত অ্যাডমিন:' : 'Authorized Account:'}</span>
            <span className="font-mono text-emerald-400 font-bold">{AUTHORIZED_ADMIN_EMAIL}</span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div>
              <input
                type="password"
                value={adminInputPassword}
                onChange={(e) => setAdminInputPassword(e.target.value)}
                placeholder={isBn ? 'অ্যাডমিন গোপন পিন / পাসওয়ার্ড' : 'Enter Admin Password'}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-bold text-center placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
              />
            </div>

            {adminAuthError && (
              <div className="text-[11px] text-rose-400 font-bold bg-rose-950/40 p-2 rounded-xl border border-rose-500/40">
                {adminAuthError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-purple-600 hover:opacity-95 text-white font-black text-xs transition active:scale-98 shadow-md"
            >
              {isBn ? 'স্টুডিও আনলক করুন' : 'Unlock Studio'}
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="text-xs text-slate-400 hover:text-white pt-2 block mx-auto font-bold"
          >
            ← {isBn ? 'অ্যাপে ফিরে যান' : 'Return to App'}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ACTIVE WIZARD VIEW
  // -------------------------------------------------------------------------
  if (isWizardActive) {
    return (
      <VideoCreationWizard
        lang={lang}
        initialProject={editingProject}
        onBackToDashboard={() => {
          setIsWizardActive(false);
          setEditingProject(null);
        }}
        onProjectSaved={(p) => {
          setProjects(getStoredVideoProjects());
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // MAIN STUDIO DASHBOARD
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full select-none pb-12 animate-fade-in text-white">
      {/* Top Banner Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B1A30] to-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg text-white">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isBn ? 'এআই ভিডিও স্টুডিও' : 'AI Video Studio'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                PRO OWNER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isBn ? 'স্বয়ংক্রিয় স্ক্রিপ্ট, ভয়েস, দৃশ্য ও সোশ্যাল পাবলিশার' : 'Auto scripts, voice, visuals & direct publishing'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingProject(null);
            setIsWizardActive(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-purple-600 hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন ভিডিও' : 'Create'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner text-xs font-bold">
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'projects'
              ? 'bg-[#0B63F6] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span className="truncate">{isBn ? 'প্রজেক্ট' : 'Projects'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'bg-[#0B63F6] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span className="truncate">{isBn ? 'পাবলিশ' : 'History'}</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'social'
              ? 'bg-[#0B63F6] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="truncate">{isBn ? 'সোশ্যাল' : 'Accounts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'settings'
              ? 'bg-[#0B63F6] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span className="truncate">{isBn ? 'সেটিংস' : 'Settings'}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MY VIDEO PROJECTS
          ========================================================================= */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                🎬
              </div>
              <h3 className="text-sm font-bold text-white">
                {isBn ? 'এখনো কোনো ভিডিও প্রজেক্ট তৈরি করা হয়নি' : 'No video projects created yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isBn
                  ? 'উপরে "নতুন ভিডিও" বাটনে ক্লিক করে আকর্ষণীয় এআই শর্টস বা ইউটিউব ভিডিও তৈরি শুরু করুন।'
                  : 'Tap "Create" above to generate your first AI video for YouTube and Facebook.'}
              </p>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsWizardActive(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs transition active:scale-95 shadow-md"
              >
                + {isBn ? 'প্রথম ভিডিও তৈরি করুন' : 'Create First Video'}
              </button>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setEditingProject(proj);
                  setIsWizardActive(true);
                }}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {proj.thumbnailDataUrl ? (
                    <img
                      src={proj.thumbnailDataUrl}
                      alt="Thumbnail"
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                      🎬
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#69DCC0] transition truncate">
                      {proj.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                        {proj.format === 'shorts' ? '9:16 Shorts' : '16:9 Landscape'}
                      </span>
                      <span>•</span>
                      <span>{proj.durationSec}s</span>
                      <span>•</span>
                      <span className={proj.renderedVideoBlobUrl ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {proj.renderedVideoBlobUrl ? (isBn ? 'MP4 প্রস্তুত' : 'MP4 Ready') : (isBn ? 'ড্রাফট' : 'Draft')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {proj.renderedVideoBlobUrl && (
                    <a
                      href={proj.renderedVideoBlobUrl}
                      download={`${proj.title}_video.mp4`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#69DCC0] transition"
                      title={isBn ? 'ডাউনলোড' : 'Download'}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                    title={isBn ? 'মুছুন' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PUBLISHING HISTORY
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {historyRecords.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <History className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">
                {isBn ? 'কোনো পাবলিশিং রেকর্ড নেই' : 'No publishing history yet'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'ভিডিও তৈরির পর ইউটিউব বা ফেসবুকে আপলোড করলে এখানে তালিকা সংরক্ষিত থাকবে।' : 'Upload videos to YouTube or Facebook to see records here.'}
              </p>
            </div>
          ) : (
            historyRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                    rec.platform === 'youtube'
                      ? 'bg-red-600'
                      : rec.platform === 'facebook'
                      ? 'bg-blue-600'
                      : 'bg-emerald-600'
                  }`}>
                    {rec.platform === 'youtube' ? '▶' : 'f'}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-white truncate">{rec.videoTitle}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {new Date(rec.publishedAt).toLocaleDateString()} • {rec.platform.toUpperCase()} •{' '}
                      <span className={rec.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {rec.status === 'success' ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rec.youtubeUrl && (
                    <a
                      href={rec.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/30 font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {rec.facebookUrl && (
                    <a
                      href={rec.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>Facebook</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    onClick={(e) => handleDeleteRecord(rec.id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SOCIAL ACCOUNTS
          ========================================================================= */}
      {activeTab === 'social' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white">
                {isBn ? 'সংযুক্ত সোশ্যাল মিডিয়া চ্যানেল' : 'Connected Social Channels'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'আপনার নিজস্ব ইউটিউব চ্যানেল ও ফেসবুক পেজ' : 'Manage your YouTube & Facebook integration'}
              </p>
            </div>

            <button
              onClick={() => setShowSocialModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs active:scale-95 transition shadow-sm"
            >
              ⚙️ {isBn ? 'টোকেন কনফিগার' : 'Configure'}
            </button>
          </div>

          {/* YouTube Card */}
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                ▶
              </div>
              <div>
                <span className="font-bold text-sm text-white block">YouTube Channel</span>
                <span className="text-[11px] text-slate-400 block">
                  {socialConfig.youtube.connected
                    ? `${socialConfig.youtube.channelTitle || 'Connected'} (Active)`
                    : (isBn ? 'টোকেন যুক্ত করা হয়নি' : 'Not Connected')}
                </span>
              </div>
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
              socialConfig.youtube.connected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {socialConfig.youtube.connected ? (isBn ? 'সংযুক্ত ✓' : 'Connected ✓') : (isBn ? 'অসংযুক্ত' : 'Offline')}
            </span>
          </div>

          {/* Facebook Card */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                f
              </div>
              <div>
                <span className="font-bold text-sm text-white block">Facebook Page</span>
                <span className="text-[11px] text-slate-400 block">
                  {socialConfig.facebook.connected
                    ? `${socialConfig.facebook.pageName || 'Connected Page'} (Active)`
                    : (isBn ? 'পেজ আইডি ও টোকেন যুক্ত করা হয়নি' : 'Not Connected')}
                </span>
              </div>
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
              socialConfig.facebook.connected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {socialConfig.facebook.connected ? (isBn ? 'সংযুক্ত ✓' : 'Connected ✓') : (isBn ? 'অসংযুক্ত' : 'Offline')}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: STUDIO SETTINGS
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white">
                {isBn ? 'এআই স্টুডিও সেটিংস ও সার্ভিস ম্যানেজার' : 'AI Studio & Service Manager'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'ফ্রি-ফার্স্ট অপারেশন ও কোটা ম্যানেজমেন্ট' : 'Free-first operation & quota settings'}
              </p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in shadow-md">
              {settingsSuccess}
            </div>
          )}

          {/* Gemini API Key */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              {isBn ? 'Gemini API Key (ফ্রি টিয়ার সমর্থন):' : 'Gemini API Key (Free tier):'}
            </label>
            <input
              type="password"
              value={studioSettings.geminiApiKey || ''}
              onChange={(e) => setStudioSettings({ ...studioSettings, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              {isBn ? 'ফ্রি-কি দিয়ে আনলিমিটেড স্ক্রিপ্ট ও এসইও ট্যাগ তৈরি করুন।' : 'Generates scripts & SEO metadata using free quota.'}
            </span>
          </div>

          {/* Default Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'ডিফল্ট ফরম্যাট:' : 'Default Format:'}
              </label>
              <select
                value={studioSettings.defaultFormat}
                onChange={(e) => setStudioSettings({ ...studioSettings, defaultFormat: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="shorts">Vertical 9:16 (Shorts/Reels)</option>
                <option value="landscape">Landscape 16:9 (YouTube)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'ডিফল্ট ভাষা:' : 'Default Language:'}
              </label>
              <select
                value={studioSettings.defaultLanguage}
                onChange={(e) => setStudioSettings({ ...studioSettings, defaultLanguage: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Offline Fallback Guarantee */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">{isBn ? 'ফ্রি-ফার্স্ট অফলাইন ফলব্যাক' : 'Offline Fallback'}</span>
              <span className="text-[10px] text-slate-400 block">
                {isBn ? 'কোটা শেষ হলেও অটোমেটিক টেমপ্লেট দিয়ে ভিডিও তৈরি সচল থাকবে' : 'Smart templates ensure video creation never halts'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={studioSettings.enableOfflineFallback}
              onChange={(e) => setStudioSettings({ ...studioSettings, enableOfflineFallback: e.target.checked })}
              className="w-5 h-5 accent-[#0B63F6] rounded"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-blue-500/25"
          >
            {isBn ? 'স্টুডিও সেটিংস সংরক্ষণ করুন' : 'Save Studio Settings'}
          </button>
        </div>
      )}

      {/* Social Accounts Modal */}
      {showSocialModal && (
        <SocialAccountsModal
          isOpen={showSocialModal}
          onClose={() => {
            setShowSocialModal(false);
            setSocialConfig(getSocialAccountConfig());
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
