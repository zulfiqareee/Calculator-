import React from 'react';

/**
 * Tajweed rule types for Bengali pronunciation rendering
 */
export interface TajweedRule {
  type: 'madd_long' | 'madd_normal' | 'ghunnah' | 'qalqalah';
  titleBn: string;
  descBn: string;
  symbol: string;
  colorClass: string;
  bgClass: string;
}

export const TAJWEED_RULES: Record<string, TajweedRule> = {
  madd_long: {
    type: 'madd_long',
    titleBn: '৪ আলিফ লম্বা টান (মাদ্দে লাযিম/মুত্তাসিল)',
    descBn: 'এখানে ৩ থেকে ৪ সেকেন্ড লম্বা করে টেনে পড়তে হবে। যেমন: জা~~~-আ, ওয়ালা-দ্-দ্বা~~~ল্লী-ন।',
    symbol: '〰️ 8x',
    colorClass: 'text-rose-600 dark:text-rose-400 font-black',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900',
  },
  madd_normal: {
    type: 'madd_normal',
    titleBn: '১ আলিফ স্বাভাবিক টান (মাদ্দে আসলি)',
    descBn: 'স্বাভাবিক ১ আলিফ (১ সেকেন্ড) পরিমাণ টেনে পড়তে হবে। শব্দের মাঝে আ-, ঈ-, ঊ- হাইফেন দেওয়া আছে।',
    symbol: '➖ 1x',
    colorClass: 'text-sky-600 dark:text-sky-400 font-bold',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900',
  },
  ghunnah: {
    type: 'ghunnah',
    titleBn: 'ওয়াজিব গুন্নাহ্ (নাক দিয়ে গুঞ্জন)',
    descBn: 'নাক থেকে ১ আলিফ পরিমাণ গুঞ্জন করে পড়তে হবে। যেমন: ইন্‌ন্না, আম্মা, মিন-শাররি।',
    symbol: '👃 গুন্নাহ্',
    colorClass: 'text-emerald-700 dark:text-emerald-300 font-bold',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800',
  },
  qalqalah: {
    type: 'qalqalah',
    titleBn: 'কলকলাহ্ (প্রতিধ্বনি সৃষ্টি করা)',
    descBn: 'ক্বাফ, ত্বা, বা, জীম, দাল (ق ط ب ج د) হরফে সাকিন হলে প্রতিধ্বনি দিয়ে ধাক্কা দিয়ে পড়তে হবে। যেমন: আহাদᶿ, ফালাক্বᶿ।',
    symbol: '⚡ কলকলাহ্',
    colorClass: 'text-amber-700 dark:text-amber-300 font-bold',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',
  },
};

/**
 * Parses and highlights Bengali pronunciation text with Tajweed annotations
 */
export function renderTajweedBengaliText(text: string, enabled: boolean = true): React.ReactNode {
  if (!text) return null;
  if (!enabled) return text;

  // Split by whitespace to preserve word structure
  const words = text.split(' ');

  return (
    <span className="leading-relaxed inline">
      {words.map((word, wIdx) => {
        const isLongMadd = word.includes('~~~') || word.includes('৪ আলিফ');
        const isGhunnah = word.includes('[গুন্নাহ') || word.includes('ইন্‌ন্না') || word.includes('মিঙ্-');
        const isQalqalah = word.includes('[কলকলাহ') || word.includes('ᶿ');
        const has1Alif = !isLongMadd && (word.includes('আ-') || word.includes('ঈ-') || word.includes('ঊ-') || word.includes('লা-') || word.includes('মা-') || word.includes('রা-'));

        let customStyle = '';
        let badge: string | null = null;

        if (isLongMadd) {
          customStyle = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1 py-0.5 rounded-md font-bold underline decoration-wavy decoration-rose-400';
          badge = '৪ আলিফ';
        } else if (isGhunnah) {
          customStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded-md font-bold';
          badge = 'গুন্নাহ্';
        } else if (isQalqalah) {
          customStyle = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1 py-0.5 rounded-md font-bold';
          badge = 'কলকলাহ্';
        } else if (has1Alif) {
          customStyle = 'text-sky-700 dark:text-sky-300 font-semibold';
        }

        return (
          <span key={wIdx} className="inline-block mr-1 my-0.5">
            {customStyle ? (
              <span className={customStyle}>
                {word}
                {badge && (
                  <span className="ml-1 text-[9px] font-black uppercase px-1 py-0.2 rounded-full bg-black/10 dark:bg-white/10 no-underline inline-block align-middle">
                    {badge}
                  </span>
                )}
              </span>
            ) : (
              <span>{word}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
