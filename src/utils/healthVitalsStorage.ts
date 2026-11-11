/**
 * Health Vitals Storage & Clinical Classification Engine
 * For Blood Pressure, Blood Sugar (Diabetes), and Daily Water Hydration.
 */

export interface BloodPressureRecord {
  id: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  note?: string;
  timestamp: number;
  categoryBn: string;
  categoryEn: string;
  colorClass: string;
}

export interface BloodSugarRecord {
  id: string;
  valueMmol: number; // mmol/L
  timing: 'fasting' | 'post_meal' | 'random';
  note?: string;
  timestamp: number;
  categoryBn: string;
  categoryEn: string;
  colorClass: string;
}

const BP_STORAGE_KEY = 'sut_health_bp_records_v1';
const BS_STORAGE_KEY = 'sut_health_bs_records_v1';
const WATER_STORAGE_KEY = 'sut_health_water_tracker_v1';

// Blood Pressure WHO / AHA Classification
export function classifyBloodPressure(sys: number, dia: number): {
  categoryBn: string;
  categoryEn: string;
  colorClass: string;
  adviceBn: string;
} {
  if (sys < 90 || dia < 60) {
    return {
      categoryBn: 'নিম্ন রক্তচাপ (Low BP)',
      categoryEn: 'Hypotension',
      colorClass: 'text-blue-500',
      adviceBn: 'খাবার স্যালাইন, ডিম বা পর্যাপ্ত তরল গ্রহণ করুন। অতিরিক্ত দুর্বল লাগলে চিকিৎসকের পরামর্শ নিন।',
    };
  } else if (sys <= 120 && dia <= 80) {
    return {
      categoryBn: 'আদর্শ ও স্বাভাবিক (Normal)',
      categoryEn: 'Normal',
      colorClass: 'text-emerald-500',
      adviceBn: 'চমৎকার! আপনার রক্তচাপ সম্পূর্ণ স্বাভাবিক। স্বাস্থ্যকর খাদ্যাভ্যাস বজায় রাখুন।',
    };
  } else if (sys <= 129 && dia < 80) {
    return {
      categoryBn: 'প্রাক-উচ্চ রক্তচাপ (Elevated)',
      categoryEn: 'Elevated',
      colorClass: 'text-amber-500',
      adviceBn: 'খাবারে বাড়তি কাঁচা লবণ বর্জন করুন এবং নিয়মিত ৩০ মিনিট হাঁটাহাঁটি করুন।',
    };
  } else if (sys <= 139 || dia <= 89) {
    return {
      categoryBn: 'উচ্চ রক্তচাপ স্টেজ ১ (Stage 1)',
      categoryEn: 'Stage 1 Hypertension',
      colorClass: 'text-orange-500',
      adviceBn: 'নিয়মিত প্রেশার মাপুন, চর্বিযুক্ত খাবার এড়িয়ে চলুন এবং ডাক্তারের পরামর্শে থাকুন।',
    };
  } else if (sys < 180 && dia < 120) {
    return {
      categoryBn: 'উচ্চ রক্তচাপ স্টেজ ২ (Stage 2)',
      categoryEn: 'Stage 2 Hypertension',
      colorClass: 'text-rose-500',
      adviceBn: 'উচ্চ ঝুঁকি! বিশেষজ্ঞ ডাক্তারের পরামর্শ অনুযায়ী নিয়মিত প্রেশারের ওষুধ সেবন করুন।',
    };
  } else {
    return {
      categoryBn: 'জরুরি সংকট (Hypertensive Crisis)',
      categoryEn: 'Hypertensive Crisis',
      colorClass: 'text-red-700 animate-pulse',
      adviceBn: 'বিপজ্জনক মাত্রা! অবিলম্বে নিকটস্থ হাসপাতাল বা জরুরি চিকিৎসকের শরণাপন্ন হন।',
    };
  }
}

// Blood Sugar ADA Classification (mmol/L)
export function classifyBloodSugar(value: number, timing: 'fasting' | 'post_meal' | 'random'): {
  categoryBn: string;
  categoryEn: string;
  colorClass: string;
  adviceBn: string;
} {
  if (value < 3.9) {
    return {
      categoryBn: 'হাইপোগ্লাইসেমিয়া (চরম রক্তের চিনি হ্রাস)',
      categoryEn: 'Hypoglycemia',
      colorClass: 'text-rose-600 animate-pulse',
      adviceBn: 'জরুরি অবস্থা! তৎক্ষণাৎ মিষ্টি, চিনির শরবত বা মিষ্টি ফল খেয়ে সুগার স্বাভাবিক করুন।',
    };
  }

  if (timing === 'fasting') {
    if (value <= 5.5) {
      return {
        categoryBn: 'স্বাভাবিক (Normal Fasting)',
        categoryEn: 'Normal',
        colorClass: 'text-emerald-500',
        adviceBn: 'খালি পেটে আপনার সুগার সম্পূর্ণ স্বাভাবিক ও আদর্শ সীমায় রয়েছে।',
      };
    } else if (value <= 6.9) {
      return {
        categoryBn: 'প্রি-ডায়াবেটিস (Pre-diabetes)',
        categoryEn: 'Pre-diabetes',
        colorClass: 'text-amber-500',
        adviceBn: 'সতর্ক সংকেত! ভাত ও চিনিযুক্ত খাবার নিয়ন্ত্রণ করুন এবং ওজন কমানোর চেষ্টা করুন।',
      };
    } else {
      return {
        categoryBn: 'ডায়াবেটিস (High Sugar)',
        categoryEn: 'Diabetes',
        colorClass: 'text-rose-500',
        adviceBn: 'রক্তে সুগারের মাত্রা বেশি। ডাক্তারের পরামর্শ মোতাবেক ওষুধ বা ইনসুলিন গ্রহণ করুন।',
      };
    }
  } else {
    // Post-meal or Random
    if (value <= 7.7) {
      return {
        categoryBn: 'স্বাভাবিক (Normal Post-meal)',
        categoryEn: 'Normal',
        colorClass: 'text-emerald-500',
        adviceBn: 'খাবারের পর আপনার সুগার চমৎকার স্বাভাবিক মাত্রায় রয়েছে।',
      };
    } else if (value <= 11.0) {
      return {
        categoryBn: 'প্রি-ডায়াবেটিস / সহনশীলতার বাইরে',
        categoryEn: 'Elevated Post-meal',
        colorClass: 'text-amber-500',
        adviceBn: 'খাবারের শর্করা ও মিষ্টি সীমিত রাখুন এবং নিয়মিত শরীরচর্চা বজায় রাখুন।',
      };
    } else {
      return {
        categoryBn: 'অনিয়ন্ত্রিত ডায়াবেটিস',
        categoryEn: 'Diabetes (Uncontrolled)',
        colorClass: 'text-rose-500',
        adviceBn: 'রক্তে গ্লুকোজ অতিরিক্ত বেশি। মিষ্টি ও কোমল পানীয় সম্পূর্ণ বর্জন করে ডাক্তার দেখান।',
      };
    }
  }
}

// Local Storage for Blood Pressure
export function getStoredBloodPressureRecords(): BloodPressureRecord[] {
  try {
    const raw = localStorage.getItem(BP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBloodPressureRecord(rec: Omit<BloodPressureRecord, 'id' | 'timestamp' | 'categoryBn' | 'categoryEn' | 'colorClass'>): BloodPressureRecord[] {
  const current = getStoredBloodPressureRecords();
  const cl = classifyBloodPressure(rec.systolic, rec.diastolic);
  const newRec: BloodPressureRecord = {
    ...rec,
    id: `bp_${Date.now()}`,
    timestamp: Date.now(),
    categoryBn: cl.categoryBn,
    categoryEn: cl.categoryEn,
    colorClass: cl.colorClass,
  };
  const updated = [newRec, ...current].slice(0, 50); // Keep last 50
  localStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteBloodPressureRecord(id: string): BloodPressureRecord[] {
  const current = getStoredBloodPressureRecords();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Local Storage for Blood Sugar
export function getStoredBloodSugarRecords(): BloodSugarRecord[] {
  try {
    const raw = localStorage.getItem(BS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBloodSugarRecord(rec: Omit<BloodSugarRecord, 'id' | 'timestamp' | 'categoryBn' | 'categoryEn' | 'colorClass'>): BloodSugarRecord[] {
  const current = getStoredBloodSugarRecords();
  const cl = classifyBloodSugar(rec.valueMmol, rec.timing);
  const newRec: BloodSugarRecord = {
    ...rec,
    id: `bs_${Date.now()}`,
    timestamp: Date.now(),
    categoryBn: cl.categoryBn,
    categoryEn: cl.categoryEn,
    colorClass: cl.colorClass,
  };
  const updated = [newRec, ...current].slice(0, 50);
  localStorage.setItem(BS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteBloodSugarRecord(id: string): BloodSugarRecord[] {
  const current = getStoredBloodSugarRecords();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(BS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Water Tracker Storage
export interface DailyWaterState {
  dateStr: string; // YYYY-MM-DD
  glasses: number;
  goalGlasses: number;
}

export function getTodayWaterState(): DailyWaterState {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(WATER_STORAGE_KEY);
    if (raw) {
      const parsed: DailyWaterState = JSON.parse(raw);
      if (parsed.dateStr === todayStr) {
        return parsed;
      }
    }
  } catch {}
  return { dateStr: todayStr, glasses: 0, goalGlasses: 10 }; // Default 10 glasses (2.5L)
}

export function saveWaterState(glasses: number, goalGlasses = 10): DailyWaterState {
  const todayStr = new Date().toISOString().split('T')[0];
  const newState: DailyWaterState = {
    dateStr: todayStr,
    glasses: Math.max(0, glasses),
    goalGlasses,
  };
  localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(newState));
  return newState;
}
