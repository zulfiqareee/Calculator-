import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Square,
  Video,
  Download,
  Share2,
  RefreshCw,
  Edit3,
  Layers,
  Sliders,
  Type,
  Music,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Image as ImageIcon,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import {
  VideoMode,
  VideoFormat,
  VideoDurationSec,
  VideoLanguage,
  VideoStyle,
  VideoScript,
  VideoScene,
  VideoProject,
  VideoMetadataSEO,
  AIProviderId,
} from '../../types/multiAi';
import {
  generateSmartScript,
  generateSmartSEO,
  renderMultiAiVideoToBlob,
  playSceneVoice,
  stopSceneVoice,
} from '../../utils/multiAiVideoEngine';
import { saveVideoProject } from '../../utils/multiAiStudioStorage';
import { ThumbnailGeneratorModal } from './ThumbnailGeneratorModal';
import { PublishingModal } from './PublishingModal';

interface VideoCreationWizardProps {
  onBackToDashboard: () => void;
  existingProject?: VideoProject | null;
}

export const VideoCreationWizard: React.FC<VideoCreationWizardProps> = ({
  onBackToDashboard,
  existingProject,
}) => {
  // Wizard Step (1: Config, 2: Script, 3: Audio, 4: Visuals, 5: Render, 6: SEO & Publish)
  const [currentStep, setCurrentStep] = useState<number>(existingProject?.renderStatus === 'ready' ? 6 : 1);

  // Configuration States
  const [mode, setMode] = useState<VideoMode>(existingProject?.mode || 'voice');
  const [topic, setTopic] = useState<string>(existingProject?.title || '');
  const [format, setFormat] = useState<VideoFormat>(existingProject?.format || 'shorts');
  const [durationSec, setDurationSec] = useState<VideoDurationSec>(existingProject?.durationSec || 30);
  const [language, setLanguage] = useState<VideoLanguage>(existingProject?.language || 'bn');
  const [style, setStyle] = useState<VideoStyle>(existingProject?.style || 'motivational');
  const [customInstructions, setCustomInstructions] = useState<string>(existingProject?.customInstructions || '');

  // Script States
  const [script, setScript] = useState<VideoScript | null>(existingProject?.script || null);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptProviderUsed, setScriptProviderUsed] = useState<string>('');

  // Audio & Subtitle States
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(existingProject?.voiceGender || 'male');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(existingProject?.voiceSpeed || 1.0);
  const [bgMusicTrack, setBgMusicTrack] = useState<string>(existingProject?.bgMusicTrack || 'motivational');
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(existingProject?.bgMusicVolume ?? 0.22);
  const [voiceVolume, setVoiceVolume] = useState<number>(existingProject?.voiceVolume ?? 1.0);
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(existingProject?.subtitleFontSize || 28);
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(existingProject?.subtitleEnabled ?? true);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState<boolean>(false);

  // Render Video States
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderPhaseMessage, setRenderPhaseMessage] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(existingProject?.renderedVideoBlobUrl || null);
  const [renderedSizeMb, setRenderedSizeMb] = useState<number | null>(existingProject?.renderedVideoSizeMb || null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // SEO & Publication States
  const [metadataSEO, setMetadataSEO] = useState<VideoMetadataSEO | null>(existingProject?.metadataSEO || null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState<boolean>(false);
  const [seoProviderUsed, setSeoProviderUsed] = useState<string>('');
  const [showThumbnailModal, setShowThumbnailModal] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(existingProject?.thumbnailDataUrl || null);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  // Active Project Reference
  const [projectId, setProjectId] = useState<string>(existingProject?.id || `proj_${Date.now()}`);

  // Clean up any test voice speech on unmount
  useEffect(() => {
    return () => {
      stopSceneVoice();
    };
  }, []);

  // Step 1 -> Step 2: Generate Script
  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const generated = await generateSmartScript(
        topic.trim(),
        mode,
        language,
        format,
        durationSec,
        style,
        customInstructions.trim() || undefined
      );

      setScript(generated);
      setScriptProviderUsed(generated.providerName || generated.generatedByProvider);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Step 3: Test Voice Narration
  const handleTestVoiceSample = async () => {
    if (isPlayingTestVoice) {
      stopSceneVoice();
      setIsPlayingTestVoice(false);
      return;
    }

    const sampleText =
      script?.scenes[0]?.narrationText ||
      (language === 'bn'
        ? 'আসসালামু আলাইকুম, স্মার্ট হাব এআই স্টুডিওতে আপনাকে স্বাগতম।'
        : 'Welcome to Smart Hub AI Studio. Creating high quality video with automated voice.');

    setIsPlayingTestVoice(true);
    await playSceneVoice(
      sampleText,
      language,
      voiceGender,
      voiceSpeed,
      undefined,
      () => {
        setIsPlayingTestVoice(false);
      }
    );
  };

  // Step 5: Render Video to MP4
  const handleStartRender = async () => {
    if (!script) return;
    setIsRendering(true);
    setRenderProgress(0);
    setRenderPhaseMessage('ইঞ্জিন ইনিশিয়ালাইজেশন হচ্ছে...');

    try {
      const currentProject: VideoProject = {
        id: projectId,
        title: topic || script.topic,
        createdAt: existingProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
        mode,
        language,
        format,
        durationSec,
        style,
        customInstructions,
        script,
        voiceGender,
        voiceSpeed,
        bgMusicTrack,
        bgMusicVolume,
        voiceVolume,
        subtitleFontSize,
        subtitleEnabled,
        renderStatus: 'rendering',
        thumbnailDataUrl: currentThumbnail || undefined,
        metadataSEO: metadataSEO || undefined,
      };

      const result = await renderMultiAiVideoToBlob(
        currentProject,
        (progress: number, msg: string) => {
          setRenderProgress(progress);
          setRenderPhaseMessage(msg);
        }
      );

      setRenderedBlobUrl(result.url);
      setRenderedSizeMb(result.sizeMb);

      // Auto save project state
      const updatedProject: VideoProject = {
        ...currentProject,
        renderedVideoBlobUrl: result.url,
        renderedVideoSizeMb: result.sizeMb,
        renderStatus: 'ready',
      };
      saveVideoProject(updatedProject);

      // Move automatically to SEO & Publish step
      handleGenerateSEOAutomatic(result.url, result.sizeMb);
      setCurrentStep(6);
    } catch (err: any) {
      console.error('Video Render Failed:', err);
      setRenderPhaseMessage(`রেন্ডার ব্যর্থ: ${err?.message || 'অজানা সমস্যা'}`);
    } finally {
      setIsRendering(false);
    }
  };

  const handleGenerateSEOAutomatic = async (videoUrl?: string, sizeMb?: number) => {
    if (!script) return;
    setIsGeneratingSEO(true);
    try {
      const scriptText = script.scenes.map((s) => s.narrationText || s.onScreenText).join(' ');
      const seo = await generateSmartSEO(topic || script.topic, scriptText, language);
      setMetadataSEO(seo);
      setSeoProviderUsed(seo.generatedByProvider);

      // Save SEO to project storage
      const proj: VideoProject = {
        id: projectId,
        title: topic || script.topic,
        createdAt: existingProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
        mode,
        language,
        format,
        durationSec,
        style,
        customInstructions,
        script,
        voiceGender,
        voiceSpeed,
        bgMusicTrack,
        bgMusicVolume,
        voiceVolume,
        subtitleFontSize,
        subtitleEnabled,
        renderedVideoBlobUrl: videoUrl || renderedBlobUrl || undefined,
        renderedVideoSizeMb: sizeMb || renderedSizeMb || undefined,
        renderStatus: 'ready',
        thumbnailDataUrl: currentThumbnail || undefined,
        metadataSEO: seo,
      };
      saveVideoProject(proj);
    } catch (e) {
      console.error('SEO generation error:', e);
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const copyToClipboard = (text: string, badgeId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(badgeId);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  // Helper for scene edits
  const handleUpdateScene = (idx: number, patch: Partial<VideoScene>) => {
    if (!script) return;
    const updatedScenes = [...script.scenes];
    updatedScenes[idx] = { ...updatedScenes[idx], ...patch };
    setScript({ ...script, scenes: updatedScenes });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Video className="w-4 h-4" />
              </span>
              AI ভিডিও ক্রিয়েশন স্টুডিও
            </h1>
            <p className="text-[11px] text-slate-400">
              ধাপ {currentStep} / ৬ • {mode === 'voice' ? '🎙️ ভয়েস ভিডিও' : '🎬 ভয়েস-লেস কাইনেটিক'}
            </p>
          </div>
        </div>

        {/* Multi-step progress capsules */}
        <div className="hidden sm:flex items-center gap-1.5">
          {[
            { step: 1, label: 'কনফিগ' },
            { step: 2, label: 'স্ক্রিপ্ট' },
            { step: 3, label: 'অডিও' },
            { step: 4, label: 'ভিজ্যুয়াল' },
            { step: 5, label: 'রেন্ডার' },
            { step: 6, label: 'এসইও' },
          ].map((s) => (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < currentStep || (s.step === 2 && script)) {
                  setCurrentStep(s.step);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                currentStep === s.step
                  ? 'bg-indigo-600 text-white shadow-md'
                  : currentStep > s.step
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-slate-900 text-slate-500'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* ================= STEP 1: CONFIGURATION ================= */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">১. ভিডিওর বিষয় ও ফরম্যাট নির্বাচন</h2>
              <p className="text-xs text-slate-400 mt-1">
                বিষয় লিখুন এবং ভিডিও ধরন বেছে নিন। আমাদের মাল্টি-ইঞ্জিন এআই স্বয়ংক্রিয়ভাবে আকর্ষণীয় স্ক্রিপ্ট ও ভিজ্যুয়াল তৈরি করবে।
              </p>
            </div>

            {/* Mode Selector: Voice vs Voice-less */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                ভিডিও মোড (Video Mode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('voice')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                    mode === 'voice'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      ভয়েস ভিডিও (Voice Video)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                        জনপ্রিয়
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      ন্যাচারাল এআই ভয়েসওভার + সাবটাইটেল + সিনেমাটিক ব্যাকগ্রাউন্ড মিউজিক + দৃশ্য পরিবর্তন।
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('voiceless')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                    mode === 'voiceless'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      ভয়েস-লেস ভিডিও (Voice-less Video)
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        কাইনেটিক
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      কোনো ভয়েস ছাড়া বোল্ড কাইনেটিক টেক্সট কার্ড + অ্যাটেনশন গ্র্যাবিং ভিজ্যুয়াল + গভীর মিউজিক।
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Video Topic Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                ভিডিওর বিষয় বা টাইটেল (Topic or Title) *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: প্রতিদিন সকালে হাটার ১০টি গোপন স্বাস্থ্য উপকারিতা"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            {/* Format & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  ভিডিও সাইজ / ফরম্যাট
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('shorts')}
                    className={`py-3 px-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      format === 'shorts'
                        ? 'bg-red-950/40 border-red-500 text-white font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold">9:16 Shorts / Reels</span>
                    <span className="text-[10px] text-slate-400">টিকটক, শর্টস, রিলস</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('landscape')}
                    className={`py-3 px-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      format === 'landscape'
                        ? 'bg-blue-950/40 border-blue-500 text-white font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold">16:9 Landscape</span>
                    <span className="text-[10px] text-slate-400">ইউটিউব ও ফেসবুক ফিড</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  ভিডিওর দৈর্ঘ্য (Duration)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([15, 30, 60, 90, 120, 180] as VideoDurationSec[]).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSec(sec)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                        durationSec === sec
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec < 60 ? `${sec} সেকেন্ড` : `${sec / 60} মিনিট`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">ভাষা (Language)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('bn')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      language === 'bn'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    বাংলা (Bengali)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      language === 'en'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">ভিডিওর স্টাইল (Style)</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="motivational">মোটিভেশনাল / অনুপ্রেরণামূলক</option>
                  <option value="educational">শিক্ষণীয় ও তথ্যবহুল</option>
                  <option value="islamic">ইসলামিক / আধ্যাত্মিক</option>
                  <option value="tech">বিজ্ঞান ও প্রযুক্তি</option>
                  <option value="health">স্বাস্থ্য ও চিকিৎসা টিপস</option>
                  <option value="cinematic">সিনেমাটিক ও নাটকীয়</option>
                  <option value="documentary">ডকুমেন্টারি / ঐতিহাসিক</option>
                  <option value="realistic">বাস্তবধর্মী / লাইফস্টাইল</option>
                </select>
              </div>
            </div>

            {/* Custom Instructions (Optional) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                কাস্টম নির্দেশনা (ঐচ্ছিক প্রম্পট ইনস্ট্রাকশন)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={2}
                placeholder="যেমন: প্রথম ৩ সেকেন্ডে খুব জোরালো হুক রাখতে হবে, কোনো বিতর্কিত কথা বলা যাবে না..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Bottom Generate Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={!topic.trim() || isGeneratingScript}
                onClick={handleGenerateScript}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {isGeneratingScript ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    মাল্টি-এআই স্ক্রিপ্ট জেনারেট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    স্ক্রিপ্ট ও দৃশ্য তৈরি করুন
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SCRIPT & STORYBOARD ================= */}
        {currentStep === 2 && script && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">২. স্ক্রিপ্ট ও স্টোরিবোর্ড এডিটর</h2>
                <p className="text-xs text-slate-400 mt-1">
                  প্রতিটি দৃশ্যের সংলাপ, অন-স্ক্রিন কাইনেটিক টেক্সট ও ভিজ্যুয়াল প্রম্পট নিজের মত এডিট করতে পারবেন।
                </p>
              </div>

              {/* Provider Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center gap-1.5 text-xs text-indigo-300">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>ইঞ্জিন: {scriptProviderUsed || script.providerName}</span>
              </div>
            </div>

            {/* Hook Opening */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                ভিডিও হুক (প্রথম ৩ সেকেন্ডের আকর্ষণ)
              </label>
              <textarea
                value={script.hookOpening}
                onChange={(e) => setScript({ ...script, hookOpening: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Scenes List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  মোট দৃশ্য: {script.scenes.length} টি ({script.totalEstimatedSeconds} সেকেন্ড)
                </span>
                <button
                  type="button"
                  onClick={handleGenerateScript}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> পুনরায় স্ক্রিপ্ট জেনারেট
                </button>
              </div>

              {script.scenes.map((sc, idx) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-indigo-400">
                      দৃশ্য #{sc.sceneNumber} ({sc.durationSec} সেকেন্ড)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ক্যামেরা মোশন: {sc.cameraMotion} • ট্রানজিশন: {sc.transitionType}
                    </span>
                  </div>

                  {/* Narration Text (for voice mode) */}
                  {mode === 'voice' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        ভয়েসওভার টেক্সট (এআই দ্বারা বলা হবে)
                      </label>
                      <textarea
                        value={sc.narrationText}
                        onChange={(e) => handleUpdateScene(idx, { narrationText: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* On-screen Bold Text */}
                  <div>
                    <label className="text-[11px] font-semibold text-amber-400 mb-1 block">
                      অন-স্ক্রিন বোল্ড টেক্সট (ভিডিওতে বড় আকারে প্রদর্শিত হবে)
                    </label>
                    <input
                      type="text"
                      value={sc.onScreenText}
                      onChange={(e) => handleUpdateScene(idx, { onScreenText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Image Generation Prompt */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                      ভিজ্যুয়াল প্রম্পট (AI Visual Scene)
                    </label>
                    <input
                      type="text"
                      value={sc.imagePrompt}
                      onChange={(e) => handleUpdateScene(idx, { imagePrompt: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Closing & CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <label className="text-xs font-semibold text-slate-400 mb-1 block">উপসংহার (Closing)</label>
                <textarea
                  value={script.closingStatement}
                  onChange={(e) => setScript({ ...script, closingStatement: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <label className="text-xs font-semibold text-slate-400 mb-1 block">কল টু অ্যাকশন (CTA)</label>
                <textarea
                  value={script.callToAction}
                  onChange={(e) => setScript({ ...script, callToAction: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
              >
                পরবর্তী: অডিও ও সাউন্ড <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: AUDIO & SOUND ================= */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">৩. অডিও, ভয়েস ও মিউজিক সেটিংস</h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'voice'
                  ? 'এআই ভয়েসওভারের গতি, সাউন্ড ও কপিরাইট-ফ্রি ব্যাকগ্রাউন্ড মিউজিক নিয়ন্ত্রণ করুন।'
                  : 'ভয়েস-লেস ভিডিওর জন্য গভীর ব্যাকগ্রাউন্ড মিউজিক ট্র্যাক ও সাবটাইটেল স্টাইল নির্বাচন করুন।'}
              </p>
            </div>

            {/* Voice Options (Only for Voice mode) */}
            {mode === 'voice' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  এআই ভয়েসওভার কনফিগারেশন
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">ভয়েস জেন্ডার</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVoiceGender('male')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          voiceGender === 'male'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        পুরুষ কণ্ঠ (Male)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceGender('female')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          voiceGender === 'female'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        নারী কণ্ঠ (Female)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">
                      ভয়েস স্পিড: {voiceSpeed}x
                    </label>
                    <input
                      type="range"
                      min={0.8}
                      max={1.4}
                      step={0.1}
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0.8x (ধীর)</span>
                      <span>1.0x (স্বাভাবিক)</span>
                      <span>1.4x (দ্রুত)</span>
                    </div>
                  </div>
                </div>

                {/* Voice Test Sample Player */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-xs text-slate-400">ভয়েসের নমুনা শুনে দেখুন:</span>
                  <button
                    type="button"
                    onClick={handleTestVoiceSample}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      isPlayingTestVoice
                        ? 'bg-red-600 text-white'
                        : 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40'
                    }`}
                  >
                    {isPlayingTestVoice ? (
                      <>
                        <Square className="w-3.5 h-3.5" /> থামান
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> টেস্ট ভয়েস শুনুন
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Background Music Selector */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                কপিরাইট-ফ্রি ব্যাকগ্রাউন্ড মিউজিক (১০০% রয়্যালটি-ফ্রি সংশ্লেষণ)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'motivational', label: 'Motivational (অনুপ্রেরণাদায়ী)' },
                  { id: 'cinematic', label: 'Cinematic (সিনেমাটিক)' },
                  { id: 'spiritual', label: 'Spiritual (আধ্যাত্মিক)' },
                  { id: 'silence', label: 'কোনো মিউজিক নয়' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBgMusicTrack(m.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                      bgMusicTrack === m.id
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {bgMusicTrack !== 'silence' && (
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>মিউজিক ভলিউম</span>
                    <span className="font-mono">{Math.round(bgMusicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.5}
                    step={0.02}
                    value={bgMusicVolume}
                    onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Subtitles & Typography */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                সাবটাইটেল ও টেক্সট ডিসপ্লে
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">সাবটাইটেল ক্যাপসুল প্রদর্শন</span>
                  <span className="text-[11px] text-slate-400">ভিডিও স্ক্রিনে বোল্ড টেক্সট প্লেসমেন্ট</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubtitleEnabled(!subtitleEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    subtitleEnabled ? 'bg-amber-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subtitleEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
              >
                পরবর্তী: ভিজ্যুয়াল ও মোশন <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: VISUALS & ANIMATION ================= */}
        {currentStep === 4 && script && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">৪. ভিজ্যুয়াল দৃশ্য ও ক্যামেরা মোশন</h2>
              <p className="text-xs text-slate-400 mt-1">
                প্রতিটি দৃশ্যের জন্য সিনেমাটিক ক্যামেরা মোশন (কেন বার্নস এফেক্ট) ও ইমেজ জেনারেশন প্রম্পট কাস্টমাইজ করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {script.scenes.map((sc, idx) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      দৃশ্য #{sc.sceneNumber} • {sc.durationSec} সেকেন্ড
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {format === 'shorts' ? '9:16 Shorts' : '16:9 Landscape'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">ক্যামেরা মোশন এফেক্ট</label>
                      <select
                        value={sc.cameraMotion}
                        onChange={(e) =>
                          handleUpdateScene(idx, {
                            cameraMotion: e.target.value as VideoScene['cameraMotion'],
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="zoom_in">ধীর জুম ইন (Slow Zoom In)</option>
                        <option value="zoom_out">ধীর জুম আউট (Slow Zoom Out)</option>
                        <option value="pan_left">প্যান বামে (Pan Left)</option>
                        <option value="pan_right">প্যান ডানে (Pan Right)</option>
                        <option value="subtle_drift">সাবটল সিনেমাটিক ড্রিফট (Subtle Drift)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">দৃশ্য ট্রানজিশন</label>
                      <select
                        value={sc.transitionType}
                        onChange={(e) =>
                          handleUpdateScene(idx, {
                            transitionType: e.target.value as VideoScene['transitionType'],
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="dissolve">ক্রস ডিজলভ (Cross Dissolve)</option>
                        <option value="fade">ফেড টু ব্ল্যাক (Fade)</option>
                        <option value="zoom">জুম পুশ (Zoom)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                      ইমেজ ডেসক্রিপশন / এআই ভিজ্যুয়াল প্রম্পট
                    </label>
                    <input
                      type="text"
                      value={sc.imagePrompt}
                      onChange={(e) => handleUpdateScene(idx, { imagePrompt: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold transition shadow-lg shadow-red-600/20"
              >
                রেন্ডার স্ক্রিনে যান <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: RENDER VIDEO ================= */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-6 animate-fadeIn items-center text-center">
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-white">৫. এমপি৪ (MP4) ভিডিও রেন্ডার</h2>
              <p className="text-xs text-slate-400 mt-1">
                আপনার ব্রাউজারেই সরাসরি ক্যানভাস ফ্রেম এবং ওয়েব অডিও সিঙ্ক করে হাই-কোয়ালিটি MP4 এনকোড করা হবে। কোনো বহিরাগত সার্ভারের খরচ নেই।
              </p>
            </div>

            {/* Render Preview Frame */}
            <div className="w-full max-w-sm aspect-[9/16] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center p-3">
              <canvas
                ref={previewCanvasRef}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-lg"
                style={{ aspectRatio: format === 'shorts' ? '9/16' : '16/9' }}
              />

              {!isRendering && !renderedBlobUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-6">
                  <div className="p-4 rounded-3xl bg-indigo-600/20 text-indigo-400 mb-3">
                    <Video className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">ভিডিও প্রস্তুত</h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">
                    রেন্ডার শুরু করলে দৃশ্যভিত্তিক ক্যামেরা মোশন ও অডিও সিন্থেসিস আরম্ভ হবে।
                  </p>
                  <button
                    type="button"
                    onClick={handleStartRender}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold shadow-xl shadow-indigo-500/30 transition"
                  >
                    <Play className="w-4 h-4" /> এখনই রেন্ডার শুরু করুন
                  </button>
                </div>
              )}

              {isRendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 p-6 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
                  <div className="text-lg font-bold text-white mb-1">{renderProgress}%</div>
                  <p className="text-xs text-indigo-300 font-medium mb-3">{renderPhaseMessage}</p>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden max-w-xs">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* If Rendered Successfully */}
            {renderedBlobUrl && !isRendering && (
              <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" /> ভিডিও সফলভাবে রেন্ডার সম্পন্ন! ({renderedSizeMb} MB)
                </div>

                <div className="flex items-center gap-3 w-full">
                  <a
                    href={renderedBlobUrl}
                    download={`smarthub_${topic.slice(0, 20).replace(/\s+/g, '_')}_${format}.mp4`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-md"
                  >
                    <Download className="w-4 h-4" /> MP4 ডাউনলোড করুন
                  </a>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                  >
                    পরবর্তী: এসইও ও পাবলিশ <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            {!isRendering && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition"
              >
                ← পূর্ববর্তী ধাপে ফিরে যান
              </button>
            )}
          </div>
        )}

        {/* ================= STEP 6: SEO & DIRECT PUBLISH ================= */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">৬. এআই এসইও ও সরাসরি সোশ্যাল পাবলিশ</h2>
                <p className="text-xs text-slate-400 mt-1">
                  YouTube এবং Facebook এর জন্য ভাইরাল টাইটেল, ডেসক্রিপশন, ট্যাগ এবং থাম্বনেইল প্রস্তুত।
                </p>
              </div>

              {metadataSEO && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center gap-1.5 text-xs text-emerald-300">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>এসইও ইঞ্জিন: {seoProviderUsed}</span>
                </div>
              )}
            </div>

            {/* Action Bar: Thumbnail Generator & Social Publish */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowThumbnailModal(true)}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/40 hover:border-amber-500 transition text-left flex items-center gap-3 shadow-lg group"
              >
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI থাম্বনেইল তৈরি করুন</h4>
                  <p className="text-[11px] text-slate-400">বোল্ড ক্যাচি টাইটেল ও ব্যাজ সহ হাই-কনভার্সন থাম্বনেইল</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40 hover:border-indigo-500 transition text-left flex items-center gap-3 shadow-lg group"
              >
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-105 transition">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">সরাসরি পাবলিশ করুন</h4>
                  <p className="text-[11px] text-slate-400">YouTube চ্যানেল ও Facebook পেজে এক ক্লিকে আপলোড</p>
                </div>
              </button>
            </div>

            {/* Generated SEO Metadata Display */}
            {metadataSEO ? (
              <div className="flex flex-col gap-4">
                {/* YouTube SEO Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-2">
                      YouTube অপটিমাইজড মেটাডেটা
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGenerateSEOAutomatic()}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> পুনরায় তৈরি
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>এসইও টাইটেল</span>
                      <button
                        onClick={() => copyToClipboard(metadataSEO.youtube.title, 'yt-title')}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {copiedBadge === 'yt-title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        কপি
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium">
                      {metadataSEO.youtube.title}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>ডেসক্রিপশন</span>
                      <button
                        onClick={() => copyToClipboard(metadataSEO.youtube.description, 'yt-desc')}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {copiedBadge === 'yt-desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        কপি
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans max-h-28 overflow-y-auto whitespace-pre-line">
                      {metadataSEO.youtube.description}
                    </div>
                  </div>

                  {/* Hashtags & Tags */}
                  <div>
                    <span className="text-xs text-slate-400 mb-1.5 block">হ্যাশট্যাগ ও কিওয়ার্ড</span>
                    <div className="flex flex-wrap gap-1.5">
                      {metadataSEO.youtube.hashtags.map((ht, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-red-950/30 text-red-300 border border-red-800/30 text-[11px] font-mono"
                        >
                          {ht}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Facebook SEO Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      Facebook Reels & Post ক্যাপশন
                    </span>
                    <button
                      onClick={() => copyToClipboard(metadataSEO.facebook.caption, 'fb-cap')}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedBadge === 'fb-cap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      কপি
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans whitespace-pre-line">
                    {metadataSEO.facebook.caption}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">এসইও মেটাডেটা তৈরি করুন</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  আমাদের স্মার্ট এআই রাউটার আপনার স্ক্রিপ্ট বিশ্লেষণ করে ভাইরাল টাইটেল ও হ্যাশট্যাগ তৈরি করবে।
                </p>
                <button
                  type="button"
                  disabled={isGeneratingSEO}
                  onClick={() => handleGenerateSEOAutomatic()}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
                >
                  {isGeneratingSEO ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  মেটাডেটা জেনারেট করুন
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  // Reset form for new video
                  setTopic('');
                  setScript(null);
                  setRenderedBlobUrl(null);
                  setMetadataSEO(null);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <RefreshCw className="w-4 h-4" /> নতুন ভিডিও তৈরি করুন
              </button>

              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md"
              >
                ড্যাশবোর্ডে ফিরে যান <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Generator Modal */}
      <ThumbnailGeneratorModal
        isOpen={showThumbnailModal}
        onClose={() => setShowThumbnailModal(false)}
        topic={topic || script?.topic || ''}
        style={style}
        format={format}
        onSelectThumbnail={(dataUrl) => {
          setCurrentThumbnail(dataUrl);
          // Persist to project
          if (script) {
            const proj: VideoProject = {
              id: projectId,
              title: topic || script.topic,
              createdAt: existingProject?.createdAt || Date.now(),
              updatedAt: Date.now(),
              mode,
              language,
              format,
              durationSec,
              style,
              customInstructions,
              script,
              voiceGender,
              voiceSpeed,
              bgMusicTrack,
              bgMusicVolume,
              voiceVolume,
              subtitleFontSize,
              subtitleEnabled,
              renderedVideoBlobUrl: renderedBlobUrl || undefined,
              renderedVideoSizeMb: renderedSizeMb || undefined,
              renderStatus: renderedBlobUrl ? 'ready' : 'draft',
              thumbnailDataUrl: dataUrl,
              metadataSEO: metadataSEO || undefined,
            };
            saveVideoProject(proj);
          }
        }}
      />

      {/* Social Publishing Modal */}
      {script && (
        <PublishingModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          project={{
            id: projectId,
            title: topic || script.topic,
            createdAt: existingProject?.createdAt || Date.now(),
            updatedAt: Date.now(),
            mode,
            language,
            format,
            durationSec,
            style,
            customInstructions,
            script,
            voiceGender,
            voiceSpeed,
            bgMusicTrack,
            bgMusicVolume,
            voiceVolume,
            subtitleFontSize,
            subtitleEnabled,
            renderedVideoBlobUrl: renderedBlobUrl || undefined,
            renderedVideoSizeMb: renderedSizeMb || undefined,
            renderStatus: renderedBlobUrl ? 'ready' : 'draft',
            thumbnailDataUrl: currentThumbnail || undefined,
            metadataSEO: metadataSEO || undefined,
          }}
        />
      )}
    </div>
  );
};
