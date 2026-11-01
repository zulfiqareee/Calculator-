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
    descBn: 'এখানে ৩ থেকে ৪ সেকেন্ড লম্বা করে টেনে পড়তে হবে। যেমন: জা-আ, ওয়ালাদ্-দ্বাল্লীন।',
    symbol: '〰️ ৪ আলিফ',
    colorClass: 'text-rose-600 dark:text-rose-400 font-bold',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900',
  },
  madd_normal: {
    type: 'madd_normal',
    titleBn: '১ আলিফ স্বাভাবিক টান (মাদ্দে আসলি)',
    descBn: 'স্বাভাবিক ১ আলিফ (১ সেকেন্ড) পরিমাণ টেনে পড়তে হবে। যেমন: আ-, ঈ-, ঊ-।',
    symbol: '➖ ১ আলিফ',
    colorClass: 'text-sky-600 dark:text-sky-400 font-bold',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900',
  },
  ghunnah: {
    type: 'ghunnah',
    titleBn: 'ওয়াজিব গুন্নাহ্ (নাক দিয়ে গুঞ্জন)',
    descBn: 'নাক থেকে ১ আলিফ পরিমাণ গুঞ্জন করে পড়তে হবে। যেমন: ইন্না, আম্মা, মিম্মা।',
    symbol: '👃 গুন্নাহ্',
    colorClass: 'text-emerald-700 dark:text-emerald-300 font-bold',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800',
  },
  qalqalah: {
    type: 'qalqalah',
    titleBn: 'কলকলাহ্ (প্রতিধ্বনি সৃষ্টি করা)',
    descBn: 'ক্বাফ, ত্বা, বা, জীম, দাল (ق ط ب ج د) হরফে সাকিন হলে প্রতিধ্বনি সৃষ্টি করে পড়তে হবে। যেমন: আহাদ, ফালাক্ব।',
    symbol: '⚡ কলকলাহ্',
    colorClass: 'text-amber-700 dark:text-amber-300 font-bold',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800',
  },
};

/**
 * Strips legacy tags, broken tildes, brackets, and footnote marks to ensure 100% clean Bengali spelling
 */
export function cleanBengaliPronunciation(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[[^\]]*\]/g, '') // remove bracket tags like [কলকলাহ্], [গুন্নাহ্], [৪ আলিফ টান]
    .replace(/[~ᶿ〰️➖👃⚡]/g, '') // remove decorative symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses and highlights Bengali pronunciation text with clean Tajweed styling (no bracket clutter)
 */
export function renderTajweedBengaliText(text: string, enabled: boolean = true): React.ReactNode {
  if (!text) return null;
  const cleanText = cleanBengaliPronunciation(text);
  if (!enabled || !cleanText) return cleanText;

  const words = cleanText.split(' ').filter(Boolean);

  return (
    <span className="leading-relaxed inline font-normal">
      {words.map((word, wIdx) => {
        const isGhunnah = /ইন্না|আম্মা|মিম্মা|ইন্নাহূ|হাম্মা|খান্না|জিন্না/.test(word);
        const isQalqalah = /আহাদ$|ফালাক্ব$|খালাক্ব$|ওয়াক্বাব$|উক্বাদ$|হাসাদ$|ইয়ালিদ$|ইউলাদ$|সামাদ$|আবতার$|ফাতহ$/.test(word);
        const isLongMadd = /দ্বাল্লীন|জা-আ|মা-আ|সিরা-ত্বাল্লাযীনা|আলিফ-লাম-মীম/.test(word);
        const has1Alif = !isLongMadd && (word.includes('আ-') || word.includes('ঈ-') || word.includes('ঊ-') || word.includes('লা-') || word.includes('মা-') || word.includes('রা-'));

        let styleClass = '';
        if (isLongMadd) {
          styleClass = 'text-rose-600 dark:text-rose-400 font-semibold underline decoration-rose-300 decoration-1 underline-offset-2';
        } else if (isGhunnah) {
          styleClass = 'text-emerald-700 dark:text-emerald-300 font-semibold';
        } else if (isQalqalah) {
          styleClass = 'text-amber-700 dark:text-amber-300 font-semibold';
        } else if (has1Alif) {
          styleClass = 'text-sky-700 dark:text-sky-300';
        }

        return (
          <span key={wIdx} className="inline-block mr-1.5 my-0.5">
            {styleClass ? <span className={styleClass}>{word}</span> : <span>{word}</span>}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Muqatta'at (huruf muqatta'at) authentic names
 */
const MUQATTAAT_MAP: Record<string, string> = {
  'الٓمٓ': 'আলিফ-লাম-মীম',
  'الم': 'আলিফ-লাম-মীম',
  'الٓمٓصٓ': 'আলিফ-লাম-মীম-সোয়াদ',
  'المص': 'আলিফ-লাম-মীম-সোয়াদ',
  'الٓر': 'আলিফ-লাম-রা',
  'الر': 'আলিফ-লাম-রা',
  'الٓمٓر': 'আলিফ-লাম-মীম-রা',
  'المر': 'আলিফ-লাম-মীম-রা',
  'كٓهٰيٰعٓصٓ': 'কাফ-হা-ইয়া-আইন-সোয়াদ',
  'كهيعص': 'কাফ-হা-ইয়া-আইন-সোয়াদ',
  'طٰهٰ': 'ত্বা-হা',
  'طه': 'ত্বা-হা',
  'طٰسٓمٓ': 'ত্বা-সীন-মীম',
  'طسم': 'ত্বা-সীন-মীম',
  'طٰسٓ': 'ত্বা-সীন',
  'طس': 'ত্বা-সীন',
  'يٰسٓ': 'ইয়া-সীন',
  'يس': 'ইয়া-সীন',
  'صٓ': 'সোয়াদ',
  'ص': 'সোয়াদ',
  'حٰمٓ': 'হা-মীম',
  'حم': 'হা-মীম',
  'عٓسٓقٓ': 'আইন-সীন-ক্বাফ',
  'عسق': 'আইন-সীন-ক্বাফ',
  'قٓ': 'ক্বাফ',
  'ق': 'ক্বাফ',
  'نٓ': 'নূন',
  'ن': 'নূন',
};

/**
 * Authentic Bengali word pronunciations for common Quranic words
 */
const QURAN_WORD_DICTIONARY: Record<string, string> = {
  ...MUQATTAAT_MAP,

  // Surah Al-Fatiha
  'بِسْمِ': 'বিসমিল্লাহির',
  'اللَّهِ': 'আল্লাহির',
  'اللّٰهِ': 'আল্লাহির',
  'الله': 'আল্লাহ্',
  'اللَّهُ': 'আল্লাহু',
  'الرَّحْمَٰنِ': 'রাহমানির',
  'الرَّحِيمِ': 'রাহীম',
  'الْحَمْدُ': 'আল-হামদু',
  'لِلَّهِ': 'লিল্লাহি',
  'رَبِّ': 'রাব্বিল',
  'الْعَالَمِينَ': 'আলামীন',
  'مَالِكِ': 'মালিকি',
  'يَوْمِ': 'ইয়াওমিদ্-',
  'الدِّينِ': 'দীন',
  'إِيَّاكَ': 'ইয়্যাকা',
  'نَعْبُدُ': 'না’বুদু',
  'وَإِيَّاكَ': 'ওয়া ইয়্যাকা',
  'نَسْتَعِينُ': 'নাস্তাঈন',
  'اهْدِنَا': 'ইহদিনাস্-',
  'الصِّرَاطَ': 'সিরাত্বাল',
  'الْمُسْتَقِيمَ': 'মুস্তাক্বীম',
  'صِرَاطَ': 'সিরাত্বাল্লাযীনা',
  'الَّذِينَ': 'আল্লাযীনা',
  'أَنْعَمْتَ': 'আন’আমতা',
  'عَلَيْهِمْ': 'আলাইহিম',
  'غَيْرِ': 'গাইরিল',
  'الْمَغْضُوبِ': 'মাগদূবি',
  'وَلَا': 'ওয়ালাদ্-',
  'الضَّالِّينَ': 'দ্বাল্লীন',

  // Surah Al-Ikhlas, Falaq, Nas
  'قُلْ': 'ক্বুল',
  'هُوَ': 'হুওয়া',
  'أَحَدٌ': 'আহাদ',
  'الصَّمَدُ': 'সামাদ',
  'لَمْ': 'লাম',
  'يَلِدْ': 'ইয়ালিদ',
  'وَلَمْ': 'ওয়া লাম',
  'يُولَدْ': 'ইউলাদ',
  'يَكُن': 'ইয়াকুল-',
  'لَّهُ': 'লাহূ',
  'كُفُوًا': 'কুফুওয়ান',
  'أَعُوذُ': 'আউযু',
  'بِرَبِّ': 'বিরাব্বিল',
  'الْفَلَقِ': 'ফালাক্ব',
  'مِن': 'মিন',
  'شَرِّ': 'শাররি',
  'مَا': 'মা',
  'خَلَقَ': 'খালাক্ব',
  'غَاسِقٍ': 'গাসিক্বিন',
  'إِذَا': 'ইযা',
  'وَقَبَ': 'ওয়াক্বাব',
  'النَّفَّاثَاتِ': 'নাফ্ফাছাতি',
  'فِي': 'ফী',
  'الْعُقَدِ': 'উক্বাদ',
  'حَاسِدٍ': 'হাসিদিন',
  'حَسَدَ': 'হাসাদ',
  'النَّاسِ': 'নাস',
  'مَلِكِ': 'মালিকিন-',
  'إِلَٰهِ': 'ইলাহিন-',
  'الْوَسْوَاسِ': 'ওয়াসওয়াসিল',
  'الْخَنَّاسِ': 'খান্নাস',
  'يُوَسْوِسُ': 'ইউওয়াসবিসু',
  'صُدُورِ': 'সুদূরিন-',
  'الْجِنَّةِ': 'জিন্নাতি',
  'وَالنَّاسِ': 'ওয়ান-নাস',
  'إِنَّ': 'ইন্না',
  'إِنَّا': 'ইন্না',
  'أَعْطَيْنَاكَ': 'আ’ত্বয়না-কাল',
  'الْكَوْثَرَ': 'কাওসার',
  'فَصَلِّ': 'ফাসাল্লি',
  'لِرَبِّكَ': 'লিরাব্বিকা',
  'وَانْحَرْ': 'ওয়ানহার',
  'شَانِئَكَ': 'শানিআকা',
  'الْأَبْتَرُ': 'আবতার',
  'تَبَّتْ': 'তাব্বাত',
  'يَدَا': 'ইয়াদা',
  'أَبِي': 'আবী',
  'لَهَبٍ': 'লাহাবিও-',
  'وَتَبَّ': 'ওয়াতাব্ব',
  'أَغْنَىٰ': 'আগনা',
  'عَنْهُ': 'আনহু',
  'مَالُهُ': 'মালুহূ',
  'كَسَبَ': 'কাসাব',
  'سَيَصْلَىٰ': 'সাইয়াসলা',
  'نَارًا': 'নারান',
  'ذَاتَ': 'যাতা',
  'وَامْرَأَتُهُ': 'ওয়ামরাআতুহূ',
  'حَمَّالَةَ': 'হাম্মা-লাতাল',
  'الْحَطَبِ': 'হাতাব',
  'جِيدِهَا': 'জীদিহা',
  'حَبْلٌ': 'হাবলুম-',
  'مَّسَدٍ': 'মাসাদ',
  'جَاءَ': 'জা-আ',
  'نَصْرُ': 'নাসরুল্লাহি',
  'وَالْفَتْحُ': 'ওয়াল ফাতহ্',
  'وَرَأَيْتَ': 'ওয়ারাআইতান-',
  'يَدْخُلُونَ': 'ইয়াদখুলূনা',
  'دِينِ': 'দীনিল্লাহি',
  'أَفْوَاجًا': 'আফওয়াজা',
  'فَسَبِّحْ': 'ফাসাব্বিহ',
  'بِحَمْدِ': 'বিহামদি',
  'وَاسْتَغْفِرْهُ': 'ওয়াসতাগফিরহু',
  'إِنَّهُ': 'ইন্নাহূ',
  'كَانَ': 'কানা',
  'تَوَّابًا': 'তাওওয়াবা',
  'تَبَارَكَ': 'তাবারাকাল্লাযী',
  'بِيَدِهِ': 'বিয়াদিহিল',
  'الْمُلْكُ': 'মুলকু',
  'وَهُوَ': 'ওয়াহুওয়া',
  'عَلَىٰ': 'আলা',
  'كُلِّ': 'কুল্লি',
  'قَدِيرٌ': 'ক্বদীর',
  'الْمَوْتَ': 'মাওতা',
  'وَالْحَيَاةَ': 'ওয়াল হায়াতা',
};

/**
 * Convert international English Quranic transliteration to 100% authentic Bengali pronunciation
 */
export function quranTransToBengali(trans: string): string {
  if (!trans || typeof trans !== 'string') return '';

  let text = trans.replace(/<[^>]*>/g, '').trim();

  // Common complete phrases shortcuts
  const exactPhrases: [RegExp, string][] = [
    [/^Bismillaahir Rahmaanir Raheem/i, 'বিসমিল্লাহির রাহমানির রাহীম'],
    [/^Alhamdu lillaahi Rabbil [\'’]?aalameen/i, 'আলহামদু লিল্লাহি রাব্বিল আলামীন'],
    [/^Ar-?Rahmaanir-?Raheem/i, 'আর-রাহমানির রাহীম'],
    [/^Maaliki Yawmid-?Deen/i, 'মালিকি ইয়াওমিদ্দীন'],
    [/^Iyyaaka na[\'’]budu wa [Il]yyaaka nasta[\'’]een/i, 'ইয়্যাকা না’বুদু ওয়া ইয়্যাকা নাস্তাঈন'],
    [/^Ihdinas-?Siraatal-?Mustaqeem/i, 'ইহদিনাস সিরাতাল মুস্তাক্বীম'],
    [/^Alif-?Laa+m-?Mee+m/i, 'আলিফ-লাম-মীম'],
    [/^Qul Huwal-?laahu Ahad/i, 'ক্বুল হুওয়াল্লাহু আহাদ'],
    [/^Qul Huwallahu Ahad/i, 'ক্বুল হুওয়াল্লাহু আহাদ'],
    [/^Allaahus-?Samad/i, 'আল্লাহুস সামাদ'],
    [/^Allahus-?Samad/i, 'আল্লাহুস সামাদ'],
    [/^Lam yalid wa lam yoolad/i, 'লাম ইয়ালিদ ওয়া লাম ইউলাদ'],
    [/^Wa lam yakul-?lahu+ kufuwan ahad/i, 'ওয়া লাম ইয়াকুল্লাহু কুফুওয়ান আহাদ'],
  ];

  for (const [re, bn] of exactPhrases) {
    if (re.test(text)) {
      text = text.replace(re, bn);
    }
  }

  const words = text.split(/\s+/);
  const converted = words.map((rawWord) => {
    // If already in Bengali, keep as is
    if (/[\u0980-\u09FF]/.test(rawWord)) return rawWord;

    let w = rawWord;
    let punctuation = '';
    const punctMatch = w.match(/[;,\.:\?!]+$/);
    if (punctMatch) {
      punctuation = punctMatch[0];
      w = w.slice(0, -punctuation.length);
    }

    const wordDict: Record<string, string> = {
      'alif-laaam-meeem': 'আলিফ-লাম-মীম',
      'zaalikal': 'যালিকাল',
      'dhaalikal': 'যালিকাল',
      'kitaabu': 'কিতাবু',
      'al-kitaabu': 'আল-কিতাবু',
      'alkitaabu': 'আল-কিতাবু',
      'laa': 'লা',
      'raiba': 'রাইবা',
      'feeh': 'ফীহি',
      'feehi': 'ফীহি',
      'udal': 'হুদাল',
      'hudan': 'হুদান',
      'hudallil': 'হুদাল্লিল',
      'lilmuttaqeen': 'লিলমুত্তাক্বীন',
      'allazeena': 'আল্লাযীনা',
      'yu\'minoona': 'ইউ’মিনূনা',
      'bilghaibi': 'বিল-গাইবি',
      'wa': 'ওয়া',
      'yuqeemoonas': 'ইউকীমূনাস',
      'salaata': 'সালাতা',
      'mimmaa': 'মিম্মা',
      'razaqnaahum': 'রাযাক্বনাহুম',
      'yunfiqoon': 'ইউনফিক্বূন',
      'qul': 'ক্বুল',
      'a\'oozu': 'আঊযু',
      'birabbil-falaq': 'বিরাব্বিল ফালাক্ব',
      'birabbin-naas': 'বিরাব্বিন নাস',
      'min': 'মিন',
      'sharri': 'শাররি',
      'maa': 'মা',
      'khalaq': 'খালাক্ব',
      'ghaasiqin': 'গাসিক্বিন',
      'izaa': 'ইযা',
      'waqab': 'ওয়াক্বাব',
      'fil': 'ফিল',
      'uqad': 'উক্বাদ',
      'hasad': 'হাসাদ',
      'haasidin': 'হাসিদিন',
      'malikin-naas': 'মালিকিন-নাস',
      'ilaahin-naas': 'ইলাহিন-নাস',
      'waswaasil-khannaas': 'ওয়াসওয়াসিল খান্নাস',
      'sudoorin-naas': 'সুদূরিন-নাস',
      'minal-jinnati': 'মিনাল জিন্নাতি',
      'wan-naas': 'ওয়ান-নাস',
    };

    const cleanLower = w.toLowerCase().replace(/[\(\)]/g, '');
    if (wordDict[cleanLower]) {
      return wordDict[cleanLower] + punctuation;
    }

    let s = cleanLower;
    // Prefix replacements
    s = s
      .replace(/^al-/g, 'আল-')
      .replace(/^bil-/g, 'বিল-')
      .replace(/^wal-/g, 'ওয়াল-')
      .replace(/^fil-/g, 'ফিল-')
      .replace(/^lil-/g, 'লিল-')
      .replace(/^bir-/g, 'বির-')
      .replace(/^war-/g, 'ওয়ার-')
      .replace(/^ar-/g, 'আর-')
      .replace(/^an-/g, 'আন-')
      .replace(/^as-/g, 'আস-')
      .replace(/^az-/g, 'আয-')
      .replace(/^ad-/g, 'আদ-')
      .replace(/^at-/g, 'আত-');

    s = s
      .replace(/aa+/g, 'া')
      .replace(/ee+/g, 'ী')
      .replace(/oo+/g, 'ূ')
      .replace(/ai/g, 'াই')
      .replace(/ay/g, 'ায়')
      .replace(/kh/g, 'খ')
      .replace(/gh/g, 'গ')
      .replace(/sh/g, 'শ')
      .replace(/th/g, 'ছ')
      .replace(/dh/g, 'য')
      .replace(/zh/g, 'য')
      .replace(/q/g, 'ক্ব')
      .replace(/k/g, 'ক')
      .replace(/b/g, 'ব')
      .replace(/t/g, 'ত')
      .replace(/j/g, 'জ')
      .replace(/h/g, 'হ')
      .replace(/d/g, 'দ')
      .replace(/r/g, 'র')
      .replace(/z/g, 'য')
      .replace(/s/g, 'স')
      .replace(/f/g, 'ফ')
      .replace(/l/g, 'ল')
      .replace(/m/g, 'ম')
      .replace(/n/g, 'ন')
      .replace(/w/g, 'ওয়')
      .replace(/v/g, 'ভ')
      .replace(/y/g, 'ইয়')
      .replace(/['’]/g, '’')
      .replace(/a/g, 'া')
      .replace(/i/g, 'ি')
      .replace(/u/g, 'ু');

    // Fix leading vowel marks
    s = s
      .replace(/^া/, 'আ')
      .replace(/^ি/, 'ই')
      .replace(/^ী/, 'ঈ')
      .replace(/^ু/, 'উ')
      .replace(/^ূ/, 'ঊ')
      .replace(/^ে/, 'এ')
      .replace(/^ো/, 'ও');

    return s + punctuation;
  });

  return converted.join(' ');
}

/**
 * Phonetic transliteration from Arabic text to Bengali with pristine spelling
 */
export function arabicToBengaliTajweed(arabic: string): string {
  if (!arabic || typeof arabic !== 'string') return '';

  // Check Muqatta'at first
  const cleanWhole = arabic.replace(/[\u06D6-\u06ED\uFD3E\uFD3F\uFEFF]/g, '').trim();
  if (MUQATTAAT_MAP[cleanWhole]) {
    return MUQATTAAT_MAP[cleanWhole];
  }

  // Clean Quranic decorative signs and numbers
  const cleaned = arabic
    .replace(/[\u06D6-\u06ED\uFD3E\uFD3F\uFEFF]/g, '')
    .replace(/[٠-٩\d]/g, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  const translatedWords = words.map((rawWord) => {
    // 1. Direct dictionary match
    if (QURAN_WORD_DICTIONARY[rawWord]) {
      return QURAN_WORD_DICTIONARY[rawWord];
    }
    const strippedWord = rawWord.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    if (QURAN_WORD_DICTIONARY[strippedWord]) {
      return QURAN_WORD_DICTIONARY[strippedWord];
    }

    // 2. Transliterate single Arabic word cleanly
    return transliterateArabicWord(rawWord);
  });

  return translatedWords.join(' ');
}

/**
 * Cleanly transliterates an individual Arabic word into Bengali with standard spelling
 */
function transliterateArabicWord(word: string): string {
  let result = '';
  const len = word.length;

  let i = 0;
  while (i < len) {
    const char = word[i];
    const nextChar = i + 1 < len ? word[i + 1] : '';

    // Dagger Alif (ٰ)
    if (char === '\u0670') {
      result += 'া';
      i++;
      continue;
    }

    // Shaddah on Noon (نّ) or Meem (مّ)
    if (char === 'ن' && nextChar === '\u0651') {
      result += 'ন্না';
      i += 2;
      continue;
    }
    if (char === 'م' && nextChar === '\u0651') {
      result += 'ম্মা';
      i += 2;
      continue;
    }

    // Standard Arabic letter mapping to Bengali
    let bnChar = '';
    switch (char) {
      case 'ا':
      case 'أ':
      case 'إ':
      case 'ٱ':
      case 'ء':
      case 'ئ':
      case 'ؤ':
        bnChar = result === '' ? 'আ' : '';
        break;
      case 'ب':
        bnChar = 'ব';
        break;
      case 'ت':
      case 'ة':
        bnChar = 'ত';
        break;
      case 'ث':
        bnChar = 'ছা';
        break;
      case 'ج':
        bnChar = 'জ';
        break;
      case 'ح':
        bnChar = 'হ';
        break;
      case 'خ':
        bnChar = 'খ';
        break;
      case 'د':
        bnChar = 'দ';
        break;
      case 'ذ':
        bnChar = 'য';
        break;
      case 'ر':
        bnChar = 'র';
        break;
      case 'ز':
        bnChar = 'য';
        break;
      case 'س':
        bnChar = 'স';
        break;
      case 'ش':
        bnChar = 'শ';
        break;
      case 'ص':
        bnChar = 'স';
        break;
      case 'ض':
        bnChar = 'দ্ব';
        break;
      case 'ط':
        bnChar = 'ত্ব';
        break;
      case 'ظ':
        bnChar = 'য';
        break;
      case 'ع':
        bnChar = '’আ';
        break;
      case 'غ':
        bnChar = 'গ';
        break;
      case 'ف':
        bnChar = 'ফ';
        break;
      case 'ق':
        bnChar = 'ক্ব';
        break;
      case 'ك':
        bnChar = 'ক';
        break;
      case 'ل':
        bnChar = 'ল';
        break;
      case 'م':
        bnChar = 'ম';
        break;
      case 'ن':
        bnChar = 'ন';
        break;
      case 'ه':
        bnChar = 'হ';
        break;
      case 'و':
        bnChar = result === '' ? 'ওয়া' : 'উ';
        break;
      case 'ي':
      case 'ى':
        bnChar = result === '' ? 'ইয়া' : (nextChar === '\u0652' ? 'য়' : 'ী');
        break;

      // Diacritics
      case '\u064E': // Fatha ( َ )
        if (nextChar === 'ا' || nextChar === 'ى') {
          bnChar = 'া';
          i++;
        } else {
          bnChar = result === '' || result.endsWith(' ') ? 'আ' : 'া';
        }
        break;

      case '\u0650': // Kasra ( ِ )
        if (nextChar === 'ي') {
          bnChar = 'ী';
          i++;
        } else {
          bnChar = result === '' || result.endsWith(' ') ? 'ই' : 'ি';
        }
        break;

      case '\u064F': // Damma ( ُ )
        if (nextChar === 'و') {
          bnChar = 'ূ';
          i++;
        } else {
          bnChar = result === '' || result.endsWith(' ') ? 'উ' : 'ু';
        }
        break;

      case '\u064B': // Tanween Fatha
        bnChar = 'ান';
        break;
      case '\u064D': // Tanween Kasra
        bnChar = 'িন';
        break;
      case '\u064C': // Tanween Damma
        bnChar = 'ুন';
        break;

      case '\u0652': // Sukun
      case '\u06E1': // Quranic Sukun
        bnChar = '্';
        break;

      default:
        break;
    }

    if (bnChar) {
      result += bnChar;
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
