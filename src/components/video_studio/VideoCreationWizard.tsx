import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share2,
  Image as ImageIcon,
  Check,
  Edit3,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Film,
  Eye,
  Type,
  Music,
} from 'lucide-react';
import {
  VideoProject,
  VideoFormat,
  VideoDurationSec,
  VideoLanguage,
  VideoStyle,
  VideoScript,
  VideoScene,
} from '../../types/videoStudio';
import {
  generateAiVideoScript,
  generateAiVideoSEO,
  playSceneVoicePreview,
  stopVoicePlayback,
  renderVideoToBlob,
  generateProceduralSceneVisual,
} from '../../utils/aiVideoEngine';
import { saveVideoProject } from '../../utils/videoStudioStorage';
import { ThumbnailGeneratorModal } from './ThumbnailGeneratorModal';
import { PublishingModal } from './PublishingModal';

interface Props {
  lang: 'bn' | 'en';
  onBackToDashboard: () => void;
  onProjectSaved?: (project: VideoProject) => void;
  initialProject?: VideoProject | null;
}

export const VideoCreationWizard: React.FC<Props> = ({
  lang,
  onBackToDashboard,
  onProjectSaved,
  initialProject,
}) => {
  const isBn = lang === 'bn';

  // Wizard Steps:
  // 1 = Topic & Config
  // 2 = Script Review & Edit
  // 3 = Voice & Audio Settings
  // 4 = Visuals & Scene Animation
  // 5 = Render & Export MP4
  // 6 = SEO Metadata & Thumbnail
  // 7 = Direct Publish & Download
  const [currentStep, setCurrentStep] = useState<number>(initialProject ? 2 : 1);

  // Form State
  const [topic, setTopic] = useState<string>(initialProject?.title || '');
  const [format, setFormat] = useState<VideoFormat>(initialProject?.format || 'shorts');
  const [duration, setDuration] = useState<VideoDurationSec>(initialProject?.durationSec || 60);
  const [videoLang, setVideoLang] = useState<VideoLanguage>(initialProject?.language || 'bn');
  const [style, setStyle] = useState<VideoStyle>(initialProject?.style || 'motivational');
  const [customInstructions, setCustomInstructions] = useState<string>(initialProject?.customInstructions || '');

  // Script State
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [script, setScript] = useState<VideoScript | null>(initialProject?.script || null);
  const [activeEditingSceneIdx, setActiveEditingSceneIdx] = useState<number | null>(null);

  // Voice & Audio State
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(initialProject?.voiceGender || 'male');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(initialProject?.voiceSpeed || 1.0);
  const [bgMusicTrack, setBgMusicTrack] = useState<string>(initialProject?.bgMusicTrack || 'cinematic');
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(initialProject?.bgMusicVolume ?? 0.35);
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(initialProject?.subtitleEnabled ?? true);
  const [previewingVoiceIdx, setPreviewingVoiceIdx] = useState<number | null>(null);

  // Rendering State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStage, setRenderStage] = useState<string>('');
  const [renderedBlob, setRenderBlob] = useState<Blob | null>(null);
  const [renderedBlobUrl, setRenderBlobUrl] = useState<string | null>(initialProject?.renderedVideoBlobUrl || null);
  const [renderedSizeMb, setRenderedSizeMb] = useState<number>(initialProject?.renderedVideoSizeMb || 0);

  // SEO & Thumbnail
  const [isGeneratingSEO, setIsGeneratingSEO] = useState<boolean>(false);
  const [metadataSEO, setMetadataSEO] = useState<any>(initialProject?.metadataSEO || null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(initialProject?.thumbnailDataUrl || null);
  const [showThumbnailModal, setShowThumbnailModal] = useState<boolean>(false);
  const [showPublishingModal, setShowPublishingModal] = useState<boolean>(false);

  // ----------------------------------------------------
  // Step 1 -> 2: Generate Script
  // ----------------------------------------------------
  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const genScript = await generateAiVideoScript(
        topic.trim(),
        videoLang,
        format,
        duration,
        style,
        customInstructions
      );
      setScript(genScript);
      setCurrentStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // ----------------------------------------------------
  // Voice Preview Handler
  // ----------------------------------------------------
  const handlePreviewVoice = (sceneIdx: number) => {
    if (!script) return;
    if (previewingVoiceIdx === sceneIdx) {
      stopVoicePlayback();
      setPreviewingVoiceIdx(null);
      return;
    }
    const scene = script.scenes[sceneIdx];
    setPreviewingVoiceIdx(sceneIdx);
    playSceneVoicePreview(scene.narrationText, videoLang, voiceGender, voiceSpeed, () => {
      setPreviewingVoiceIdx(null);
    });
  };

  // ----------------------------------------------------
  // Step 4 -> 5: Video Rendering to Real MP4
  // ----------------------------------------------------
  const handleStartRender = async () => {
    if (!script) return;
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStage(isBn ? 'রেন্ডারিং শুরু হচ্ছে...' : 'Starting render...');

    try {
      const currentProject: VideoProject = {
        id: initialProject?.id || `proj-${Date.now()}`,
        title: topic,
        createdAt: initialProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
        language: videoLang,
        format,
        durationSec: duration,
        style,
        customInstructions,
        script,
        voiceGender,
        voiceSpeed,
        bgMusicTrack,
        bgMusicVolume,
        voiceVolume: 1.0,
        subtitleFontSize: format === 'shorts' ? 28 : 32,
        subtitleEnabled,
        renderStatus: 'rendering',
      };

      const result = await renderVideoToBlob(currentProject, (pct, stg) => {
        setRenderProgress(pct);
        setRenderStage(stg);
      });

      setRenderBlob(result.blob);
      setRenderBlobUrl(result.url);
      setRenderedSizeMb(result.sizeMb);

      currentProject.renderedVideoBlobUrl = result.url;
      currentProject.renderedVideoSizeMb = result.sizeMb;
      currentProject.renderStatus = 'ready';

      saveVideoProject(currentProject);
      onProjectSaved?.(currentProject);

      // Automatically generate SEO in background
      generateAiVideoSEO(topic, script.scenes.map((s) => s.narrationText).join(' '), videoLang).then((seo) => {
        setMetadataSEO(seo);
        currentProject.metadataSEO = seo;
        saveVideoProject(currentProject);
      });

      setCurrentStep(5);
    } catch (err: any) {
      alert((isBn ? 'ভিডিও রেন্ডারিং ব্যর্থ হয়েছে: ' : 'Render failed: ') + err.message);
    } finally {
      setIsRendering(false);
    }
  };

  // Save Video to Device Download
  const handleDownloadVideo = () => {
    if (!renderedBlobUrl) return;
    const a = document.createElement('a');
    a.href = renderedBlobUrl;
    a.download = `${topic.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_')}_${format}.mp4`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full select-none pb-12 animate-fade-in text-white">
      {/* Top Header & Breadcrumb Nav */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <button
          onClick={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else onBackToDashboard();
          }}
          className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'পেছনে' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
          <span className="text-[#69DCC0]">STEP {currentStep}/6:</span>
          <span>
            {currentStep === 1
              ? (isBn ? 'ভিডিও কনফিগ' : 'Setup')
              : currentStep === 2
              ? (isBn ? 'স্ক্রিপ্ট ও দৃশ্য' : 'Script')
              : currentStep === 3
              ? (isBn ? 'ভয়েস ও অডিও' : 'Voice')
              : currentStep === 4
              ? (isBn ? 'ভিজ্যুয়াল অ্যানিমেশন' : 'Visuals')
              : currentStep === 5
              ? (isBn ? 'রেন্ডার ও এমপি৪' : 'MP4')
              : (isBn ? 'এসইও ও পাবলিশ' : 'Publish')}
          </span>
        </div>

        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-400 hover:text-white font-bold"
        >
          ✕
        </button>
      </div>

      {/* =========================================================
          STEP 1: TOPIC & CONFIGURATION
          ========================================================= */}
      {currentStep === 1 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0B63F6] to-purple-600 flex items-center justify-center text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {isBn ? 'নতুন এআই ভিডিও কনফিগারেশন' : 'New AI Video Setup'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'বিষয় ও স্টাইল দিয়ে প্রফেশনাল ভিডিও তৈরি শুরু করুন' : 'Enter topic and format parameters'}
              </p>
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isBn ? 'ভিডিওর বিষয় বা শিরোনাম (Topic / Title):' : 'Video Topic / Title:'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isBn ? 'যেমন: রমজানের স্বাস্থ্যকর অভ্যাস, মহাবিশ্বের রহস্য, সফলতার ৫টি নিয়ম...' : 'e.g. 5 Rules of Success, Mind-blowing Space Facts...'}
              className="w-full p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white font-bold text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B63F6]"
            />
          </div>

          {/* Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isBn ? 'ভিডিও ফরম্যাট (Aspect Ratio):' : 'Video Format:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('shorts')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                  format === 'shorts'
                    ? 'bg-blue-600/20 border-[#0B63F6] text-white ring-1 ring-[#0B63F6]'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-2xl">📱</span>
                <div>
                  <span className="font-bold text-xs block text-white">YouTube Shorts / Reels</span>
                  <span className="text-[10px] text-slate-400 block">Vertical 9:16 (720x1280)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('landscape')}
                className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                  format === 'landscape'
                    ? 'bg-blue-600/20 border-[#0B63F6] text-white ring-1 ring-[#0B63F6]'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span className="text-2xl">🖥️</span>
                <div>
                  <span className="font-bold text-xs block text-white">YouTube Landscape</span>
                  <span className="text-[10px] text-slate-400 block">Widescreen 16:9 (1280x720)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Language & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {isBn ? 'ভাষা (Language):' : 'Language:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVideoLang('bn')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    videoLang === 'bn'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  🇧🇩 বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setVideoLang('en')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    videoLang === 'en'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {isBn ? 'স্থায়িত্ব (Duration):' : 'Duration:'}
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) as VideoDurationSec)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs"
              >
                <option value={15}>15 Seconds (Quick Hook)</option>
                <option value={30}>30 Seconds (Fast Reel)</option>
                <option value={60}>60 Seconds (Full Short)</option>
                <option value={90}>90 Seconds (Deep Short)</option>
                <option value={120}>2 Minutes (Mini Story)</option>
                <option value={180}>3 Minutes (Video Guide)</option>
              </select>
            </div>
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isBn ? 'ভিডিও স্টাইল (Video Style):' : 'Video Style:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'motivational', labelBn: 'অনুপ্রেরণামূলক', labelEn: 'Motivational', icon: '🔥' },
                { id: 'islamic', labelBn: 'ইসলামিক', labelEn: 'Islamic', icon: '🕌' },
                { id: 'tech', labelBn: 'বিজ্ঞান ও প্রযুক্তি', labelEn: 'Tech & Science', icon: '⚡' },
                { id: 'cinematic', labelBn: 'সিনেমাটিক', labelEn: 'Cinematic', icon: '🎬' },
                { id: 'health', labelBn: 'স্বাস্থ্য ও ফিটনেস', labelEn: 'Health & Care', icon: '❤️' },
                { id: 'educational', labelBn: 'শিক্ষামূলক', labelEn: 'Educational', icon: '📚' },
                { id: 'documentary', labelBn: 'তথ্যচিত্র', labelEn: 'Documentary', icon: '📜' },
                { id: 'realistic', labelBn: 'বাস্তবসম্মত', labelEn: 'Realistic', icon: '🌍' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStyle(st.id as VideoStyle)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    style === st.id
                      ? 'bg-purple-600/25 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-base">{st.icon}</span>
                  <span className="text-[11px] font-bold truncate max-w-full">
                    {isBn ? st.labelBn : st.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {isBn ? 'বিশেষ নির্দেশনা (Custom Director Instructions):' : 'Director Instructions:'}
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={isBn ? 'যেমন: শুরুতে রহস্যময় প্রশ্ন রাখুন, শেষের দিকে জোরালো বার্তা দিন...' : 'e.g. dramatic tone, start with bold question...'}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateScript}
            disabled={!topic.trim() || isGeneratingScript}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0B63F6] via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-xl shadow-purple-500/25 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingScript ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingScript
                ? (isBn ? 'এআই স্ক্রিপ্ট ও দৃশ্য তৈরি হচ্ছে...' : 'Generating Script & Scenes...')
                : (isBn ? 'এআই স্ক্রিপ্ট তৈরি করুন' : 'Generate AI Script')}
            </span>
          </button>
        </div>
      )}

      {/* =========================================================
          STEP 2: SCRIPT REVIEW & SCENE BY SCENE EDITING
          ========================================================= */}
      {currentStep === 2 && script && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {isBn ? 'স্ক্রিপ্ট ও দৃশ্য পর্যালোচনা' : 'Script & Scenes Review'}
                </h3>
                <p className="text-xs text-slate-400">
                  {script.scenes.length} {isBn ? 'টি দৃশ্য • মোট স্থায়িত্ব:' : 'scenes • Total:'} {duration}s
                </p>
              </div>
            </div>
          </div>

          {/* Hook Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1 text-amber-300">
              ⚡ {isBn ? 'প্রথম ৩-সেকেন্ডের হুক (Opening Hook):' : 'Opening 3s Hook:'}
            </span>
            <input
              type="text"
              value={script.hookOpening}
              onChange={(e) => setScript({ ...script, hookOpening: e.target.value })}
              className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
            />
          </div>

          {/* Scenes List */}
          <div className="space-y-3">
            {script.scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#69DCC0] flex items-center gap-1.5">
                    <span>🎬 {isBn ? `দৃশ্য ${scene.sceneNumber}` : `Scene ${scene.sceneNumber}`}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({scene.durationSec}s)</span>
                  </span>

                  <button
                    onClick={() => handlePreviewVoice(idx)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition ${
                      previewingVoiceIdx === idx
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{previewingVoiceIdx === idx ? (isBn ? 'বন্ধ' : 'Stop') : (isBn ? 'ভয়েস শুনুন' : 'Listen')}</span>
                  </button>
                </div>

                {/* Narration input */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    {isBn ? 'ভয়েস ন্যারেশন স্ক্রিপ্ট:' : 'Narration Script:'}
                  </label>
                  <textarea
                    rows={2}
                    value={scene.narrationText}
                    onChange={(e) => {
                      const updated = [...script.scenes];
                      updated[idx].narrationText = e.target.value;
                      setScript({ ...script, scenes: updated });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed"
                  />
                </div>

                {/* Visual description prompt */}
                <div className="text-[11px] text-slate-400 flex items-start gap-1.5 bg-slate-900/60 p-2 rounded-xl">
                  <span className="text-purple-400 font-bold shrink-0">🎨 Prompt:</span>
                  <span className="line-clamp-2">{scene.imagePrompt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
            >
              <span>{isBn ? 'ভয়েস ও অডিও নির্ধারণ করুন' : 'Configure Voice & Audio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 3: VOICE & AUDIO SETTINGS
          ========================================================= */}
      {currentStep === 3 && script && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {isBn ? 'এআই ভয়েস ও ব্যাকগ্রাউন্ড মিউজিক' : 'AI Voice & Background Music'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'বাংলা ও ইংলিশ ভয়েস এবং কপিরাইট-মুক্ত সুর' : 'Bilingual voice narration & royalty-free audio'}
              </p>
            </div>
          </div>

          {/* Voice Gender */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isBn ? 'ভয়েস ধরণ (Voice Gender):' : 'Voice Gender:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVoiceGender('male')}
                className={`py-3 rounded-2xl border text-center font-bold text-xs transition ${
                  voiceGender === 'male'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                👨 {isBn ? 'পুরুষ কণ্ঠ (Male Voice)' : 'Male Voice'}
              </button>

              <button
                type="button"
                onClick={() => setVoiceGender('female')}
                className={`py-3 rounded-2xl border text-center font-bold text-xs transition ${
                  voiceGender === 'female'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                👩 {isBn ? 'নারী কণ্ঠ (Female Voice)' : 'Female Voice'}
              </button>
            </div>
          </div>

          {/* Voice Speed Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-300">{isBn ? 'কথা বলার গতি (Speed):' : 'Speech Speed:'}</span>
              <span className="font-mono text-[#69DCC0]">{voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#69DCC0] cursor-pointer"
            />
          </div>

          {/* Background Music Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'কপিরাইট-মুক্ত ব্যাকগ্রাউন্ড মিউজিক:' : 'Royalty-Free Background Music:'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cinematic', nameBn: 'সিনেমাটিক অ্যাম্বিয়েন্ট', nameEn: 'Cinematic Ambient', icon: '🌌' },
                { id: 'spiritual', nameBn: 'আধ্যাত্মিক / শান্ত সুর', nameEn: 'Spiritual Calm', icon: '🕊️' },
                { id: 'motivational', nameBn: 'উদ্যমী বিট', nameEn: 'Motivational', icon: '⚡' },
                { id: 'silence', nameBn: 'মিউজিক ছাড়া (শুধু ভয়েস)', nameEn: 'No Music (Muted)', icon: '🔇' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBgMusicTrack(m.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    bgMusicTrack === m.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[11px] font-bold truncate max-w-full">
                    {isBn ? m.nameBn : m.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Music Volume Slider */}
          {bgMusicTrack !== 'silence' && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-300">{isBn ? 'মিউজিক ভলিউম:' : 'Music Volume:'}</span>
                <span className="font-mono text-emerald-400">{Math.round(bgMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          )}

          {/* Subtitles Toggle */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#69DCC0]" />
              <div>
                <span className="font-bold text-xs block">{isBn ? 'স্বয়ংক্রিয় সাবটাইটেল' : 'Auto Subtitles'}</span>
                <span className="text-[10px] text-slate-400 block">{isBn ? 'ভিডিওতে সরাসরি টেক্সট ভেসে উঠবে' : 'Render synchronized text on video'}</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={subtitleEnabled}
              onChange={(e) => setSubtitleEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#69DCC0] rounded cursor-pointer"
            />
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentStep(4)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
          >
            <span>{isBn ? 'ভিজ্যুয়াল অ্যানিমেশনে এগিয়ে যান' : 'Proceed to Visual Scenes'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================
          STEP 4: VISUALS & SCENE ANIMATION SETTINGS
          ========================================================= */}
      {currentStep === 4 && script && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {isBn ? 'ভিজ্যুয়াল দৃশ্য ও ক্যামেরা মোশন' : 'Visuals & Camera Motion'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'কেন বার্নস ক্যামেরা জুম ও ট্রানজিশন ইফেক্ট' : 'Ken Burns zoom, pan & cinematic transitions'}
                </p>
              </div>
            </div>
          </div>

          {/* Scenes Motion Grid */}
          <div className="space-y-3">
            {script.scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    {isBn ? `দৃশ্য ${scene.sceneNumber}:` : `Scene ${scene.sceneNumber}:`}
                  </span>

                  {/* Motion Selector */}
                  <select
                    value={scene.cameraMotion}
                    onChange={(e) => {
                      const updated = [...script.scenes];
                      updated[idx].cameraMotion = e.target.value as any;
                      setScript({ ...script, scenes: updated });
                    }}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] font-bold"
                  >
                    <option value="zoom_in">🔍 Zoom In (জুম ইন)</option>
                    <option value="zoom_out">🔎 Zoom Out (জুম আউট)</option>
                    <option value="pan_left">⬅️ Pan Left (বামে প্যান)</option>
                    <option value="pan_right">➡️ Pan Right (ডানে প্যান)</option>
                    <option value="subtle_drift">🌊 Subtle Drift (স্মুথ ড্রিফট)</option>
                  </select>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1 italic">
                  "{scene.narrationText}"
                </p>
              </div>
            ))}
          </div>

          {/* Render Action Button */}
          <button
            onClick={handleStartRender}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-xl shadow-purple-500/25"
          >
            <Film className="w-4 h-4" />
            <span>{isBn ? 'ভিডিও রেন্ডার করুন (Create MP4)' : 'Render Video (Export MP4)'}</span>
          </button>
        </div>
      )}

      {/* =========================================================
          STEP 5: RENDER PROGRESS OR READY MP4 PREVIEW
          ========================================================= */}
      {currentStep === 5 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {isRendering
                    ? (isBn ? 'ভিডিও তৈরি হচ্ছে...' : 'Rendering MP4...')
                    : (isBn ? 'ভিডিও প্রস্তুত সম্পন্ন!' : 'Video Ready!')}
                </h3>
                <p className="text-xs text-slate-400">
                  {format === 'shorts' ? '9:16 Vertical Video' : '16:9 Landscape Video'} • {duration}s
                </p>
              </div>
            </div>
          </div>

          {/* Render Progress Bar */}
          {isRendering ? (
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-[#69DCC0] border-t-transparent animate-spin mx-auto" />
              <span className="text-sm font-bold text-white block">{renderStage}</span>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">{renderProgress}% Complete</span>
            </div>
          ) : (
            /* Rendered Video Player */
            renderedBlobUrl && (
              <div className="space-y-4">
                <div className="flex justify-center bg-black/60 p-2 sm:p-4 rounded-2xl border border-slate-800">
                  <video
                    src={renderedBlobUrl}
                    controls
                    playsInline
                    className={`rounded-xl shadow-2xl border border-slate-700 ${
                      format === 'shorts' ? 'max-h-96 w-auto aspect-[9/16]' : 'w-full max-h-64 aspect-[16/9]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-800/60 text-slate-300">
                  <span>{isBn ? 'ভিডিও সাইজ:' : 'File Size:'} <strong className="text-emerald-400">{renderedSizeMb} MB</strong></span>
                  <span>{isBn ? 'ফরম্যাট:' : 'Format:'} <strong className="text-white">MP4 / WebM</strong></span>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadVideo}
                    className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95 shadow-md"
                  >
                    <Download className="w-4 h-4 text-[#69DCC0]" />
                    <span>{isBn ? 'ফোনে সেভ করুন (MP4)' : 'Save to Phone (MP4)'}</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep(6)}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-[#0B63F6] to-purple-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-blue-500/25"
                  >
                    <span>{isBn ? 'এসইও ও পাবলিশিং' : 'SEO & Publishing'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* =========================================================
          STEP 6: SEO METADATA & THUMBNAIL
          ========================================================= */}
      {currentStep === 6 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {isBn ? 'এআই এসইও ও সোশ্যাল পাবলিশ' : 'AI SEO & Social Publishing'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'ইউটিউব ও ফেসবুকের জন্য স্বয়ংক্রিয় টাইটেল ও ট্যাগ' : 'Optimized metadata for high click-through-rate'}
                </p>
              </div>
            </div>
          </div>

          {/* Thumbnail Generator Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/20 to-purple-950/20 border border-rose-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {thumbnailDataUrl ? (
                <img
                  src={thumbnailDataUrl}
                  alt="Thumbnail"
                  className="w-16 h-16 rounded-xl object-cover border border-rose-500 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 shrink-0 border border-slate-700">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="font-bold text-xs sm:text-sm text-white block">
                  {isBn ? 'এআই থাম্বনেইল প্রস্তুতকারী' : 'AI Thumbnail Studio'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {thumbnailDataUrl ? (isBn ? 'থাম্বনেইল যুক্ত করা হয়েছে ✓' : 'Thumbnail applied ✓') : (isBn ? 'বোল্ড টেক্সট ও গ্রাফিক্স দিয়ে থাম্বনেইল বানান' : 'Create high-CTR cover art')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowThumbnailModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shrink-0 active:scale-95 transition shadow-sm"
            >
              {thumbnailDataUrl ? (isBn ? 'পুনরায় বানান' : 'Edit') : (isBn ? 'তৈরি করুন' : 'Generate')}
            </button>
          </div>

          {/* YouTube SEO Preview */}
          {metadataSEO?.youtube && (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2 text-xs">
              <span className="font-bold text-red-400 flex items-center gap-1.5">
                <span>▶</span>
                <span>YouTube SEO Title:</span>
              </span>
              <input
                type="text"
                value={metadataSEO.youtube.title}
                onChange={(e) => {
                  setMetadataSEO({
                    ...metadataSEO,
                    youtube: { ...metadataSEO.youtube, title: e.target.value },
                  });
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              />

              <span className="font-bold text-red-400 block mt-2">Tags & Keywords:</span>
              <div className="flex flex-wrap gap-1.5">
                {metadataSEO.youtube.tags?.map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 text-[10px] font-bold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Facebook Reel Caption Preview */}
          {metadataSEO?.facebook && (
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2 text-xs">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <span>f</span>
                <span>Facebook Reel Caption:</span>
              </span>
              <textarea
                rows={2}
                value={metadataSEO.facebook.caption}
                onChange={(e) => {
                  setMetadataSEO({
                    ...metadataSEO,
                    facebook: { ...metadataSEO.facebook, caption: e.target.value },
                  });
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>
          )}

          {/* Direct Publish & Finish Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadVideo}
              className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95 shadow-md"
            >
              <Download className="w-4 h-4 text-[#69DCC0]" />
              <span>{isBn ? 'শুধু ফোনে সেভ করুন' : 'Save to Device'}</span>
            </button>

            <button
              onClick={() => setShowPublishingModal(true)}
              className="py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-blue-600 to-emerald-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-500/25"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isBn ? 'সরাসরি আপলোড করুন' : 'Publish Video'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Generator Modal */}
      {showThumbnailModal && (
        <ThumbnailGeneratorModal
          isOpen={showThumbnailModal}
          onClose={() => setShowThumbnailModal(false)}
          topic={topic}
          suggestedText={metadataSEO?.youtube?.thumbnailText}
          format={format}
          language={videoLang}
          onSaveThumbnail={(url) => setThumbnailDataUrl(url)}
        />
      )}

      {/* Direct Publishing Modal */}
      {showPublishingModal && renderedBlob && (
        <PublishingModal
          isOpen={showPublishingModal}
          onClose={() => setShowPublishingModal(false)}
          project={{
            id: initialProject?.id || `proj-${Date.now()}`,
            title: topic,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            language: videoLang,
            format,
            durationSec: duration,
            style,
            script: script!,
            voiceGender,
            voiceSpeed,
            bgMusicTrack,
            bgMusicVolume,
            voiceVolume: 1.0,
            subtitleFontSize: 28,
            subtitleEnabled,
            metadataSEO,
            thumbnailDataUrl: thumbnailDataUrl || undefined,
            renderedVideoSizeMb: renderedSizeMb,
            renderStatus: 'ready',
          }}
          videoBlob={renderedBlob}
          lang={lang}
          onPublishedSuccess={() => {
            setShowPublishingModal(false);
          }}
        />
      )}
    </div>
  );
};
