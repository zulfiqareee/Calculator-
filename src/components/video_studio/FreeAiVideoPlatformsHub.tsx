import React, { useState, useMemo } from 'react';
import {
  Video,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  Copy,
  LayoutGrid,
  Table as TableIcon,
  Globe2,
  Play,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
} from 'lucide-react';

export interface FreeAiVideoPlatformsHubProps {
  onOpenInAppStudio?: () => void;
  onBack?: () => void;
}

export interface AiVideoPlatform {
  rank: number;
  id: string;
  name: string;
  bestForEn: string;
  bestForBn: string;
  pricingEn: string;
  pricingBn: string;
  hasFreePlan: boolean;
  freePlanNoteBn: string;
  url: string;
  category: 'avatar' | 'text2video' | 'shorts' | 'animation' | 'editor';
  brandColor: string;
  logoBg: string;
  popularPrompt: string;
}

export const AI_VIDEO_PLATFORMS: AiVideoPlatform[] = [
  {
    rank: 1,
    id: 'synthesia',
    name: 'synthesia',
    bestForEn: 'Professional videos with lifelike AI avatars',
    bestForBn: 'বাস্তবধর্মী এআই হিউম্যান অবতার ও পেশাদার কর্পোরেট ভিডিও',
    pricingEn: 'Free, Starter ($18/mo), Creator ($64/mo), Enterprise (custom)',
    pricingBn: 'ফ্রি প্ল্যান, স্টার্টার ($১৮/মাস), ক্রিয়েটর ($৬৪/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'বিনামূল্যে ফ্রি টেস্ট একাউন্ট ও ৩ মিনিটের অবতার ভিডিও',
    url: 'https://www.synthesia.io',
    category: 'avatar',
    brandColor: '#2563EB',
    logoBg: 'bg-blue-600',
    popularPrompt: 'A professional female business presenter explaining digital marketing in a modern office studio',
  },
  {
    rank: 2,
    id: 'pictory',
    name: 'PICTORY',
    bestForEn: 'Repurposing text into short-form videos',
    bestForBn: 'ব্লগ ও টেক্সটকে স্বয়ংক্রিয়ভাবে ভিডিও ক্লিপে রূপান্তর',
    pricingEn: 'Starter ($19/mo), Professional ($39/mo), Team ($99/mo), Enterprise (custom)',
    pricingBn: 'স্টার্টার ($১৯/মাস), প্রফেশনাল ($৩৯/মাস), টিম ($৯৯/মাস)',
    hasFreePlan: false,
    freePlanNoteBn: '১৪ দিনের ফ্রি ট্রায়াল (৩টি ভিডিও ফ্রি ওয়াটারমার্ক সহ)',
    url: 'https://pictory.ai',
    category: 'shorts',
    brandColor: '#9333EA',
    logoBg: 'bg-purple-600',
    popularPrompt: 'Transform this health article into a 60 second engaging video with relevant stock footage and subtitles',
  },
  {
    rank: 3,
    id: 'runway',
    name: 'runway',
    bestForEn: 'Creating custom visuals, b-roll, and cinematic AI effects',
    bestForBn: 'সিনেমাটিক দৃশ্য, বি-রোল ও হাই-লেভেল ভিজ্যুয়াল এফেক্টস (Gen-2/Gen-3)',
    pricingEn: 'Basic (Free), Standard ($12/mo), Pro ($28/mo), Unlimited ($76/mo), Enterprise (custom)',
    pricingBn: 'বেসিক (ফ্রি ১২৫ ক্রেডিট), স্ট্যান্ডার্ড ($১২/মাস), প্রো ($২৮/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: '১২৫ ফ্রি ট্রায়াল ক্রেডিট (Gen-2 ও Gen-3 Alpha টেস্টের জন্য)',
    url: 'https://runwayml.com',
    category: 'text2video',
    brandColor: '#0F172A',
    logoBg: 'bg-slate-900 border border-slate-700',
    popularPrompt: 'Cinematic wide angle drone shot flying through a glowing alien crystal canyon at golden hour, photorealistic 8k',
  },
  {
    rank: 4,
    id: 'invideo',
    name: 'invideo AI',
    bestForEn: 'Script-based video automation and social content',
    bestForBn: 'স্ক্রিপ্ট লিখে দিলে পূর্ণাঙ্গ ইউটিউব ভিডিও ও ভয়েস তৈরি',
    pricingEn: 'Free, Plus ($28/mo), Max ($48/mo), Generative ($96/mo)',
    pricingBn: 'ফ্রি প্ল্যান (৪ এক্সপোর্ট/সপ্তাহ), প্লাস ($২৮/মাস), ম্যাক্স ($৪৮/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'ফ্রি প্ল্যানে প্রতি সপ্তাহে ৪টি এক্সপোর্ট (ইনভিডিও ওয়াটারমার্ক সহ)',
    url: 'https://invideo.io',
    category: 'shorts',
    brandColor: '#3B82F6',
    logoBg: 'bg-blue-500',
    popularPrompt: 'Create a 60-second YouTube Short about 5 ancient mysteries science cannot explain, with captivating narration',
  },
  {
    rank: 5,
    id: 'heygen',
    name: 'HeyGen',
    bestForEn: 'Avatar-driven multilingual and faceless video content',
    bestForBn: 'বহুভাষিক কথা বলা অবতার ও ফেসলেস ভিডিও চ্যানেল মেকার',
    pricingEn: 'Free, Creator ($29/mo), Team ($39/seat/mo), Enterprise (custom)',
    pricingBn: 'ফ্রি প্ল্যান (১ ফ্রি ক্রেডিট), ক্রিয়েটর ($২৯/মাস), টিম ($৩৯/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'বিনামূল্যে সাইনআপে ১টি ফুল ভিডিও ক্রেডিট ও ফটো অবতার',
    url: 'https://www.heygen.com',
    category: 'avatar',
    brandColor: '#4F46E5',
    logoBg: 'bg-indigo-600',
    popularPrompt: 'Male avatar in smart casual clothing speaking Bengali naturally with perfect lip sync about technology',
  },
  {
    rank: 6,
    id: 'sora',
    name: 'Sora',
    bestForEn: 'Generating high-quality videos from simple prompts',
    bestForBn: 'প্রম্পট থেকে হলিউড লেভেলের ফিজিক্স ও অত্যন্ত নিখুঁত ভিডিও',
    pricingEn: 'ChatGPT Plus ($20/mo), ChatGPT Pro ($200/mo)',
    pricingBn: 'চ্যাটজিপিটি প্লাস ($২০/মাস), চ্যাটজিপিটি প্রো ($২০০/মাস)',
    hasFreePlan: false,
    freePlanNoteBn: 'সরাসরি ফ্রি প্ল্যান নেই (ChatGPT Plus সাবস্ক্রাইবারদের অন্তর্ভুক্ত)',
    url: 'https://sora.com',
    category: 'text2video',
    brandColor: '#10A37F',
    logoBg: 'bg-emerald-600',
    popularPrompt: 'A photorealistic close-up of a chameleon changing neon colors smoothly against a lush rainforest canopy, 4k 60fps',
  },
  {
    rank: 7,
    id: 'filmora',
    name: 'Filmora',
    bestForEn: 'AI-enhanced video polishing for editors',
    bestForBn: 'ভিডিও এডিটরদের জন্য শক্তিশালী এআই কাট, অটো সাবটাইটেল ও এফেক্টস',
    pricingEn: 'Basic ($4.17/mo), Advanced ($5/mo), Premium ($8.33/mo)',
    pricingBn: 'বেসিক ($৪.১৭/মাস), অ্যাডভান্সড ($৫/মাস), প্রিমিয়াম ($৮.৩৩/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'আজীবন বিনামূল্যে ব্যবহার উপযোগী (এক্সপোর্টে ফিল্মোরা ওয়াটারমার্ক থাকে)',
    url: 'https://filmora.wondershare.com',
    category: 'editor',
    brandColor: '#0D9488',
    logoBg: 'bg-teal-600',
    popularPrompt: 'AI smart cutout, motion tracking, auto beat sync, and automatic speech to text subtitle generator',
  },
  {
    rank: 8,
    id: 'capsule',
    name: 'Capsule',
    bestForEn: 'Simplifying video workflows for teams',
    bestForBn: 'টিম ও ব্র্যান্ডের জন্য অটোমেটেড ভিডিও ওয়ার্কফ্লো ও টাইপোগ্রাফি',
    pricingEn: 'Business Free ($0), Enterprise (custom)',
    pricingBn: 'বিজনেস ফ্রি ($০), এন্টারপ্রাইজ (কাস্টম প্যাকেজ)',
    hasFreePlan: true,
    freePlanNoteBn: '১০০% ফ্রি বিজনেজ প্ল্যান দিয়ে শুরু করা যায় ($০)',
    url: 'https://capsule.video',
    category: 'editor',
    brandColor: '#84CC16',
    logoBg: 'bg-lime-500',
    popularPrompt: 'Clean minimalist product announcement video with animated typography, corporate graphics and kinetic transitions',
  },
  {
    rank: 9,
    id: 'peech',
    name: 'Peech',
    bestForEn: 'Scaling content marketing video production',
    bestForBn: 'কনটেন্ট মার্কেটিং, ব্র্যান্ডিং ও সোশ্যাল ভিডিও বড় পরিসরে উৎপাদন',
    pricingEn: 'Free, Starter ($100/mo), Growth ($300/mo), Enterprise (custom)',
    pricingBn: 'ফ্রি প্ল্যান (মাসে ২টি এক্সপোর্ট), স্টার্টার ($১০০/মাস), গ্রোথ ($৩০০/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'ফ্রি প্ল্যানে প্রতি মাসে ২টি ওয়াটারমার্ক ছাড়া ভিডিও তৈরি',
    url: 'https://www.peech-ai.com',
    category: 'shorts',
    brandColor: '#1E293B',
    logoBg: 'bg-slate-800',
    popularPrompt: 'Automatically highlight key podcast moments, reframe for vertical mobile screens and generate animated captions',
  },
  {
    rank: 10,
    id: 'vyond',
    name: 'VYOND',
    bestForEn: 'Animated character and explainer video creation',
    bestForBn: 'টুডি কার্টুন চরিত্র, অ্যানিমেটেড শিক্ষণীয় ও এক্সপ্লেইনার ভিডিও',
    pricingEn: 'Essential ($25/mo), Premium ($54/mo), Professional ($92/mo), Enterprise ($125/mo), Agency (custom)',
    pricingBn: 'এসেনশিয়াল ($২৫/মাস), প্রিমিয়াম ($৫৪/মাস), প্রফেশনাল ($৯২/মাস)',
    hasFreePlan: false,
    freePlanNoteBn: '১৪ দিনের ফ্রি ট্রায়াল (ফুল ফিচার টেস্ট করা যায়)',
    url: 'https://www.vyond.com',
    category: 'animation',
    brandColor: '#EA580C',
    logoBg: 'bg-orange-600',
    popularPrompt: 'Two 2D animated characters in a doctor clinic discussing healthy balanced food nutrition tips with cheerful gestures',
  },
  {
    rank: 11,
    id: 'revid',
    name: 'revid.ai',
    bestForEn: 'Quick promo videos with AI-powered templates',
    bestForBn: 'রেডিমেড এআই টেমপ্লেট দিয়ে দ্রুত প্রমোশনাল ও ভাইরাল বিজ্ঞাপন ভিডিও',
    pricingEn: 'Hobby ($39/mo), Growth ($39/mo), Ultra ($199/mo)',
    pricingBn: 'হবি ($৩৯/মাস), গ্রোথ ($৩৯/মাস), আল্ট্রা ($১৯৯/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'ফ্রি টেস্ট মোড দিয়ে যেকোনো টেমপ্লেট প্রিভিউ করা যায়',
    url: 'https://www.revid.ai',
    category: 'shorts',
    brandColor: '#059669',
    logoBg: 'bg-emerald-700',
    popularPrompt: 'TikTok viral e-commerce product hook with fast animated text overlays, trendy sound effects and split screen',
  },
  {
    rank: 12,
    id: 'ltx',
    name: 'LTX Studio',
    bestForEn: 'Advanced creative control and team collaboration',
    bestForBn: 'পূর্ণাঙ্গ সিনেমার মতো দৃশ্য, শট-বাই-শট ডিরেকশন ও স্টোরিবোর্ড',
    pricingEn: 'Free, Lite ($12/mo), Standard ($28/mo), Pro ($100/mo)',
    pricingBn: 'ফ্রি প্ল্যান (মাসিক ফ্রি ক্রেডিট), লাইট ($১২/মাস), স্ট্যান্ডার্ড ($২৮/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'বিনামূল্যে ফ্রি প্ল্যানে পূর্ণ সিনেমাটিক শট তৈরি ও কন্ট্রোল সুবিধা',
    url: 'https://ltx.studio',
    category: 'text2video',
    brandColor: '#2563EB',
    logoBg: 'bg-blue-700',
    popularPrompt: 'Multi-scene cinematic sci-fi trailer with consistent character face, dramatic camera angles and lighting continuity',
  },
  {
    rank: 13,
    id: 'kling',
    name: 'Kling AI',
    bestForEn: 'Hyper-realistic motion, realistic humans & cinematic physics',
    bestForBn: 'বাস্তব মানুষের নড়াচড়া, নিখুঁত শারীরিক মোশন ও ৫-১০ সেকেন্ড এইচডি ভিডিও',
    pricingEn: 'Free (66 Daily Credits), Standard ($10/mo), Pro ($37/mo)',
    pricingBn: 'প্রতিদিন ৬৬ ক্রেডিট সম্পূর্ণ ফ্রি! স্ট্যান্ডার্ড ($১০/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'প্রতিদিন ফ্রিতে ৬৬টি ক্রেডিট রিচার্জ হয় (দৈনিক ৬-১০টি ফুল এইচডি ভিডিও)',
    url: 'https://klingai.com',
    category: 'text2video',
    brandColor: '#6366F1',
    logoBg: 'bg-indigo-700',
    popularPrompt: 'A realistic Bangladeshi street food chef preparing hot steaming jilapi in old Dhaka at night, natural hand motion, 4k cinematic',
  },
  {
    rank: 14,
    id: 'luma',
    name: 'Luma Dream Machine',
    bestForEn: 'Dynamic action, realistic camera sweeps & natural physics',
    bestForBn: 'গতিশীল অ্যাকশন সিন, বাস্তবধর্মী ক্যামেরা মুভমেন্ট ও আলোর প্রতিফলন',
    pricingEn: 'Free (30 generations/mo), Standard ($29.99/mo), Pro ($99.99/mo)',
    pricingBn: 'প্রতি মাসে ৩০টি ভিডিও সম্পূর্ণ ফ্রি! স্ট্যান্ডার্ড ($২৯.৯৯/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'প্রতি মাসে ৩০টি হাই-রেজুলেশন সিনেমাটিক ভিডিও সম্পূর্ণ বিনামূল্যে',
    url: 'https://lumalabs.ai/dream-machine',
    category: 'text2video',
    brandColor: '#8B5CF6',
    logoBg: 'bg-purple-700',
    popularPrompt: 'A sports car speeding along a coastal highway at twilight, camera sweeping low from tire level up to sunset horizon',
  },
  {
    rank: 15,
    id: 'hailuo',
    name: 'Hailuo AI (MiniMax)',
    bestForEn: 'Viral cinematic scenes & expressive character emotional acting',
    bestForBn: 'ভাইরাল সিনেমাটিক ভিডিও ও অভিব্যক্তিপূর্ণ চেহারার নিখুঁত এক্সপ্রেশন',
    pricingEn: 'Free tier available, Pro ($10/mo), Max ($30/mo)',
    pricingBn: 'ফ্রি টিয়ার উপলব্ধ, প্রো ($১০/মাস), ম্যাক্স ($৩০/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'প্রতিদিন ফ্রি ক্রেডিট দিয়ে হাই-কোয়ালিটি সিনেমাটিক ভিডিও জেনারেশন',
    url: 'https://hailuoai.video',
    category: 'text2video',
    brandColor: '#EC4899',
    logoBg: 'bg-pink-600',
    popularPrompt: 'An emotional grandmother smiling warmly with tears of joy, holding a newborn child, cinematic documentary lighting',
  },
  {
    rank: 16,
    id: 'pika',
    name: 'Pika (pika.art)',
    bestForEn: 'Image animation, Pikaffects (inflate, melt, explode) & 3D clips',
    bestForBn: 'ছবি আপলোড করলেই কথা বলানো, ফানি মোশন ও থ্রিডি কার্টুন স্টাইল',
    pricingEn: 'Basic Free (150 initial credits), Standard ($10/mo), Pro ($35/mo)',
    pricingBn: 'বেসিক ফ্রি (১৫০ ক্রেডিট), স্ট্যান্ডার্ড ($১০/মাস), প্রো ($৩৫/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: '১৫০টি ফ্রি ক্রেডিট ও প্রতিদিন রিফিল সুবিধা',
    url: 'https://pika.art',
    category: 'animation',
    brandColor: '#F59E0B',
    logoBg: 'bg-amber-600',
    popularPrompt: 'An oil painting of a tiger suddenly blinking its eyes and breathing gently as water ripples around its paws',
  },
  {
    rank: 17,
    id: 'capcut',
    name: 'CapCut Web AI',
    bestForEn: 'Script to complete YouTube Shorts & TikTok with auto captions',
    bestForBn: 'স্ক্রিপ্ট থেকে অটোমেটিক স্টক ফুটেজ, বাংলা/ইংরেজি সাবটাইটেল ও ভয়েস',
    pricingEn: '100% Free Web Version ($0), CapCut Pro ($9.99/mo)',
    pricingBn: 'ওয়েব ভার্সন ১০০% ফ্রি ($০), ক্যাপকাট প্রো ($৯.৯৯/মাস)',
    hasFreePlan: true,
    freePlanNoteBn: 'কোনো ওয়াটারমার্ক ছাড়াই সম্পূর্ণ ফ্রি এক্সপোর্ট সুবিধা',
    url: 'https://www.capcut.com/tools/script-to-video',
    category: 'shorts',
    brandColor: '#06B6D4',
    logoBg: 'bg-cyan-600',
    popularPrompt: 'Top 5 morning habit tips to double your focus and energy, with clean motion subtitles and ambient music',
  },
  {
    rank: 18,
    id: 'pollinations',
    name: 'Pollinations.ai',
    bestForEn: 'Instant open-source video & animation with no account/login needed',
    bestForBn: 'কোনো একাউন্ট বা ক্রেডিট ছাড়াই সরাসরি ১০০% ফ্রি আনলিমিটেড ভিডিও ফ্রেম',
    pricingEn: '100% Free Forever ($0, Open Source)',
    pricingBn: 'আজীবন ১০০% সম্পূর্ণ ফ্রি ($০), ওপেন সোর্স',
    hasFreePlan: true,
    freePlanNoteBn: 'আনলিমিটেড ফ্রি জেনারেশন, কোনো সাইনআপ বা ক্রেডিট কার্ড নেই',
    url: 'https://pollinations.ai',
    category: 'text2video',
    brandColor: '#10B981',
    logoBg: 'bg-emerald-600',
    popularPrompt: 'A peaceful sunrise over Bangladeshi river with wooden boats drifting gently, 4k fluid camera motion',
  },
];

export const FreeAiVideoPlatformsHub: React.FC<FreeAiVideoPlatformsHubProps> = ({
  onOpenInAppStudio,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [freePlanFilter, setFreePlanFilter] = useState<'all' | 'free_only' | 'paid_only'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Quick Prompt Generator
  const [promptTopic, setPromptTopic] = useState<string>('');
  const [promptStyle, setPromptStyle] = useState<string>('cinematic');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  // Filtered platforms
  const filteredPlatforms = useMemo(() => {
    return AI_VIDEO_PLATFORMS.filter((platform) => {
      // Free plan filter
      if (freePlanFilter === 'free_only' && !platform.hasFreePlan) return false;
      if (freePlanFilter === 'paid_only' && platform.hasFreePlan) return false;

      // Category filter
      if (categoryFilter !== 'all' && platform.category !== categoryFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = platform.name.toLowerCase().includes(q);
        const matchEn = platform.bestForEn.toLowerCase().includes(q);
        const matchBn = platform.bestForBn.toLowerCase().includes(q);
        const matchPricing = platform.pricingEn.toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchBn && !matchPricing) return false;
      }

      return true;
    });
  }, [freePlanFilter, categoryFilter, searchQuery]);

  const handleCopyPrompt = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(text);
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch {}
  };

  const handleOpenWebsite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGeneratePrompt = () => {
    if (!promptTopic.trim()) return;
    const stylesMap: Record<string, string> = {
      cinematic: 'cinematic 35mm film lighting, award winning cinematography, golden hour, 4k 60fps, ultra-detailed',
      drone: 'spectacular 4k aerial drone view, smooth sweeping camera motion, high altitude panorama',
      anime: 'Makoto Shinkai aesthetic, glowing twilight colors, smooth 2D anime animation, high detail',
      '3d': 'Pixar 3D animated style, cute expressive character, raytraced ambient occlusion, octane render',
    };
    const styleDesc = stylesMap[promptStyle] || stylesMap.cinematic;
    setGeneratedPrompt(`${promptTopic.trim()}, ${styleDesc}, natural physics, smooth motion, no distortion, 8k quality`);
  };

  // Helper to render stylized brand icon badge
  const renderBrandLogo = (platform: AiVideoPlatform) => {
    switch (platform.id) {
      case 'synthesia':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
            <div className="w-4 h-3 rounded-xs border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        );
      case 'pictory':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
            🐙
          </div>
        );
      case 'runway':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-black text-xs shrink-0">
            R
          </div>
        );
      case 'invideo':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          </div>
        );
      case 'heygen':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            H▸
          </div>
        );
      case 'sora':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        );
      case 'filmora':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            ◆
          </div>
        );
      case 'capsule':
        return (
          <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center text-slate-900 font-black text-xs shrink-0">
            C
          </div>
        );
      case 'peech':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-black text-xs shrink-0">
            P
          </div>
        );
      case 'vyond':
        return (
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-serif font-black text-xs shrink-0">
            V
          </div>
        );
      case 'revid':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
            ◎
          </div>
        );
      case 'ltx':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-black text-xs shrink-0">
            LTX
          </div>
        );
      default:
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: platform.brandColor }}
          >
            <Video className="w-4 h-4 text-white" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* 1. TOP HEADER & HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-600/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              বিশ্বের সেরা এআই ভিডিও ডিরেক্টরি
            </span>
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-slate-300 hover:text-white transition px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                ← পেছনে যান
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="text-emerald-400">Top AI Video</span> Generators of 2025
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              বর্তমান বিশ্বের সব শীর্ষস্থানীয় এআই ভিডিও জেনারেটর তালিকা। 
              <span className="text-emerald-300 font-semibold"> যেকোনো টুলে ক্লিক করলেই সরাসরি তাদের অফিসিয়াল ওয়েবসাইটে নিয়ে যাবে</span>, যেখান থেকে আপনি সরাসরি ভিডিও তৈরি করতে পারবেন।
            </p>
          </div>

          {/* Quick Stat Highlights */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-300 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              মোট {AI_VIDEO_PLATFORMS.length} টি প্রিমিয়াম প্ল্যাটফর্ম
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              {AI_VIDEO_PLATFORMS.filter((p) => p.hasFreePlan).length} টি প্ল্যাটফর্মে ফ্রি প্ল্যান আছে
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-700/50 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-blue-400" />
              ১-ক্লিকে সরাসরি ওয়েবসাইট অ্যাক্সেস
            </span>
          </div>

          {onOpenInAppStudio && (
            <div className="pt-2">
              <button
                onClick={onOpenInAppStudio}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                স্মার্টহাব লোকাল অফলাইন এমপি৪ স্টুডিও খুলুন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. FILTER & CONTROLS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা কাজ দিয়ে খুঁজুন (যেমন: Synthesia, Avatar, Runway)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Free Plan Filter */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setFreePlanFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                freePlanFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              সবগুলো ({AI_VIDEO_PLATFORMS.length})
            </button>
            <button
              onClick={() => setFreePlanFilter('free_only')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                freePlanFilter === 'free_only'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              ফ্রি প্ল্যান আছে ({AI_VIDEO_PLATFORMS.filter((p) => p.hasFreePlan).length})
            </button>
            <button
              onClick={() => setFreePlanFilter('paid_only')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                freePlanFilter === 'paid_only'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <X className="w-3 h-3 text-rose-300" />
              পেইড / ট্রায়াল ({AI_VIDEO_PLATFORMS.filter((p) => !p.hasFreePlan).length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('table')}
              title="ইনফোগ্রাফিক টেবিল ভিউ"
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">টেবিল</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="কার্ড ভিউ"
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">কার্ড</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN DISPLAY: INFOGRAPHIC TABLE VIEW (MATCHING USER'S ATTACHED IMAGE) */}
      {viewMode === 'table' ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* TABLE HEADER (Identical to Upwork Infographic) */}
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-[260px] min-w-[200px]">Tool (টুল)</th>
                  <th className="py-4 px-4 sm:px-6 min-w-[240px]">Best for (উপযুক্ততা)</th>
                  <th className="py-4 px-4 sm:px-6 min-w-[220px]">Pricing (মূল্য)</th>
                  <th className="py-4 px-4 sm:px-6 text-center w-[120px] min-w-[100px]">Free plan?</th>
                  <th className="py-4 px-4 sm:px-6 text-right w-[140px] min-w-[120px]">Action</th>
                </tr>
              </thead>

              {/* TABLE BODY ROWS */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {filteredPlatforms.map((platform) => (
                  <tr
                    key={platform.id}
                    onClick={() => handleOpenWebsite(platform.url)}
                    className="group hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    {/* 1. TOOL COLUMN (Rank + Logo + Name) */}
                    <td className="py-4 px-4 sm:px-6 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-5 text-right shrink-0">
                          {platform.rank}.
                        </span>
                        {renderBrandLogo(platform)}
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {platform.name}
                          </span>
                          <span className="text-[11px] text-slate-400 group-hover:text-emerald-500 flex items-center gap-1 font-mono">
                            {new URL(platform.url).hostname}
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. BEST FOR COLUMN */}
                    <td className="py-4 px-4 sm:px-6 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-snug">
                          {platform.bestForEn}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {platform.bestForBn}
                        </span>
                      </div>
                    </td>

                    {/* 3. PRICING COLUMN */}
                    <td className="py-4 px-4 sm:px-6 align-middle">
                      <div className="flex flex-col gap-0.5 font-medium text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        <span>{platform.pricingEn}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          🎁 {platform.freePlanNoteBn}
                        </span>
                      </div>
                    </td>

                    {/* 4. FREE PLAN? BADGE (Circle check or cross, identical to image) */}
                    <td className="py-4 px-4 sm:px-6 align-middle text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {platform.hasFreePlan ? (
                          <div
                            title="Free plan available"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 group-hover:scale-110 transition-transform"
                          >
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div
                            title="No free plan (Trial or Paid only)"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm shadow-rose-500/30 group-hover:scale-110 transition-transform"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                          </div>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            platform.hasFreePlan
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          {platform.hasFreePlan ? 'হ্যাঁ (Free)' : 'না (Paid)'}
                        </span>
                      </div>
                    </td>

                    {/* 5. DIRECT ACTION BUTTON */}
                    <td className="py-4 px-4 sm:px-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyPrompt(platform.popularPrompt, platform.id, e)}
                          title="নমুনা প্রম্পট কপি করুন"
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          {copiedPromptId === platform.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <span>ওয়েবসাইট খুলুন</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPlatforms.length === 0 && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <HelpCircle className="w-8 h-8 text-slate-500" />
              <p className="text-sm font-semibold">আপনার ফিল্টারে কোনো এআই ভিডিও জেনারেটর পাওয়া যায়নি।</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFreePlanFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-xs text-emerald-500 font-bold hover:underline"
              >
                সব ফিল্টার রিসেট করুন
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 4. MODERN GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map((platform) => (
            <div
              key={platform.id}
              onClick={() => handleOpenWebsite(platform.url)}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between gap-4 group"
            >
              <div className="flex flex-col gap-3">
                {/* Header: Rank + Logo + Name + Free Plan Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                      #{platform.rank}
                    </span>
                    {renderBrandLogo(platform)}
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-500 transition-colors">
                        {platform.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new URL(platform.url).hostname}
                      </span>
                    </div>
                  </div>

                  {platform.hasFreePlan ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
                      <Check className="w-3 h-3 stroke-[2.5]" /> ফ্রি প্ল্যান
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-300 dark:border-rose-800">
                      <X className="w-3 h-3 stroke-[2.5]" /> পেইড
                    </span>
                  )}
                </div>

                {/* Best For */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Best for (উপযুক্ততা):
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {platform.bestForEn}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {platform.bestForBn}
                  </p>
                </div>

                {/* Pricing Details */}
                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">প্যাকেজ:</span>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 text-right">
                      {platform.pricingEn}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-medium">
                    🎁 {platform.freePlanNoteBn}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => handleCopyPrompt(platform.popularPrompt, platform.id, e)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedPromptId === platform.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> প্রম্পট কপি হয়েছে!
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
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <span>ওয়েবসাইটে যান</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. BONUS AI VIDEO PROMPT GENERATOR FOR CREATORS */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-white flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">এআই ভিডিও প্রম্পট মেকার (Prompt Generator)</h3>
              <p className="text-[11px] text-slate-400">
                যেকোনো আইডিয়া লিখুন — Kling, Runway, Sora, Luma এর উপযোগী হাই-কোয়ালিটি প্রম্পট তৈরি করে সরাসরি পেস্ট করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              placeholder="ভিডিওর বিষয় লিখুন (যেমন: সুন্দরবনে বাঘের নদী পারাপার, ড্রোন সিনেমাটিক ক্যামেরা)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={promptStyle}
              onChange={(e) => setPromptStyle(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="cinematic">সিনেমাটিক ও রিয়্যালিস্টিক (35mm)</option>
              <option value="drone">ড্রোন ক্যামেরা ভিউ (Aerial 4K)</option>
              <option value="anime">অ্যানিমে স্টাইল (Makoto Shinkai)</option>
              <option value="3d">থ্রিডি অ্যানিমেশন (Pixar/3D)</option>
            </select>
            <button
              type="button"
              disabled={!promptTopic.trim()}
              onClick={handleGeneratePrompt}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" /> প্রম্পট তৈরি করুন
            </button>
          </div>

          {generatedPrompt && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/60 flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400">
                  তৈরি করা প্রস্তুত প্রম্পট (Ready to Copy):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(generatedPrompt, 'generated-card')}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {copiedPromptId === 'generated-card' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> কপি সম্পন্ন!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> কপি করুন
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed select-all">
                {generatedPrompt}
              </p>
              <span className="text-[10px] text-slate-400">
                👉 উপরের টেবিল থেকে Kling AI, Runway, InVideo বা Luma-র "ওয়েবসাইট খুলুন" বাটনে ক্লিক করে এটি পেস্ট করলেই ফ্রি ভিডিও তৈরি হবে।
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
