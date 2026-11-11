/**
 * Weather & Air Quality Index (AQI) & Agro-Weather Engine
 */

export interface AqiInfo {
  score: number;
  labelBn: string;
  labelEn: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  healthAdviceBn: string;
  maskRecommended: boolean;
  outdoorSafe: boolean;
}

export function getAqiDetails(usAqi: number): AqiInfo {
  const score = Math.round(usAqi || 0);

  if (score <= 50) {
    return {
      score,
      labelBn: 'ভালো (বিশুদ্ধ বাতাস)',
      labelEn: 'Good',
      colorClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      healthAdviceBn: 'বাতাসের মান চমৎকার। ঘরের বাইরে ব্যায়াম ও হাঁটাচলার জন্য সম্পূর্ণ নিরাপদ।',
      maskRecommended: false,
      outdoorSafe: true,
    };
  } else if (score <= 100) {
    return {
      score,
      labelBn: 'সহনীয় (স্বাভাবিক)',
      labelEn: 'Moderate',
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-200 dark:border-amber-800',
      healthAdviceBn: 'বাতাসের মান গ্রহণযোগ্য। তবে অতিরিক্ত সংবেদনশীল বা শ্বাসকষ্টের রোগীরা দীর্ঘক্ষণ বাইরে না থাকাই ভালো।',
      maskRecommended: false,
      outdoorSafe: true,
    };
  } else if (score <= 150) {
    return {
      score,
      labelBn: 'সংবেদনশীলদের জন্য অস্বাস্থ্যকর',
      labelEn: 'Unhealthy for Sensitive',
      colorClass: 'text-orange-500',
      bgClass: 'bg-orange-50 dark:bg-orange-950/40',
      borderClass: 'border-orange-200 dark:border-orange-800',
      healthAdviceBn: 'শিশু, বয়োবৃদ্ধ এবং হাঁপানি/অ্যাজমা রোগীদের বাইরে বের হলে মাস্ক পরিধান করা উচিত।',
      maskRecommended: true,
      outdoorSafe: false,
    };
  } else if (score <= 200) {
    return {
      score,
      labelBn: 'অস্বাস্থ্যকর (দূষিত)',
      labelEn: 'Unhealthy',
      colorClass: 'text-rose-500',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      borderClass: 'border-rose-200 dark:border-rose-800',
      healthAdviceBn: 'সাধারণ মানুষের ফুসফুসে অস্বস্তি হতে পারে। বাইরে বের হলে এন-৯৫ বা সার্জিক্যাল মাস্ক ব্যবহার করুন।',
      maskRecommended: true,
      outdoorSafe: false,
    };
  } else if (score <= 300) {
    return {
      score,
      labelBn: 'খুবই অস্বাস্থ্যকর (বিপজ্জনক দূষণ)',
      labelEn: 'Very Unhealthy',
      colorClass: 'text-purple-500',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40',
      borderClass: 'border-purple-200 dark:border-purple-800',
      healthAdviceBn: 'জরুরি স্বাস্থ্য সতর্কতা। ঘরের দরজা-জানালা বন্ধ রাখুন এবং অপ্রয়োজনে বাইরে যাওয়া থেকে বিরত থাকুন।',
      maskRecommended: true,
      outdoorSafe: false,
    };
  } else {
    return {
      score,
      labelBn: 'চরম ঝুঁকিপূর্ণ (মারাত্মক দূষণ)',
      labelEn: 'Hazardous',
      colorClass: 'text-red-700',
      bgClass: 'bg-red-100 dark:bg-red-950/60',
      borderClass: 'border-red-400 dark:border-red-800',
      healthAdviceBn: 'সর্বোচ্চ সতর্ক সংকেত! শিশু ও বয়স্কদের ঘরের বাইরে যাওয়া সম্পূর্ণ নিষিদ্ধ। এয়ার পিউরিফায়ার ব্যবহার করুন।',
      maskRecommended: true,
      outdoorSafe: false,
    };
  }
}

export function getUvDetails(uv: number): {
  score: number;
  labelBn: string;
  colorClass: string;
  adviceBn: string;
} {
  const score = Math.round(uv || 0);
  if (score <= 2) {
    return { score, labelBn: 'কম (নিরাপদ)', colorClass: 'text-emerald-500', adviceBn: 'সানগ্লাস বা ছাতা ঐচ্ছিক।' };
  } else if (score <= 5) {
    return { score, labelBn: 'মাঝারি', colorClass: 'text-amber-500', adviceBn: 'দুপুরে বাইরে বের হলে ছাতা বা টুপি ব্যবহার করুন।' };
  } else if (score <= 7) {
    return { score, labelBn: 'উচ্চ (তীব্র রোদ)', colorClass: 'text-orange-500', adviceBn: 'দুপুর ১২টা থেকে ৩টা পর্যন্ত ছায়ায় থাকুন ও সানস্ক্রিন লাগান।' };
  } else if (score <= 10) {
    return { score, labelBn: 'খুব উচ্চ', colorClass: 'text-rose-500', adviceBn: 'ত্বক ও চোখের ক্ষতি এড়াতে ছাতা ও কালো চশমা ছাড়া বের হবেন না।' };
  } else {
    return { score, labelBn: 'চরম বিপজ্জনক', colorClass: 'text-purple-600', adviceBn: 'সরাসরি প্রখর রোদে দীর্ঘক্ষণ থাকা এড়িয়ে চলুন।' };
  }
}

export interface AgroAdvice {
  irrigation: { status: 'safe' | 'caution' | 'not_needed'; textBn: string };
  sprayPesticide: { status: 'safe' | 'caution' | 'not_recommended'; textBn: string };
  harvesting: { status: 'good' | 'caution'; textBn: string };
  generalAlertBn: string;
}

export function getAgroAdvice(
  rainProbMax: number,
  tempMax: number,
  windSpeed: number,
  humidity: number
): AgroAdvice {
  let irrigationStatus: 'safe' | 'caution' | 'not_needed' = 'safe';
  let irrigationText = 'ফসলের জমিতে স্বাভাবিক সেচ পরিচালনা করতে পারেন।';

  if (rainProbMax >= 60) {
    irrigationStatus = 'not_needed';
    irrigationText = 'ভারী বৃষ্টির সম্ভাবনা রয়েছে, জমিতে অতিরিক্ত সেচ দেওয়া থেকে বিরত থাকুন এবং নিষ্কাশন নালা প্রস্তুত রাখুন।';
  } else if (tempMax >= 36) {
    irrigationStatus = 'safe';
    irrigationText = 'তীব্র তাপদাহে মাটি শুকিয়ে যেতে পারে, সকালে বা বিকেলে হালকা সেচ দেওয়া উপকারী।';
  }

  let sprayStatus: 'safe' | 'caution' | 'not_recommended' = 'safe';
  let sprayText = 'কীটনাশক বা তরল সার স্প্রে করার জন্য আজকের আবহাওয়া অনুকূল।';

  if (rainProbMax >= 40) {
    sprayStatus = 'not_recommended';
    sprayText = 'বৃষ্টির আশঙ্কা থাকায় আজ কীটনাশক ছিটাবেন না, ওষুধ ধুয়ে অপচয় হতে পারে।';
  } else if (windSpeed >= 20) {
    sprayStatus = 'caution';
    sprayText = 'বাতাসের গতিবেগ বেশি থাকায় স্প্রে করার সময় লক্ষ্যভ্রষ্ট হতে পারে, সকালে শান্ত বাতাসে স্প্রে করুন।';
  }

  let harvestStatus: 'good' | 'caution' = 'good';
  let harvestText = 'ফসল বা ধান কাটা এবং রোদে শুকানোর জন্য আবহাওয়া চমৎকার।';

  if (rainProbMax >= 50) {
    harvestStatus = 'caution';
    harvestText = 'বৃষ্টির সম্ভাবনা থাকায় কাটা ফসল দ্রুত শুকনো স্থানে ঢেকে রাখুন।';
  }

  let generalAlert = 'স্বাভাবিক কৃষি মৌসুম আবহাওয়া বজায় রয়েছে।';
  if (tempMax >= 37) {
    generalAlert = 'তীব্র তাপদাহ (Heatwave) সতর্কতা: গবাদি পশুকে ছায়াযুক্ত স্থানে রাখুন এবং প্রচুর পানি পান করান।';
  } else if (rainProbMax >= 70) {
    generalAlert = 'ভারী বর্ষণ ও মেঘের গর্জন সতর্কতা: বিদ্যুৎ চমকানোর সময় খোলা মাঠে কাজ করা থেকে বিরত থাকুন।';
  } else if (tempMax <= 15) {
    generalAlert = 'শৈত্যপ্রবাহ সতর্কতা: ধানের বীজতলা পলিথিন দিয়ে ঢেকে রাখুন যাতে চারা সতেজ থাকে।';
  }

  return {
    irrigation: { status: irrigationStatus, textBn: irrigationText },
    sprayPesticide: { status: sprayStatus, textBn: sprayText },
    harvesting: { status: harvestStatus, textBn: harvestText },
    generalAlertBn: generalAlert,
  };
}

/**
 * Text-to-Speech (TTS) Voice Broadcast in Bengali
 */
export function speakWeatherReportBn(
  cityName: string,
  temp: number,
  feelsLike: number,
  conditionBn: string,
  rainProb: number,
  aqiScore: number,
  aqiLabel: string
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const text = `${cityName} এলাকার আজকের আবহাওয়া বার্তা। বর্তমান তাপমাত্রা ${temp} ডিগ্রি সেলসিয়াস, যা অনুভূত হচ্ছে ${feelsLike} ডিগ্রি সেলসিয়াস। আকাশ ${conditionBn}। বৃষ্টির সম্ভাবনা শতকরা ${rainProb} ভাগ। বায়ুদূষণ সূচক এ কিউ আই ${aqiScore}, যা ${aqiLabel}। সুস্থ ও নিরাপদে থাকুন।`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'bn-BD';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try finding Bengali voice
  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find((v) => v.lang.startsWith('bn'));
  if (bnVoice) utterance.voice = bnVoice;

  window.speechSynthesis.speak(utterance);
}
