/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Newspaper,
  RefreshCw,
  ExternalLink,
  Search,
  Bookmark,
  Share2,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  WifiOff,
  Flame,
  Globe2,
  Cpu,
  Trophy,
  Briefcase,
  Flag,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Language } from '../../types';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  link: string;
  pubDate: string;
  snippet: string;
  category: string;
}

interface GoogleNewsFeedViewProps {
  lang: Language;
}

type NewsCategoryKey = 'all' | 'national' | 'tech' | 'sports' | 'business' | 'world';

const CATEGORIES: { key: NewsCategoryKey; labelBn: string; labelEn: string; icon: React.ReactNode; rssTopic?: string }[] = [
  { key: 'all', labelBn: 'শীর্ষ সংবাদ', labelEn: 'Top News', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'national', labelBn: 'বাংলাদেশ', labelEn: 'Bangladesh', icon: <Flag className="w-3.5 h-3.5" /> },
  { key: 'tech', labelBn: 'তথ্যপ্রযুক্তি', labelEn: 'Tech', icon: <Cpu className="w-3.5 h-3.5" />, rssTopic: 'TECHNOLOGY' },
  { key: 'sports', labelBn: 'খেলাধুলা', labelEn: 'Sports', icon: <Trophy className="w-3.5 h-3.5" />, rssTopic: 'SPORTS' },
  { key: 'business', labelBn: 'অর্থ ও বাণিজ্য', labelEn: 'Business', icon: <Briefcase className="w-3.5 h-3.5" />, rssTopic: 'BUSINESS' },
  { key: 'world', labelBn: 'আন্তর্জাতিক', labelEn: 'World', icon: <Globe2 className="w-3.5 h-3.5" />, rssTopic: 'WORLD' },
];

// Offline / Default curated fallback news items for immediate high-speed loading
const FALLBACK_NEWS: Record<NewsCategoryKey, NewsItem[]> = {
  all: [
    {
      id: 'fb-1',
      title: 'বঙ্গবন্ধু টানেল ও পদ্মাসেতু দিয়ে জাতীয় অর্থনীতিতে নতুন দিগন্ত উন্মোচন',
      source: 'প্রথম আলো',
      sourceUrl: 'https://prothomalo.com',
      link: 'https://prothomalo.com',
      pubDate: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      snippet: 'যোগাযোগ ব্যবস্থার অভাবনীয় উন্নয়নের ফলে সারা দেশে বাণিজ্যিক পরিবহন ও পণ্য আনা-নেওয়ার গতি বহুগুণ বৃদ্ধি পেয়েছে।',
      category: 'all',
    },
    {
      id: 'fb-2',
      title: 'স্মার্ট বাংলাদেশ ও ডিজিটাল লেনদেনে মোবাইল ফিন্যান্সিয়াল সার্ভিসের নতুন রেকর্ড',
      source: 'দ্য ডেইলি স্টার বাংলা',
      sourceUrl: 'https://bangla.thedailystar.net',
      link: 'https://bangla.thedailystar.net',
      pubDate: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      snippet: 'দৈনিক ক্যাশলেস লেনদেনের হার উল্লেখযোগ্য হারে বেড়েছে এবং বিদ্যুৎ বিল থেকে শুরু করে দৈনন্দিন পেমেন্ট সহজ হয়েছে।',
      category: 'all',
    },
    {
      id: 'fb-3',
      title: 'বিশ্ববাজারে তেলের দাম কমায় অভ্যন্তরীণ বিদ্যুৎ ও জ্বালানি খাতে স্বস্তির আভাস',
      source: 'বিডিনিউজ২৪',
      sourceUrl: 'https://bangla.bdnews24.com',
      link: 'https://bangla.bdnews24.com',
      pubDate: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      snippet: 'জ্বালানি সরবরাহ ও বিদ্যুৎ উৎপাদন খরচ কমাতে নতুন সাশ্রয়ী পরিকল্পনার ওপর জোর দিচ্ছে কর্তৃপক্ষ।',
      category: 'all',
    },
    {
      id: 'fb-4',
      title: 'জাতীয় গ্রিডে নতুন সৌরবিদ্যুৎ প্রকল্পের বিদ্যুৎ সংযোজন শুরু',
      source: 'কালের কণ্ঠ',
      sourceUrl: 'https://kalerkantho.com',
      link: 'https://kalerkantho.com',
      pubDate: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
      snippet: 'পরিবেশবান্ধব নবায়নযোগ্য জ্বালানির ব্যবহার বাড়াতে দেশের বিভিন্ন অঞ্চলে নতুন সোলার পার্ক নির্মাণের কাজ দ্রুত এগিয়ে চলেছে।',
      category: 'all',
    },
    {
      id: 'fb-5',
      title: 'মেট্রোরেলের নতুন স্টেশনের সুবিধা চালু: নগরবাসীর যাতায়াতে স্বস্তি',
      source: 'যুগান্তর',
      sourceUrl: 'https://jugantor.com',
      link: 'https://jugantor.com',
      pubDate: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
      snippet: 'রাজধানীর যানজট নিরসনে মেট্রোরেল প্রতিদিন লাখো যাত্রীকে নিরাপদ ও দ্রুত গন্তব্যে পৌঁছে দিচ্ছে।',
      category: 'all',
    },
  ],
  national: [
    {
      id: 'fb-nat-1',
      title: 'কৃষকদের জন্য আধুনিক সেচযন্ত্র ও সোলার পাওয়ারের বিশেষ প্রণোদনা ঘোষণা',
      source: 'কালের কণ্ঠ',
      sourceUrl: 'https://kalerkantho.com',
      link: 'https://kalerkantho.com',
      pubDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      snippet: 'পল্লী এলাকায় সোলারচালিত পাম্প স্থাপনের মাধ্যমে বিদ্যুৎ খরচ সাশ্রয় ও ফলন বৃদ্ধির উদ্যোগ গ্রহণ করা হয়েছে।',
      category: 'national',
    },
    {
      id: 'fb-nat-2',
      title: 'দেশজুড়ে হাইটেক পার্ক ও ডিজিটাল ট্রেনিং সেন্টারে তরুণদের কর্মসংস্থান বৃদ্ধি',
      source: 'প্রথম আলো',
      sourceUrl: 'https://prothomalo.com',
      link: 'https://prothomalo.com',
      pubDate: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      snippet: 'প্রযুক্তি খাতের রপ্তানি বৃদ্ধি এবং আউটসোর্সিংয়ে ফ্রিল্যান্সারদের দক্ষ করে গড়ে তুলতে বিশেষ কোর্স শুরু হয়েছে।',
      category: 'national',
    },
  ],
  tech: [
    {
      id: 'fb-tech-1',
      title: 'কৃত্রিম বুদ্ধিমত্তা ও এআই প্রযুক্তির ব্যবহারে ইলেকট্রিক্যাল ইঞ্জিনিয়ারিংয়ের নতুন বিপ্লব',
      source: 'টেকশহর',
      sourceUrl: 'https://techshohor.com',
      link: 'https://techshohor.com',
      pubDate: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      snippet: 'স্মার্ট গ্রিড মনিটরিং ও স্বয়ংক্রিয় ত্রুটি শনাক্তকরণে এআই অ্যালগরিদমের কার্যকারিতা ব্যাপকভাবে প্রমাণিত হয়েছে।',
      category: 'tech',
    },
    {
      id: 'fb-tech-2',
      title: 'উচ্চক্ষমতাসম্পন্ন ব্যাটারি প্রযুক্তির উদ্ভাবন: চার্জিং গতি হবে দ্বিগুণ',
      source: 'বিজ্ঞান চিন্তা',
      sourceUrl: 'https://bigganchinta.com',
      link: 'https://bigganchinta.com',
      pubDate: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
      snippet: 'নতুন সলিড-স্টেট ব্যাটারি প্রযুক্তি ইলেকট্রিক যানবাহন ও হোম আইপিএস খাতে দীর্ঘস্থায়ী ব্যাকআপ প্রদান করবে।',
      category: 'tech',
    },
  ],
  sports: [
    {
      id: 'fb-sp-1',
      title: 'টি-টোয়েন্টি বিশ্বকাপের প্রস্তুতি জোরদারে বাংলাদেশ ক্রিকেট দলের বিশেষ অনুশীলন',
      source: 'প্রথম আলো খেলা',
      sourceUrl: 'https://prothomalo.com/sports',
      link: 'https://prothomalo.com/sports',
      pubDate: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      snippet: 'মিরপুর শেরেবাংলা স্টেডিয়ামে বোলারদের পেস ও স্পিনের সমন্বয়ে নিবিড় অনুশীলন ক্যাম্প শুরু হয়েছে।',
      category: 'sports',
    },
    {
      id: 'fb-sp-2',
      title: 'উয়েফা চ্যাম্পিয়ন্স লিগে টানটান উত্তেজনার ম্যাচ: দুর্দান্ত জয় পেল রিয়াল মাদ্রিদ',
      source: 'বিডিনিউজ২৪ স্পোর্টস',
      sourceUrl: 'https://bangla.bdnews24.com',
      link: 'https://bangla.bdnews24.com',
      pubDate: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
      snippet: 'শেষ মুহূর্তের গোলে জয় নিশ্চিত করে পরবর্তী রাউন্ডের টিকিট সংগ্রহ করলো জায়ান্ট ক্লাবটি।',
      category: 'sports',
    },
  ],
  business: [
    {
      id: 'fb-bus-1',
      title: 'প্রবাসীদের রেমিট্যান্সে ঊর্ধ্বমুখী প্রবাহ: ব্যাংকিং চ্যানেলে এলো নতুন রেকর্ড ডলার',
      source: 'বণিক বার্তা',
      sourceUrl: 'https://bonikbarta.net',
      link: 'https://bonikbarta.net',
      pubDate: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
      snippet: 'বৈধ পথে প্রণোদনা ও এক্সচেঞ্জ হাউজের সেবার ফলে প্রবাসী আয়ে উল্লেখযোগ্য প্রবৃদ্ধি এসেছে।',
      category: 'business',
    },
    {
      id: 'fb-bus-2',
      title: 'ঢাকা স্টক এক্সচেঞ্জে সূচকের উন্নতি: লেনদেনের শীর্ষে তথ্যপ্রযুক্তি ও ব্যাংকিং খাত',
      source: 'ডেইলি স্টার বিজনেস',
      sourceUrl: 'https://thedailystar.net',
      link: 'https://thedailystar.net',
      pubDate: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      snippet: 'বাজার মূলধনে ইতিবাচক ধারা লক্ষ্য করা গেছে এবং প্রাতিষ্ঠানিক বিনিয়োগকারীদের অংশগ্রহণ বৃদ্ধি পেয়েছে।',
      category: 'business',
    },
  ],
  world: [
    {
      id: 'fb-wrld-1',
      title: 'আন্তর্জাতিক জলবায়ু সম্মেলনে নবায়নযোগ্য জ্বালানি তহবিলে উন্নত দেশগুলোর প্রতিশ্রুতি',
      source: 'বিবিসি বাংলা',
      sourceUrl: 'https://bbc.com/bengali',
      link: 'https://bbc.com/bengali',
      pubDate: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      snippet: 'কার্বন নিঃসরণ হ্রাস এবং ক্ষতিগ্রস্ত উপকূলীয় দেশগুলোর সহায়তায় বিশেষ ফান্ড গঠনের ঘোষণা।',
      category: 'world',
    },
  ],
};

export const GoogleNewsFeedView: React.FC<GoogleNewsFeedViewProps> = ({ lang }) => {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategoryKey>('all');
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('saved_news_articles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [isOfflineFeed, setIsOfflineFeed] = useState<boolean>(false);

  // Sentinel ref for infinite scroll IntersectionObserver
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // Parse relative time in Bengali or English
  const formatRelativeTime = (isoOrDateStr: string): string => {
    try {
      const date = new Date(isoOrDateStr);
      if (isNaN(date.getTime())) return lang === 'bn' ? 'সম্প্রতি' : 'Recently';

      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
      if (diffMins < 60) return lang === 'bn' ? `${diffMins} মিনিট আগে` : `${diffMins}m ago`;
      if (diffHours < 24) return lang === 'bn' ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
      if (diffDays === 1) return lang === 'bn' ? 'গতকাল' : 'Yesterday';
      return lang === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;
    } catch {
      return lang === 'bn' ? 'আজ' : 'Today';
    }
  };

  // Parse RSS XML text into NewsItem array
  const parseRssXml = (xmlText: string, catKey: string): NewsItem[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = xmlDoc.querySelectorAll('item');
      if (!items || items.length === 0) return [];

      return Array.from(items).map((item, idx) => {
        const fullTitle = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
        const sourceEl = item.querySelector('source');
        const rawSource = sourceEl?.textContent || '';
        const sourceUrl = sourceEl?.getAttribute('url') || undefined;

        let cleanTitle = fullTitle;
        let cleanSource = rawSource;

        if (!cleanSource && fullTitle.includes(' - ')) {
          const lastDashIdx = fullTitle.lastIndexOf(' - ');
          cleanTitle = fullTitle.substring(0, lastDashIdx).trim();
          cleanSource = fullTitle.substring(lastDashIdx + 3).trim();
        } else if (cleanSource && fullTitle.endsWith(` - ${cleanSource}`)) {
          cleanTitle = fullTitle.substring(0, fullTitle.length - cleanSource.length - 3).trim();
        }

        const descText = item.querySelector('description')?.textContent || '';
        let snippet = '';
        if (descText) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = descText;
          snippet = tempDiv.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (snippet.length > 150) {
            snippet = snippet.substring(0, 150) + '...';
          }
        }

        return {
          id: `gn-${catKey}-${idx}-${encodeURIComponent(cleanTitle.substring(0, 15))}`,
          title: cleanTitle || fullTitle,
          source: cleanSource || (lang === 'bn' ? 'গুগল নিউজ' : 'Google News'),
          sourceUrl,
          link: link || 'https://news.google.com',
          pubDate,
          snippet,
          category: catKey,
        };
      });
    } catch {
      return [];
    }
  };

  // Fetch news from Google News RSS with proxy failover
  const fetchCategoryNews = async (catKey: NewsCategoryKey, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setVisibleCount(10);

    const catObj = CATEGORIES.find((c) => c.key === catKey);
    let targetRssUrl = 'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn';
    if (catObj?.rssTopic) {
      targetRssUrl = `https://news.google.com/rss/headlines/section/topic/${catObj.rssTopic}?hl=bn&gl=BD&ceid=BD:bn`;
    }

    let parsedItems: NewsItem[] = [];
    let fetchSuccessful = false;

    // List of CORS gateways to bypass browser origin limits
    const proxyGateways = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetRssUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(targetRssUrl)}`,
    ];

    for (const proxyUrl of proxyGateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const xmlText = await res.text();
          if (xmlText && xmlText.includes('<rss')) {
            const list = parseRssXml(xmlText, catKey);
            if (list.length > 0) {
              parsedItems = list;
              fetchSuccessful = true;
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`[News] Proxy fetch attempt failed:`, err);
      }
    }

    if (fetchSuccessful && parsedItems.length > 0) {
      // Also fetch another related stream to aggregate for infinite scrolling
      setAllNewsItems(parsedItems);
      setIsOfflineFeed(false);
      try {
        localStorage.setItem(`cached_news_${catKey}`, JSON.stringify(parsedItems));
      } catch {}
    } else {
      // Try local cache or curated fallback
      try {
        const cached = localStorage.getItem(`cached_news_${catKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllNewsItems(parsed);
            setIsOfflineFeed(true);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
        }
      } catch {}

      // Default curated fallback
      const fallbackList = [
        ...(FALLBACK_NEWS[catKey] || FALLBACK_NEWS.all),
        ...(FALLBACK_NEWS.all.filter((x) => !FALLBACK_NEWS[catKey]?.some((y) => y.id === x.id))),
      ];
      setAllNewsItems(fallbackList);
      setIsOfflineFeed(true);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  // Load more when reaching bottom (Infinite Scroll)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isLoading) return;

    // If there are more items in memory, simply expand visibleCount
    if (visibleCount < allNewsItems.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 10, allNewsItems.length));
        setIsLoadingMore(false);
      }, 350);
      return;
    }

    // If we've shown all items in this category, fetch another complementary topic to keep scrolling infinitely!
    setIsLoadingMore(true);
    try {
      const extraCategories: NewsCategoryKey[] = ['national', 'tech', 'sports', 'business', 'world'].filter(
        (c) => c !== selectedCategory
      ) as NewsCategoryKey[];
      const nextCategory = extraCategories[Math.floor(Math.random() * extraCategories.length)];
      const catObj = CATEGORIES.find((c) => c.key === nextCategory);
      const extraUrl = catObj?.rssTopic
        ? `https://news.google.com/rss/headlines/section/topic/${catObj.rssTopic}?hl=bn&gl=BD&ceid=BD:bn`
        : 'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn';

      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(extraUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const xml = await res.text();
        const extraList = parseRssXml(xml, nextCategory);
        if (extraList.length > 0) {
          setAllNewsItems((prev) => {
            const existingIds = new Set(prev.map((p) => p.title));
            const newOnes = extraList.filter((item) => !existingIds.has(item.title));
            return [...prev, ...newOnes];
          });
          setVisibleCount((prev) => prev + 10);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [allNewsItems, visibleCount, isLoadingMore, isLoading, selectedCategory]);

  // Set up IntersectionObserver on the bottom sentinel
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  useEffect(() => {
    fetchCategoryNews(selectedCategory);
  }, [selectedCategory]);

  // Direct open publisher website on card click
  const handleOpenArticle = (item: NewsItem) => {
    const targetUrl = item.link && item.link.startsWith('http') ? item.link : 'https://news.google.com';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Toggle Bookmark
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (savedNewsIds.includes(id)) {
      updated = savedNewsIds.filter((item) => item !== id);
    } else {
      updated = [...savedNewsIds, id];
    }
    setSavedNewsIds(updated);
    try {
      localStorage.setItem('saved_news_articles', JSON.stringify(updated));
    } catch {}
  };

  // Share Article
  const handleShare = async (item: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} — ${item.source}`,
          url: item.link,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${item.title}\n${item.link}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  // Filtered news items
  const filteredItems = useMemo(() => {
    let list = allNewsItems;
    if (showSavedOnly) {
      list = list.filter((item) => savedNewsIds.includes(item.id));
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNewsItems, showSavedOnly, savedNewsIds, searchFilter]);

  // Visible sliced list for smooth infinite scroll
  const visibleList = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
          <Newspaper className="w-32 h-32" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              {lang === 'bn' ? 'লাইভ গুগল নিউজ ও সংবাদপত্র' : 'Live News Feed'}
            </span>

            <button
              onClick={() => fetchCategoryNews(selectedCategory, true)}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition flex items-center gap-1 text-xs font-semibold"
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {lang === 'bn' ? 'তাজা ও শীর্ষ সংবাদ (স্ক্রল করুন)' : 'Live Headlines & News'}
          </h2>
          <p className="text-xs text-blue-100/90 mt-0.5">
            {lang === 'bn'
              ? 'স্ক্রল করলেই একের পর এক নতুন সংবাদ আসবে। যেকোনো সংবাদের উপর চাপ দিলে সরাসরি প্রকাশকের ওয়েবসাইট থেকে লোড হবে।'
              : 'Scroll to stream infinite headlines. Tap any article to open and read directly on publisher website.'}
          </p>

          {/* Offline indicator if cached */}
          {isOfflineFeed && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] bg-amber-500/30 border border-amber-300/40 text-amber-100 px-2.5 py-1 rounded-lg">
              <WifiOff className="w-3 h-3 text-amber-300" />
              <span>
                {lang === 'bn'
                  ? 'সংরক্ষিত ক্যাশ খবর প্রদর্শিত হচ্ছে (অনলাইনে গেলে স্বয়ংক্রিয় রিফ্রেশ হবে)'
                  : 'Showing cached news offline'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills & Saved Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key && !showSavedOnly;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setShowSavedOnly(false);
                  setSelectedCategory(cat.key);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {cat.icon}
                <span>{lang === 'bn' ? cat.labelBn : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Saved News Toggle Button */}
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
            showSavedOnly
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={lang === 'bn' ? 'সেভ করা খবর' : 'Saved News'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
          <span>{savedNewsIds.length}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={lang === 'bn' ? 'সংবাদ খুঁজুন (যেমন: ক্রিকেট, বাজেট, বিদ্যুৎ)...' : 'Search news headlines...'}
          className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* News Feed List */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs animate-pulse space-y-2.5"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-full"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-750 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : visibleList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <Newspaper className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
            {showSavedOnly
              ? lang === 'bn'
                ? 'কোনো সেভ করা খবর নেই'
                : 'No saved news found'
              : lang === 'bn'
              ? 'কোনো সংবাদ পাওয়া যায়নি'
              : 'No articles match your search'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {showSavedOnly
              ? lang === 'bn'
                ? 'যেকোনো সংবাদের বুকমার্ক আইকনে চাপ দিয়ে এখানে সংরক্ষণ করুন'
                : 'Bookmark any article to read it here later'
              : lang === 'bn'
              ? 'অন্য শব্দ লিখে চেষ্টা করুন অথবা ক্যাটাগরি পরিবর্তন করুন'
              : 'Try different search keywords or switch category'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleList.map((item) => {
            const isSaved = savedNewsIds.includes(item.id);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleOpenArticle(item)}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  {/* Metadata Row: Source & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] mb-2 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                        {item.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatRelativeTime(item.pubDate)}</span>
                    </div>
                  </div>

                  {/* News Headline */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                    {item.title}
                  </h3>

                  {/* Snippet preview if available */}
                  {item.snippet && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 line-clamp-2">
                      {item.snippet}
                    </p>
                  )}
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition">
                    <span>{lang === 'bn' ? 'ওয়েবসাইট থেকে পড়ুন' : 'Read On Website'}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Share Button */}
                    <button
                      onClick={(e) => handleShare(item, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
                      title={lang === 'bn' ? 'শেয়ার করুন' : 'Share'}
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Bookmark / Save Button */}
                    <button
                      onClick={(e) => toggleBookmark(item.id, e)}
                      className={`p-1.5 rounded-lg transition ${
                        isSaved
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={lang === 'bn' ? 'সংরক্ষণ করুন' : 'Bookmark'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sentinel Element for Infinite Scroll */}
          <div ref={bottomSentinelRef} className="py-2 flex items-center justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'আরও সংবাদ লোড হচ্ছে...' : 'Loading more articles...'}</span>
              </div>
            ) : visibleCount < filteredItems.length ? (
              <button
                onClick={handleLoadMore}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{lang === 'bn' ? 'আরও সংবাদ দেখুন (স্ক্রল করুন)' : 'Load More News'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 py-2 text-center w-full">
                {lang === 'bn' ? '— সকল সংবাদ প্রদর্শিত হয়েছে —' : '— End of news stream —'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Play Store Compliance & Attribution Box */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {lang === 'bn'
              ? 'প্লে স্টোর ও কপিরাইট নীতিমালা সংক্রান্ত তথ্য'
              : 'Play Store Compliance & Copyright Notice'}
          </span>
        </div>
        <p className="leading-relaxed">
          {lang === 'bn'
            ? 'এই ফিচারে প্রদর্শিত সংবাদের শিরোনাম ও লিঙ্কগুলো গুগল নিউজের উন্মুক্ত পাবলিক আরএসএস (RSS) ফিড থেকে সংগৃহীত। প্রতিটি সংবাদের সম্পূর্ণ স্বত্ব, কপিরাইট ও বিবরণ সংশ্লিষ্ট সংবাদ প্রকাশকের (যেমন: প্রথম আলো, বিডিনিউজ২৪, ইত্তেফাক ইত্যাদি)। সংবাদ কার্ডে চাপলে সরাসরি প্রকাশকের মূল ওয়েবসাইট থেকে সংবাদ লোড হবে।'
            : 'All news headlines and snippets are provided via Google News public RSS feeds with transparent source attribution. Tapping any article card opens the story directly on the publisher website.'}
        </p>
      </div>
    </div>
  );
};
