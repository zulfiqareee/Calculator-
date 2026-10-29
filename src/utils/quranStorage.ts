export interface QuranAyah {
  ayahNumber: number;
  arabic: string;
  pronunciation: string;
  bangla: string;
  tafsir?: string;
}

export interface QuranSurah {
  id: string;
  surahNumber: number;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  totalAyahs: number;
  revelationType: 'মাক্কী' | 'মাদানী';
  meaningBn: string;
  ayahs: QuranAyah[];
  notes?: string;
  updatedAt?: number;
}

export const QURAN_STORAGE_KEY = 'smart_utility_quran_surahs_v2';

export const DEFAULT_QURAN_SURAHS: QuranSurah[] = [
  {
    id: 'surah-1',
    surahNumber: 1,
    nameBn: 'সূরা আল-ফাতিহা',
    nameEn: 'Surah Al-Fatiha',
    nameAr: 'الفاتحة',
    totalAyahs: 7,
    revelationType: 'মাক্কী',
    meaningBn: 'সূচনা বা প্রারম্ভিক',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        pronunciation: 'বিসমিল্লাহির রাহমানির রাহীম',
        bangla: 'শুরু করছি পরম করুণাময় অসীম দয়ালু আল্লাহর নামে।',
      },
      {
        ayahNumber: 2,
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        pronunciation: 'আলহামদু লিল্লাহি রাব্বিল আলামীন',
        bangla: 'যাবতীয় প্রশংসা শুধুমাত্র বিশ্বজগতের প্রতিপালক আল্লাহর জন্য।',
      },
      {
        ayahNumber: 3,
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        pronunciation: 'আর-রাহমানির রাহীম',
        bangla: 'যিনি পরম করুণাময় ও অতি দয়ালু।',
      },
      {
        ayahNumber: 4,
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        pronunciation: 'মালিকি ইয়াওমিদ্দীন',
        bangla: 'যিনি বিচার দিবসের অধিপতি ও বিচারক।',
      },
      {
        ayahNumber: 5,
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        pronunciation: 'ইয়্যাকা না’বুদু ওয়া ইয়্যাকা নাস্তাঈন',
        bangla: 'আমরা কেবল তোমারই ইবাদত করি এবং কেবল তোমারই সাহায্য প্রার্থনা করি।',
      },
      {
        ayahNumber: 6,
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        pronunciation: 'ইহদিনাস সিরাত্বাল মুস্তাক্বীম',
        bangla: 'আমাদের সরল-সঠিক পথ প্রদর্শন কর।',
      },
      {
        ayahNumber: 7,
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        pronunciation: 'সিরাত্বাল্লাযীনা আন’আমতা আলাইহিম, গাইরিল মাগদূবি আলাইহিম ওয়ালাদ্দোয়াল্লীন',
        bangla: 'সেসব মানুষের পথ, যাদের তুমি অনুগ্রহ দান করেছ; তাদের পথ নয় যারা তোমার ক্রোধে নিপতিত ও পথভ্রষ্ট হয়েছে।',
      },
    ],
  },
  {
    id: 'surah-112',
    surahNumber: 112,
    nameBn: 'সূরা আল-ইখলাস',
    nameEn: 'Surah Al-Ikhlas',
    nameAr: 'الإخلاص',
    totalAyahs: 4,
    revelationType: 'মাক্কী',
    meaningBn: 'একত্ববাদ ও বিশুদ্ধ বিশ্বাস',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        pronunciation: 'ক্বুল হুওয়াল্লাহু আহাদ',
        bangla: 'বলুন, তিনিই আল্লাহ, যিনি একক ও অদ্বিতীয়।',
      },
      {
        ayahNumber: 2,
        arabic: 'اللَّهُ الصَّمَدُ',
        pronunciation: 'আল্লাহুস সামাদ',
        bangla: 'আল্লাহ কারও মুখাপেক্ষী নন, সবাই তাঁর মুখাপেক্ষী।',
      },
      {
        ayahNumber: 3,
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        pronunciation: 'লাম ইয়ালিদ ওয়া লাম ইউলাদ',
        bangla: 'তিনি কাউকে জন্ম দেননি এবং তাঁকেও কেউ জন্ম দেয়নি।',
      },
      {
        ayahNumber: 4,
        arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        pronunciation: 'ওয়া লাম ইয়া কুল্লায়াহু কুফুওয়ান আহাদ',
        bangla: 'এবং তাঁর সমকক্ষ বা সমতুল্য কেউই নেই।',
      },
    ],
  },
  {
    id: 'surah-113',
    surahNumber: 113,
    nameBn: 'সূরা আল-ফালাক্ব',
    nameEn: 'Surah Al-Falaq',
    nameAr: 'الفلق',
    totalAyahs: 5,
    revelationType: 'মাক্কী',
    meaningBn: 'প্রভাতকাল বা উষা',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
        pronunciation: 'ক্বুল আউযু বিরাব্বিল ফালাক্ব',
        bangla: 'বলুন, আমি আশ্রয় প্রার্থনা করছি ভোরের রবের,',
      },
      {
        ayahNumber: 2,
        arabic: 'مِن شَرِّ مَا خَلَقَ',
        pronunciation: 'মিন শাররি মা খালাক্বা',
        bangla: 'তিনি যা সৃষ্টি করেছেন তার সকল অনিষ্ট হতে,',
      },
      {
        ayahNumber: 3,
        arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
        pronunciation: 'ওয়া মিন শাররি গাসিক্বিন ইযা ওয়াক্বাব',
        bangla: 'অন্ধকার রাতের অনিষ্ট হতে যখন তা নিবিড়ভাবে ছেয়ে যায়,',
      },
      {
        ayahNumber: 4,
        arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
        pronunciation: 'ওয়া মিন শাররিন নাফ্ফাছাতি ফিল উক্বাফ',
        bangla: 'এবং গ্রন্থিতে ফুৎকারকারিণীদের অনিষ্ট হতে,',
      },
      {
        ayahNumber: 5,
        arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        pronunciation: 'ওয়া মিন শাররি হাসিদিন ইযা হাসাদ',
        bangla: 'এবং হিংসুকের অনিষ্ট হতে যখন সে হিংসা করে।',
      },
    ],
  },
  {
    id: 'surah-114',
    surahNumber: 114,
    nameBn: 'সূরা আন-নাস',
    nameEn: 'Surah An-Nas',
    nameAr: 'الناس',
    totalAyahs: 6,
    revelationType: 'মাক্কী',
    meaningBn: 'মানবজাতি',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
        pronunciation: 'ক্বুল আউযু বিরাব্বিন নাস',
        bangla: 'বলুন, আমি আশ্রয় চাই মানুষের প্রতিপালকের কাছে,',
      },
      {
        ayahNumber: 2,
        arabic: 'مَلِكِ النَّاسِ',
        pronunciation: 'মালিকিন নাস',
        bangla: 'মানুষের অধিপতির কাছে,',
      },
      {
        ayahNumber: 3,
        arabic: 'إِلَٰهِ النَّاسِ',
        pronunciation: 'ইলাহিন নাস',
        bangla: 'মানুষের মাবুদের কাছে,',
      },
      {
        ayahNumber: 4,
        arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
        pronunciation: 'মিন শাররিল ওয়াসওয়াসিল খান্নাস',
        bangla: 'গোপনে প্ররোচনা প্রদানকারী আত্মগোপনকারী শয়তানের অনিষ্ট হতে,',
      },
      {
        ayahNumber: 5,
        arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
        pronunciation: 'আল্লাযী ইউওয়াসউইসু ফী সুদূরিন নাস',
        bangla: 'যে মানুষের অন্তরে কুমন্ত্রণা দেয়,',
      },
      {
        ayahNumber: 6,
        arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ',
        pronunciation: 'মিনাল জিন্নাতি ওয়ান্নাস',
        bangla: 'জিনদের মধ্য থেকে হোক কিংবা মানুষের মধ্য থেকে।',
      },
    ],
  },
  {
    id: 'surah-103',
    surahNumber: 103,
    nameBn: 'সূরা আল-আসর',
    nameEn: 'Surah Al-Asr',
    nameAr: 'العصر',
    totalAyahs: 3,
    revelationType: 'মাক্কী',
    meaningBn: 'মহাকাল বা সময়',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'وَالْعَصْرِ',
        pronunciation: 'ওয়াল আসর',
        bangla: 'মহাকালের শপথ!',
      },
      {
        ayahNumber: 2,
        arabic: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
        pronunciation: 'ইন্নাল ইনসানা লাফী খুসর',
        bangla: 'নিশ্চয় সকল মানুষ চরম ক্ষতির মধ্যে নিমজ্জিত,',
      },
      {
        ayahNumber: 3,
        arabic: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
        pronunciation: 'ইল্লাল্লাযীনা আমানূ ওয়া আমিলুস সালিহাতি ওয়া তাওয়াসাও বিল হাক্কি ওয়া তাওয়াসাও বিস সাবর',
        bangla: 'তারা ছাড়া যারা ঈমান এনেছে, সৎকাজ করেছে এবং পরস্পরকে সত্যের উপদেশ দিয়েছে ও ধৈর্যের নসীহত করেছে।',
      },
    ],
  },
  {
    id: 'surah-108',
    surahNumber: 108,
    nameBn: 'সূরা আল-কাউসার',
    nameEn: 'Surah Al-Kawthar',
    nameAr: 'الكوثر',
    totalAyahs: 3,
    revelationType: 'মাক্কী',
    meaningBn: 'প্রাচুর্য বা অফুরন্ত নিয়ামত',
    ayahs: [
      {
        ayahNumber: 1,
        arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
        pronunciation: 'ইন্না আ’ত্বয়নাকাল কাওছার',
        bangla: 'নিশ্চয় আমি আপনাকে প্রাচুর্য ও হাউজে কাউসার দান করেছি।',
      },
      {
        ayahNumber: 2,
        arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
        pronunciation: 'ফাসাল্লি লিরাব্বিকা ওয়ানহার',
        bangla: 'অতএব আপনি আপনার প্রতিপালকের উদ্দেশ্যে নামায পড়ুন এবং কোরবানি করুন।',
      },
      {
        ayahNumber: 3,
        arabic: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
        pronunciation: 'ইন্না শানিয়াকা হুওয়াল আবতার',
        bangla: 'নিশ্চয় আপনার শত্রুই নির্বংশ ও ছিন্নমূল।',
      },
    ],
  },
];

export function getStoredSurahs(): QuranSurah[] {
  try {
    const raw = localStorage.getItem(QURAN_STORAGE_KEY);
    if (!raw) {
      saveStoredSurahs(DEFAULT_QURAN_SURAHS);
      return DEFAULT_QURAN_SURAHS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_QURAN_SURAHS;
  } catch (e) {
    console.error('Failed to parse stored Quran surahs:', e);
    return DEFAULT_QURAN_SURAHS;
  }
}

export function saveStoredSurahs(surahs: QuranSurah[]): void {
  try {
    localStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(surahs));
  } catch (e) {
    console.error('Failed to save Quran surahs:', e);
  }
}

export function addOrUpdateSurah(surah: QuranSurah): QuranSurah[] {
  const current = getStoredSurahs();
  const index = current.findIndex((s) => s.id === surah.id || s.surahNumber === surah.surahNumber);
  let updated: QuranSurah[];
  const itemToSave = { ...surah, updatedAt: Date.now() };

  if (index >= 0) {
    updated = [...current];
    updated[index] = itemToSave;
  } else {
    updated = [...current, itemToSave];
  }

  // Sort by surah number ascending
  updated.sort((a, b) => a.surahNumber - b.surahNumber);
  saveStoredSurahs(updated);
  return updated;
}

export function deleteSurah(id: string): QuranSurah[] {
  const current = getStoredSurahs();
  const updated = current.filter((s) => s.id !== id);
  saveStoredSurahs(updated);
  return updated;
}

export function resetSurahsToDefault(): QuranSurah[] {
  saveStoredSurahs(DEFAULT_QURAN_SURAHS);
  return DEFAULT_QURAN_SURAHS;
}
