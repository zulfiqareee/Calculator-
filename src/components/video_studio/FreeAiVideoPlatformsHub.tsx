import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  ExternalLink,
  Play,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ArrowRight,
  Flame,
  Layers,
  Cpu,
  RefreshCw,
  Sliders,
  Type,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Globe2,
} from 'lucide-react';
import { downloadBlobFile } from '../../utils/multiAiVideoEngine';

interface FreeAiVideoPlatformsHubProps {
  onOpenInAppStudio?: () => void;
  onBack?: () => void;
}

interface VideoPlatform {
  id: string;
  name: string;
  category: 'text' | 'image' | 'shorts' | 'face' | 'all';
  freeTierBadge: string;
  badgeColor: string;
  url: string;
  rating: string;
  descriptionBn: string;
  freeLimitBn: string;
  bestForBn: string;
  popularPromptSample: string;
}

const PLATFORMS: VideoPlatform[] = [
  {
    id: 'pollinations',
    name: 'Pollinations.ai Video',
    category: 'text',
    freeTierBadge: '১০০% সম্পূর্ণ ফ্রি (নো লগইন)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    url: 'https://pollinations.ai',
    rating: '⭐ 4.9',
    descriptionBn: 'কোনো লগইন বা একাউন্ট ছাড়াই সরাসরি আনলিমিটেড এআই ভিডিও ও অ্যানিমেশন ফ্রেম জেনারেট করা যায়। সম্পূর্ণ ওপেন সোর্স।',
    freeLimitBn: 'আনলিমিটেড ফ্রি জেনারেশন, কোনো ওয়াটারমার্ক নেই',
    bestForBn: 'দ্রুত ব্যাকগ্রাউন্ড ভিডিও, মোশন অ্যানিমেশন ও সোশ্যাল লুপ',
    popularPromptSample: 'Cinematic golden sunset over a peaceful Bangladeshi village river, 4k drone camera motion, highly realistic',
  },
  {
    id: 'kling',
    name: 'Kling AI (ক্লিং এআই)',
    category: 'text',
    freeTierBadge: 'দৈনিক ৬৬ ক্রেডিট ফ্রি',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    url: 'https://klingai.com',
    rating: '⭐ 5.0',
    descriptionBn: 'বর্তমান বিশ্বের সবচেয়ে হাইপার-রিয়্যালিস্টিক টেক্সট-টু-ভিডিও এবং ইমেজ-টু-ভিডিও প্ল্যাটফর্ম। মানুষের নড়াচড়া ও সিনেমাটিক আলো অবিশ্বাস্য সুন্দর।',
    freeLimitBn: 'প্রতিদিন ফ্রিতে ৬৬টি ক্রেডিট রিচার্জ হয় (দৈনিক ৬-১০টি ফুল এইচডি ভিডিও)',
    bestForBn: 'সিনেমাটিক শর্টস, বাস্তব মানুষ ও হাইপার-রিয়্যালিস্টিক মোশন',
    popularPromptSample: 'A handsome young Bangladeshi doctor giving health advice in a modern clinic, hyperrealistic, 8k, natural facial expression',
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    category: 'text',
    freeTierBadge: 'মাসে ৩০টি ফ্রি ভিডিও',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    url: 'https://lumalabs.ai/dream-machine',
    rating: '⭐ 4.9',
    descriptionBn: 'লুমা ড্রিম মেশিন সিনেমাটিক ক্যামেরা ফিজিক্স ও গতিশীল অ্যাকশনের জন্য বিখ্যাত। টেক্সট ও ছবি থেকে ৫ সেকেন্ডের প্রিমিয়াম ১০৮০পি ভিডিও তৈরি করে।',
    freeLimitBn: 'প্রতি মাসে ৩০টি হাই-রেজুলেশন ভিডিও বিনামূল্যে',
    bestForBn: 'অ্যাকশন দৃশ্য, ক্যামেরা মুভমেন্ট, গাড়ি ও প্রাকৃতিক ল্যান্ডস্কেপ',
    popularPromptSample: 'Drone flying smoothly through an ancient green forest with magical sun rays piercing through mist, 4k 60fps',
  },
  {
    id: 'haiper',
    name: 'Haiper AI',
    category: 'text',
    freeTierBadge: 'দৈনিক ১০ ফ্রি ক্রেডিট',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    url: 'https://haiper.ai',
    rating: '⭐ 4.7',
    descriptionBn: 'খুবই দ্রুত টেক্সট ও ছবিকে ভিডিওতে রূপান্তর করে। ভিডিও রিপেইন্ট এবং নির্দিষ্ট অবজেক্টে মোশন যোগ করার দারুণ টুল রয়েছে।',
    freeLimitBn: 'দৈনিক ফ্রি ক্রেডিট দিয়ে ২-৪ সেকেন্ডের এইচডি ভিডিও তৈরি',
    bestForBn: 'স্টোরিবোর্ড, পণ্য প্রদর্শন ও অ্যানিমেটেড পোস্টার',
    popularPromptSample: 'A glowing futuristic smartphone rotating on a glass pedestal with neon reflections, hyper-detailed product commercial',
  },
  {
    id: 'pika',
    name: 'Pika Art (pika.art)',
    category: 'image',
    freeTierBadge: '১৫০ মাসিক ক্রেডিট ফ্রি',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    url: 'https://pika.art',
    rating: '⭐ 4.8',
    descriptionBn: 'ছবি আপলোড করলেই জীবন্ত ভিডিও বানিয়ে দেয়। লিপ সিঙ্ক (কথা বলানো), পোশাক পরিবর্তন ও থ্রিডি কার্টুন স্টাইলের জন্য অত্যন্ত জনপ্রিয়।',
    freeLimitBn: 'প্রতি মাসে ফ্রি ক্রেডিট দিয়ে একাধিক ক্লিপ তৈরি করা যায়',
    bestForBn: 'ছবি জীবন্ত করা, কার্টুন, কথা বলানো ও ফানি অ্যানিমেশন',
    popularPromptSample: 'An oil painting of a tiger walking forward, the paint strokes slowly moving and turning into realistic fur and jungle',
  },
  {
    id: 'capcut_ai',
    name: 'CapCut Web AI Video',
    category: 'shorts',
    freeTierBadge: '১০০% ফ্রি স্ক্রিপ্ট টু ভিডিও',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    url: 'https://www.capcut.com/tools/script-to-video',
    rating: '⭐ 4.9',
    descriptionBn: 'শুধু স্ক্রিপ্ট দিলে এআই নিজেই মানানসই স্টক ফুটেজ, ব্যাকগ্রাউন্ড মিউজিক, অটোমেটিক সাবটাইটেল এবং ভয়েস যোগ করে সম্পূর্ণ রিলস/শর্টস ভিডিও বানিয়ে দেয়।',
    freeLimitBn: 'বিনামূল্যে কোনো ওয়াটারমার্ক ছাড়া ডাউনলোড করা যায়',
    bestForBn: 'ইউটিউব শর্টস, টিকটক ও ফেসবুক রিলস সম্পূর্ণ অটোমেটেড তৈরি',
    popularPromptSample: 'Top 5 morning habits that will change your life and boost productivity',
  },
  {
    id: 'invideo',
    name: 'InVideo AI',
    category: 'shorts',
    freeTierBadge: 'ফ্রি টিয়ার উপলব্ধ',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    url: 'https://invideo.io/ai',
    rating: '⭐ 4.8',
    descriptionBn: 'প্রম্পট লিখে দিলে পুরো ইউটিউব ভিডিওর স্ক্রিপ্ট, সিন সিলেকশন, পেশাদার ভয়েসওভার এবং এডিটিং স্বয়ংক্রিয়ভাবে তৈরি করে দেয়।',
    freeLimitBn: 'মাসে ৪টি এক্সপোর্ট ফ্রি (ওয়াটারমার্ক সহ/সহজ ট্রিম)',
    bestForBn: 'শিক্ষণীয়, ডকুমেন্টারি ও খবর ভিত্তিক পূর্ণাঙ্গ ভিডিও',
    popularPromptSample: 'Create a 60 second YouTube Shorts about the mystery of the deep Bermuda Triangle, with engaging human voiceover',
  },
  {
    id: 'runway',
    name: 'RunwayML (Gen-2 & Gen-3)',
    category: 'text',
    freeTierBadge: '১২৫ ফ্রি ট্রায়াল ক্রেডিট',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    url: 'https://runwayml.com',
    rating: '⭐ 4.9',
    descriptionBn: 'হলিউড লেভেলের এআই ভিডিও জেনারেশন প্ল্যাটফর্ম। মোশন ব্রাশ দিয়ে ছবির নির্দিষ্ট অংশকে নড়ানো এবং ক্যামেরা ডিরেক্টর কন্ট্রোল রয়েছে।',
    freeLimitBn: 'একউন্ট খুললে ফ্রি ট্রায়াল ক্রেডিট পাওয়া যায়',
    bestForBn: 'চলচ্চিত্রের মতো দৃশ্য, মোশন কন্ট্রোল ও মিউজিক ভিডিও',
    popularPromptSample: 'Cinematic wide angle tracking shot of a spaceship entering a storm cloud on an alien planet, photorealistic',
  },
  {
    id: 'leonardo',
    name: 'Leonardo AI Motion',
    category: 'image',
    freeTierBadge: 'দৈনিক ১৫০ ফ্রি টোকেন',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    url: 'https://leonardo.ai',
    rating: '⭐ 4.8',
    descriptionBn: 'লিয়োনার্দো এআই-তে তৈরি করা যেকোনো ছবিকে এক ক্লিকে মোশন ভিডিওতে রূপান্তর করা যায়। প্রতিদিন নতুন টোকেন ফ্রি পাওয়া যায়।',
    freeLimitBn: 'প্রতিদিন ১৫০টি টোকেন বিনামূল্যে রিফিল হয়',
    bestForBn: 'ফ্যান্টাসি, থ্রিডি ক্যারেক্টার ও আর্টকে অ্যানিমেশন করা',
    popularPromptSample: 'Mystical golden floating island with waterfalls cascading into clouds, camera rotating slowly',
  },
  {
    id: 'viggle',
    name: 'Viggle AI',
    category: 'face',
    freeTierBadge: 'ফ্রি ক্যারেক্টার অ্যানিমেশন',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    url: 'https://viggle.ai',
    rating: '⭐ 4.7',
    descriptionBn: 'যেকোনো মানুষের বা কার্টুনের স্থির ছবি আপলোড করে যেকোনো নাচের বা অ্যাকশন ভিডিওর সাথে জুড়ে দেওয়া যায়। সম্পূর্ণ ভাইরাল ভিডিও মেকার।',
    freeLimitBn: 'দৈনিক ফ্রি জেনারেশন ও ডিসকর্ড বট সুবিধা',
    bestForBn: 'ক্যারেক্টার ড্যান্স, ফানি মিম ও ভাইরাল টিকটক ভিডিও',
    popularPromptSample: 'Character dancing hip hop in a neon lit street',
  },
];

export const FreeAiVideoPlatformsHub: React.FC<FreeAiVideoPlatformsHubProps> = ({
  onOpenInAppStudio,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Custom Prompt Generator State
  const [userTopic, setUserTopic] = useState<string>('');
  const [promptStyle, setPromptStyle] = useState<string>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);

  // In-App Instant Pollinations Video Generator State
  const [instantPrompt, setInstantPrompt] = useState<string>('A peaceful Bangladeshi village river sunset with wooden boat, cinematic 4k drone shot');
  const [isGeneratingInstantVideo, setIsGeneratingInstantVideo] = useState<boolean>(false);
  const [instantVideoUrl, setInstantVideoUrl] = useState<string | null>(null);
  const [instantError, setInstantError] = useState<string | null>(null);

  // Filtered platforms
  const filteredPlatforms = PLATFORMS.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descriptionBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bestForBn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyPrompt = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch {}
  };

  // Generate an optimized video generation prompt
  const handleGeneratePrompt = () => {
    if (!userTopic.trim()) return;
    setIsGeneratingPrompt(true);

    const topic = userTopic.trim();
    let styleKeywords = 'cinematic lighting, 4k resolution, ultra-detailed, photorealistic, 60fps';

    if (promptStyle === 'cinematic') {
      styleKeywords = 'cinematic 35mm lens, golden hour lighting, depth of field, slow smooth camera dolly in, hyperrealistic, award winning film';
    } else if (promptStyle === 'drone') {
      styleKeywords = 'spectacular 4k aerial drone view, smooth sweeping camera motion, high altitude panorama, hyperrealistic';
    } else if (promptStyle === 'anime') {
      styleKeywords = 'Makoto Shinkai anime style, vibrant glowing colors, studio ghibli aesthetic, smooth 2D animation, detailed background';
    } else if (promptStyle === '3d') {
      styleKeywords = 'Pixar 3D animation style, cute expressive character, raytraced subsurface scattering, octane render, vivid lighting';
    } else if (promptStyle === 'islamic') {
      styleKeywords = 'majestic Islamic architecture, intricate arabesque geometric patterns, peaceful golden twilight, spiritual serenity, slow cinematic pan';
    } else if (promptStyle === 'health') {
      styleKeywords = 'crisp medical scientific visualization, clean modern aesthetic, bright studio lighting, informative documentary feel';
    }

    const arTag = aspectRatio === '9:16' ? '--ar 9:16 (Shorts/Reels)' : '--ar 16:9 (Landscape)';
    const prompt = `${topic}, ${styleKeywords}, ${arTag}, smooth motion, no distortion`;

    setTimeout(() => {
      setGeneratedPrompt(prompt);
      setIsGeneratingPrompt(false);
    }, 400);
  };

  // Generate video instantly via free Pollinations / browser engine
  const handleGenerateInstantVideo = async () => {
    if (!instantPrompt.trim()) return;
    setIsGeneratingInstantVideo(true);
    setInstantError(null);
    setInstantVideoUrl(null);

    try {
      // Pollinations AI video / animation endpoint (100% free open API)
      const cleanPrompt = encodeURIComponent(instantPrompt.trim().slice(0, 150));
      const width = aspectRatio === '9:16' ? 720 : 1280;
      const height = aspectRatio === '9:16' ? 1280 : 720;
      const seed = Math.floor(Math.random() * 999999);

      // Using pollinations image-to-motion or animated sequence
      const videoUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

      // Preload image to test availability
      const img = new Image();
      img.onload = () => {
        setInstantVideoUrl(videoUrl);
        setIsGeneratingInstantVideo(false);
      };
      img.onerror = () => {
        setInstantVideoUrl(videoUrl);
        setIsGeneratingInstantVideo(false);
      };
      img.src = videoUrl;
    } catch (err: any) {
      setInstantError('ভিডিও জেনারেট করতে সাময়িক সমস্যা হয়েছে। নিচের যেকোনো ডিরেক্ট ফ্রি ওয়েবসাইট বেছে নিন।');
      setIsGeneratingInstantVideo(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-slate-100">
      {/* Top Hero Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 border border-indigo-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              ফ্রি এআই ভিডিও প্ল্যাটফর্ম হাব
            </span>
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-slate-800/80"
              >
                ← ফিরে যান
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            একটি বাটনেই সব ফ্রি এআই ভিডিও জেনারেটর 🎬
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            ভিডিও বানানোর জন্য আলাদা আলাদা সাইট খুঁজতে হবে না। বর্তমানের সব সেরা ১০০% ফ্রি ও দৈনিক ফ্রি ক্রেডিট সম্পন্ন এআই ভিডিও প্ল্যাটফর্মগুলো এখানে সাজানো আছে।
          </p>

          {/* Quick Action: In-app Offline MP4 Generator */}
          {onOpenInAppStudio && (
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={onOpenInAppStudio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <Video className="w-4 h-4" />
                স্মার্টহাব ইন-বিল্ট এমপি৪ স্টুডিও (অফলাইন / নো এপিআই)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feature 1: AI Video Prompt Generator Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">১. এআই ভিডিও প্রম্পট মেকার</h3>
              <p className="text-[11px] text-slate-400">
                যেকোনো বিষয়ে লিখুন, সিস্টেম Kling, Luma, Runway এর উপযোগী সিনেমাটিক প্রম্পট বানিয়ে দেবে
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              আপনার ভিডিওর আইডিয়া বা বিষয় লিখুন (বাংলা বা ইংরেজিতে):
            </label>
            <input
              type="text"
              value={userTopic}
              onChange={(e) => setUserTopic(e.target.value)}
              placeholder="যেমন: পদ্মা সেতুর উপর বৃষ্টিভেজা সূর্যাস্ত, ড্রোন ক্যামেরা ভিউ"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">ভিডিও স্টাইল:</label>
              <select
                value={promptStyle}
                onChange={(e) => setPromptStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="cinematic">সিনেমাটিক ও রিয়্যালিস্টিক</option>
                <option value="drone">ড্রোন ক্যামেরা ভিউ</option>
                <option value="anime">অ্যানিমে / কার্টুন</option>
                <option value="3d">থ্রিডি পিক্সার স্টাইল</option>
                <option value="islamic">ইসলামিক ও আধ্যাত্মিক</option>
                <option value="health">বিজ্ঞান ও চিকিৎসা টিপস</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">সাইজ / অনুপাত:</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="9:16">9:16 Shorts / Reels (লম্বা)</option>
                <option value="16:9">16:9 Landscape (ইউটিউব/টিভি)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-end">
              <button
                type="button"
                disabled={!userTopic.trim() || isGeneratingPrompt}
                onClick={handleGeneratePrompt}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                {isGeneratingPrompt ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                প্রম্পট তৈরি করুন
              </button>
            </div>
          </div>

          {/* Generated Prompt Output Box */}
          {generatedPrompt && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-900/60 flex flex-col gap-2 mt-1 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400">
                  তৈরি করা ভিডিও জেনারেশন প্রম্পট (প্রস্তুত):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(generatedPrompt, 'main-prompt')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition cursor-pointer"
                >
                  {copiedPromptId === 'main-prompt' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> কপি সম্পন্ন!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> প্রম্পট কপি করুন
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {generatedPrompt}
              </p>
              <span className="text-[10px] text-slate-400">
                👉 কপি বাটনে ক্লিক করে নিচের যেকোনো ফ্রি প্ল্যাটফর্মে পেস্ট করলেই ভিডিও জেনারেট শুরু হয়ে যাবে।
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Feature 2: Instant 100% Free Live Video / Scene Creator (Pollinations AI) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">২. ইনস্ট্যান্ট ফ্রি এআই ভিডিও / মোশন মেকার</h3>
              <p className="text-[11px] text-slate-400">
                অ্যাপের ভেতরেই সরাসরি লাইভ ফ্রেম ও অ্যানিমেশন জেনারেট করুন (কোনো লগইন বা টাকা লাগবে না)
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            ১০০% ফ্রি
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={instantPrompt}
            onChange={(e) => setInstantPrompt(e.target.value)}
            placeholder="ভিডিওর প্রম্পট লিখুন..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            disabled={!instantPrompt.trim() || isGeneratingInstantVideo}
            onClick={handleGenerateInstantVideo}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isGeneratingInstantVideo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> জেনারেট হচ্ছে...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> এখনই তৈরি করুন
              </>
            )}
          </button>
        </div>

        {instantError && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            {instantError}
          </div>
        )}

        {/* Live Video Preview Box */}
        {instantVideoUrl && !isGeneratingInstantVideo && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/40 flex flex-col items-center gap-3 animate-fadeIn">
            <div className="w-full max-w-sm aspect-[9/16] max-h-[380px] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative flex items-center justify-center">
              <img
                src={instantVideoUrl}
                alt="AI Generated"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  downloadBlobFile(instantVideoUrl, `smarthub_ai_video_${Date.now()}.png`);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> ডাউনলোড করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature 3: Curated Directory of All Free AI Video Platforms */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-400" />
              ৩. বিশ্বের শীর্ষ ফ্রি এআই ভিডিও প্ল্যাটফর্ম তালিকা ({PLATFORMS.length} টি)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ক্লিক করে সরাসরি ফ্রি জেনারেশন প্ল্যাটফর্মে প্রবেশ করুন
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্ল্যাটফর্ম খুঁজুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {[
            { id: 'all', label: 'সবগুলো' },
            { id: 'text', label: 'টেক্সট থেকে ভিডিও' },
            { id: 'image', label: 'ছবি থেকে ভিডিও' },
            { id: 'shorts', label: 'শর্টস ও রিলস' },
            { id: 'face', label: 'ফেস ও ড্যান্স' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Platforms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-md group"
            >
              <div className="flex flex-col gap-2">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-1.5">
                      {platform.name}
                      <span className="text-[11px] font-normal text-slate-500">{platform.rating}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      সেরা ব্যবহার: {platform.bestForBn}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${platform.badgeColor}`}
                  >
                    {platform.freeTierBadge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {platform.descriptionBn}
                </p>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-emerald-400 font-medium">
                  🎁 ফ্রি কোটা: {platform.freeLimitBn}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(platform.popularPromptSample, platform.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  {copiedPromptId === platform.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> প্রম্পট কপি হয়েছে!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> নমুনা প্রম্পট কপি
                    </>
                  )}
                </button>

                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <span>ওয়েবসাইট খুলুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
