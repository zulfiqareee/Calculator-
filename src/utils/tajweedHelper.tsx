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

/**
 * Common Quranic word dictionary for authentic Bengali transliteration with Tajweed markers
 */
const QURAN_WORD_DICTIONARY: Record<string, string> = {
  // Surah Al-Fatiha
  'بِسْمِ': 'বিস্মি',
  'اللَّهِ': 'ল্লা-হি',
  'اللّٰهِ': 'ল্লা-হি',
  'الله': 'আল্লাহ্',
  'الرَّحْمَٰنِ': 'র-রাহমা-নির',
  'الرَّحِيمِ': 'রাহী-ম',
  'الْحَمْدُ': 'আল-হামদু',
  'لِلَّهِ': 'লিল্লা-হি',
  'رَبِّ': 'রাব্বিল',
  'الْعَالَمِينَ': 'আ-লামী-ন',
  'مَالِكِ': 'মা-লিকি',
  'يَوْمِ': 'ইয়াওমিদ্-',
  'الدِّينِ': 'দী-ন',
  'إِيَّاكَ': 'ইয়্যা-কা',
  'نَعْبُدُ': 'না’বুদু',
  'وَإِيَّاكَ': 'ওয়া ইয়্যা-কা',
  'نَسْتَعِينُ': 'নাস্তাঈ-ন',
  'اهْدِنَا': 'ইহদিনাস্-',
  'الصِّرَاطَ': 'সিরা-ত্বাল',
  'الْمُسْتَقِيمَ': 'মুস্তাক্বী-ম',
  'صِرَاطَ': 'সিরা-ত্বাল্লাযীনা',
  'الَّذِينَ': 'আল্লাযী-না',
  'أَنْعَمْتَ': 'আন’আমতা',
  'عَلَيْهِمْ': 'আলাইহিম',
  'غَيْرِ': 'গাইরিল',
  'الْمَغْضُوبِ': 'মাগদূ-বি',
  'وَلَا': 'ওয়ালাদ্-',
  'الضَّالِّينَ': 'দ্বা~~~ল্লী-ন [৪ আলিফ লম্বা টান]',

  // Frequently occurring Quranic words
  'قُلْ': 'ক্বুলᶿ [কলকলাহ্]',
  'هُوَ': 'হুওয়াল্লা-হু',
  'أَحَدٌ': 'আহাদᶿ [দাল-এ কলকলাহ্]',
  'الصَّمَدُ': 'সামাদᶿ [কলকলাহ্]',
  'لَمْ': 'লাম',
  'يَلِدْ': 'ইয়ালিদᶿ [কলকলাহ্]',
  'وَلَمْ': 'ওয়া লাম',
  'يُولَدْ': 'ইউ-লাদᶿ [কলকলাহ্]',
  'يَكُن': 'ইয়াকুল-',
  'لَّهُ': 'লাহূ',
  'كُفُوًا': 'কুফুওয়ান',
  'أَعُوذُ': 'আঊ-যু',
  'بِرَبِّ': 'বিরাব্বিল',
  'الْفَلَقِ': 'ফালাক্বᶿ [কলকলাহ্]',
  'مِن': 'মিঙ্-',
  'شَرِّ': 'শাররি',
  'مَا': 'মা-',
  'خَلَقَ': 'খালাক্বᶿ [কলকলাহ্]',
  'غَاسِقٍ': 'গা-সিক্বিন',
  'إِذَا': 'ইযা-',
  'وَقَبَ': 'ওয়াক্বাবᶿ [কলকলাহ্]',
  'النَّفَّاثَاتِ': 'নাফ্ফা-ছা-তি [ওয়াজিব গুন্নাহ্]',
  'فِي': 'ফী',
  'الْعُقَدِ': 'উক্বাদᶿ [কলকলাহ্]',
  'حَاسِدٍ': 'হা-সিদিন',
  'حَسَدَ': 'হাসাদᶿ [কলকলাহ্]',
  'النَّاسِ': 'না-স [ওয়াজিব গুন্নাহ্]',
  'مَلِكِ': 'মালিকিন-',
  'إِلَٰهِ': 'ইলা-হিন-',
  'الْوَسْوَاسِ': 'ওয়াসওয়া-সিল',
  'الْخَنَّاسِ': 'খান্না-স [ওয়াজিব গুন্নাহ্]',
  'يُوَسْوِسُ': 'ইউওয়াসবিসু',
  'صُدُورِ': 'সুদূ-রিন-',
  'الْجِنَّةِ': 'জিন্নাতি [ওয়াজিব গুন্নাহ্]',
  'وَالنَّاسِ': 'ওয়ান-না-স [ওয়াজিব গুন্নাহ্]',
  'إِنَّ': 'ইন্-না [ওয়াজিব গুন্নাহ্]',
  'إِنَّا': 'ইন্-না~~~ [৪ আলিফ টান]',
  'أَعْطَيْنَاكَ': 'আ’ত্বয়না-কাল',
  'الْكَوْثَرَ': 'কাওছার',
  'فَصَلِّ': 'ফাসাল্লি',
  'لِرَبِّكَ': 'লিরাব্বিকা',
  'وَانْحَرْ': 'ওয়ানহার',
  'شَانِئَكَ': 'শা-নিআকা',
  'الْأَبْتَرُ': 'আবতার',
  'تَبَّتْ': 'তাব্বাত',
  'يَدَا': 'ইয়াদা~~~ [৪ আলিফ টান]',
  'أَبِي': 'আবী',
  'لَهَبٍ': 'লাহাবিও-',
  'وَتَبَّ': 'ওয়াতাব্বᶿ [কলকলাহ্]',
  'أَغْنَىٰ': 'আগনা-',
  'عَنْهُ': 'আনহু',
  'مَالُهُ': 'মা-লুহূ',
  'كَسَبَ': 'কাসাবᶿ [কলকলাহ্]',
  'سَيَصْلَىٰ': 'সাইয়াসলা-',
  'نَارًا': 'না-রান',
  'ذَاتَ': 'যা-তা',
  'وَامْرَأَتُهُ': 'ওয়ামরাআতুহূ',
  'حَمَّالَةَ': 'হাম্মা-লাতাল [ওয়াজিব গুন্নাহ্]',
  'الْحَطَبِ': 'হাতাবᶿ [কলকলাহ্]',
  'جِيدِهَا': 'জী-দিহা-',
  'حَبْلٌ': 'হাবলুম-',
  'مَّسَدٍ': 'মাসাদᶿ [কলকলাহ্]',
  'جَاءَ': 'জা~~~-আ [৪ আলিফ লম্বা টান]',
  'نَصْرُ': 'নাসরুল্লা-হি',
  'وَالْفَتْحُ': 'ওয়াল ফাতহ্',
  'وَرَأَيْتَ': 'ওয়ারাআইতান-',
  'يَدْخُلُونَ': 'ইয়াদখুলূ-না',
  'دِينِ': 'দী-নিল্লা-হি',
  'أَفْوَاجًا': 'আফওয়া-জা-',
  'فَسَبِّحْ': 'ফাসাব্বিহ',
  'بِحَمْدِ': 'বিহামদি',
  'وَاسْتَغْفِرْهُ': 'ওয়াসতাগফিরহু',
  'إِنَّهُ': 'ইন্নাহূ [ওয়াজিব গুন্নাহ্]',
  'كَانَ': 'কা-না',
  'تَوَّابًا': 'তাওওয়া-বা-',
  'تَبَارَكَ': 'তাবারাকাল্লাযী',
  'بِيَدِهِ': 'বিয়াদিহিল',
  'الْمُلْكُ': 'মুলকু',
  'وَهُوَ': 'ওয়াহুয়া',
  'عَلَىٰ': 'আলা-',
  'كُلِّ': 'কুল্লি',
  'قَدِيرٌ': 'ক্বাদী-র',
  'الْمَوْتَ': 'মাওতা',
  'وَالْحَيَاةَ': 'ওয়াল হায়া-তা',
};

/**
 * Phonetic transliteration from Arabic text to Bengali with Tajweed markers
 */
export function arabicToBengaliTajweed(arabic: string): string {
  if (!arabic || typeof arabic !== 'string') return '';

  // Clean Quranic decorative signs and numbers (ayah end marks ۝, waqf signs)
  const cleaned = arabic
    .replace(/[\u06D6-\u06ED\uFD3E\uFD3F]/g, '') // Waqf and ornament signs
    .replace(/[٠-٩\d]/g, '') // Arabic and Latin digits
    .trim();

  // Split into words
  const words = cleaned.split(/\s+/).filter(Boolean);

  const translatedWords = words.map((rawWord) => {
    // 1. Direct dictionary match
    const strippedWord = rawWord.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (QURAN_WORD_DICTIONARY[rawWord]) {
      return QURAN_WORD_DICTIONARY[rawWord];
    }
    if (QURAN_WORD_DICTIONARY[strippedWord]) {
      return QURAN_WORD_DICTIONARY[strippedWord];
    }

    // 2. Algorithmic transliteration for each Arabic word
    return transliterateArabicWord(rawWord);
  });

  return translatedWords.join(' ');
}

/**
 * Transliterates an individual Arabic word into Bengali with Tajweed rules
 */
function transliterateArabicWord(word: string): string {
  let result = '';
  const len = word.length;

  // Qalqalah letters: ق ط ب ج د
  const isQalqalahChar = (ch: string) => ['ق', 'ط', 'ب', 'ج', 'د'].includes(ch);

  let i = 0;
  while (i < len) {
    const char = word[i];
    const nextChar = i + 1 < len ? word[i + 1] : '';

    // Handle 4 Alif Long Madd (ٓ)
    if (char === '\u0653' || nextChar === '\u0653') {
      result += '~~~';
      if (nextChar === '\u0653') i++;
      i++;
      continue;
    }

    // Handle Dagger Alif (ٰ) - 1 Alif stretch
    if (char === '\u0670') {
      result += 'া-';
      i++;
      continue;
    }

    // Handle Shaddah on Noon (نّ) or Meem (مّ) - Wajib Ghunnah
    if (char === 'ن' && nextChar === '\u0651') {
      result += 'ন্-না [গুন্নাহ্]';
      i += 2;
      continue;
    }
    if (char === 'م' && nextChar === '\u0651') {
      result += 'ম্-মা [গুন্নাহ্]';
      i += 2;
      continue;
    }

    // Sukun on Qalqalah letters: ق, ط, ب, ج, د
    if (isQalqalahChar(char) && (nextChar === '\u0652' || nextChar === '\u06DF' || nextChar === '\u06E1')) {
      const qMap: Record<string, string> = {
        'ق': 'ক্বᶿ',
        'ط': 'ত্বᶿ',
        'ب': 'বᶿ',
        'ج': 'জᶿ',
        'د': 'দᶿ',
      };
      result += (qMap[char] || char) + ' [কলকলাহ্]';
      i += 2;
      continue;
    }

    // Standard Arabic letter mapping to Bengali
    let bnConsonant = '';
    switch (char) {
      case 'ا':
      case 'أ':
      case 'إ':
      case 'ٱ':
      case 'ء':
      case 'ئ':
      case 'ؤ':
        bnConsonant = result === '' ? 'আ' : '';
        break;
      case 'ب':
        bnConsonant = 'ব';
        break;
      case 'ت':
      case 'ة':
        bnConsonant = 'ত';
        break;
      case 'ث':
        bnConsonant = 'ছা';
        break;
      case 'ج':
        bnConsonant = 'জ';
        break;
      case 'ح':
        bnConsonant = 'হ';
        break;
      case 'خ':
        bnConsonant = 'খ';
        break;
      case 'د':
        bnConsonant = 'দ';
        break;
      case 'ذ':
        bnConsonant = 'য';
        break;
      case 'ر':
        bnConsonant = 'র';
        break;
      case 'ز':
        bnConsonant = 'য';
        break;
      case 'س':
        bnConsonant = 'স';
        break;
      case 'ش':
        bnConsonant = 'শ';
        break;
      case 'ص':
        bnConsonant = 'স';
        break;
      case 'ض':
        bnConsonant = 'দ্ব';
        break;
      case 'ط':
        bnConsonant = 'ত্ব';
        break;
      case 'ظ':
        bnConsonant = 'য';
        break;
      case 'ع':
        bnConsonant = '‘আ';
        break;
      case 'غ':
        bnConsonant = 'গ';
        break;
      case 'ف':
        bnConsonant = 'ফ';
        break;
      case 'ق':
        bnConsonant = 'ক্ব';
        break;
      case 'ك':
        bnConsonant = 'ক';
        break;
      case 'ل':
        bnConsonant = 'ল';
        break;
      case 'م':
        bnConsonant = 'ম';
        break;
      case 'ن':
        bnConsonant = 'ন';
        break;
      case 'ه':
        bnConsonant = 'হ';
        break;
      case 'و':
        bnConsonant = result === '' ? 'ওয়া' : 'উ';
        break;
      case 'ي':
      case 'ى':
        bnConsonant = result === '' ? 'ইয়া' : 'ঈ';
        break;

      // Diacritics
      case '\u064E': // Fatha ( َ )
        if (nextChar === 'ا' || nextChar === 'ى') {
          bnConsonant = 'া-';
          i++;
        } else {
          bnConsonant = result === '' || result.endsWith(' ') ? 'আ' : 'া';
        }
        break;

      case '\u0650': // Kasra ( ِ )
        if (nextChar === 'ي') {
          bnConsonant = 'ী-';
          i++;
        } else {
          bnConsonant = result === '' || result.endsWith(' ') ? 'ই' : 'ি';
        }
        break;

      case '\u064F': // Damma ( ُ )
        if (nextChar === 'و') {
          bnConsonant = 'ূ-';
          i++;
        } else {
          bnConsonant = result === '' || result.endsWith(' ') ? 'উ' : 'ু';
        }
        break;

      case '\u064B': // Tanween Fatha ( ً )
        bnConsonant = 'ান';
        break;
      case '\u064D': // Tanween Kasra ( ٍ )
        bnConsonant = 'িন';
        break;
      case '\u064C': // Tanween Damma ( ٌ )
        bnConsonant = 'ুন';
        break;

      case '\u0652': // Sukun ( ْ )
      case '\u06E1': // Quranic Sukun ( ۡ )
        bnConsonant = '্';
        break;

      case '\u0651': // Shaddah ( ّ )
        break;

      default:
        break;
    }

    if (bnConsonant) {
      result += bnConsonant;
    }

    i++;
  }

  return (
    result
      .replace(/্+/g, '্')
      .replace(/া+/g, 'া')
      .replace(/ি+/g, 'ি')
      .replace(/ু+/g, 'ু')
      .replace(/([ািুেো])্/g, '্')
      .trim() || word
  );
}

