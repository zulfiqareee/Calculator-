import React, { useState, useEffect } from 'react';
import {
  Heart,
  Scale,
  Utensils,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Search,
  Activity,
  Flame,
  Droplets,
  Info,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  PhoneCall,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';
import { tallySounds } from '../../utils/tallyAudioVoice';
import {
  BloodPressureRecord,
  BloodSugarRecord,
  DailyWaterState,
  classifyBloodPressure,
  classifyBloodSugar,
  getStoredBloodPressureRecords,
  saveBloodPressureRecord,
  deleteBloodPressureRecord,
  getStoredBloodSugarRecords,
  saveBloodSugarRecord,
  deleteBloodSugarRecord,
  getTodayWaterState,
  saveWaterState,
} from '../../utils/healthVitalsStorage';

interface Props {
  lang: Language;
}

type TabType = 'bmi' | 'bp' | 'sugar' | 'water' | 'food' | 'firstaid';

interface FoodItem {
  id: string;
  nameBn: string;
  nameEn: string;
  portion: string;
  calories: number;
  protein: number;
  category: 'grain' | 'protein' | 'dairy' | 'fruit' | 'veg' | 'snack';
}

const FOOD_DATABASE: FoodItem[] = [
  { id: '1', nameBn: 'সাদা ভাত (সেদ্ধ)', nameEn: 'Cooked White Rice', portion: '১ মাঝারি কাপ (১৫০ গ্রাম)', calories: 195, protein: 4.1, category: 'grain' },
  { id: '2', nameBn: 'আটার রুটি (হাতে তৈরি)', nameEn: 'Wheat Roti / Chapati', portion: '১টি মাঝারি সাইজ', calories: 75, protein: 3.1, category: 'grain' },
  { id: '3', nameBn: 'তেলে ভাজা পরোটা', nameEn: 'Paratha (Oil fried)', portion: '১টি মাঝারি', calories: 240, protein: 4.5, category: 'grain' },
  { id: '4', nameBn: 'ভুনা খিচুড়ি', nameEn: 'Khichuri', portion: '১ প্লেট (২৫০ গ্রাম)', calories: 340, protein: 8.5, category: 'grain' },
  { id: '5', nameBn: 'মসুর ডাল (ঘন)', nameEn: 'Lentil Dal', portion: '১ বাটি (১০০ গ্রাম)', calories: 115, protein: 7.8, category: 'protein' },
  { id: '6', nameBn: 'ডিম সেদ্ধ', nameEn: 'Boiled Egg', portion: '১টি বড় সাইজ', calories: 78, protein: 6.3, category: 'protein' },
  { id: '7', nameBn: 'ডিম ভাজা / অমলেট', nameEn: 'Fried Egg / Omelet', portion: '১টি (তেলে ভাজা)', calories: 125, protein: 6.5, category: 'protein' },
  { id: '8', nameBn: 'মুরগির মাংস কারি', nameEn: 'Chicken Curry', portion: '২ পিস ঝোলসহ (১০০ গ্রাম)', calories: 185, protein: 18.0, category: 'protein' },
  { id: '9', nameBn: 'গরুর মাংস ভুনা', nameEn: 'Beef Curry', portion: '২ টুকরা (১০০ গ্রাম)', calories: 260, protein: 22.0, category: 'protein' },
  { id: '10', nameBn: 'রুই মাছ ভাজা / কারি', nameEn: 'Rui Fish', portion: '১ পিস (৮০ গ্রাম)', calories: 140, protein: 15.5, category: 'protein' },
  { id: '11', nameBn: 'ইলিশ মাছ ভাজা', nameEn: 'Ilish / Hilsa Fish', portion: '১ পিস (৮০ গ্রাম)', calories: 210, protein: 16.0, category: 'protein' },
  { id: '12', nameBn: 'চিংড়ি মাছ মালাইকারি', nameEn: 'Prawn Curry', portion: '৪টি মাঝারি পিস', calories: 190, protein: 17.5, category: 'protein' },
  { id: '13', nameBn: 'গরুর খাঁটি দুধ', nameEn: 'Cow Milk (Full cream)', portion: '১ গ্লাস (২৫০ মি.লি.)', calories: 155, protein: 8.0, category: 'dairy' },
  { id: '14', nameBn: 'টক দই (মিষ্টিহীন)', nameEn: 'Plain Yogurt (Tok Doi)', portion: '১ কাপ (১০০ গ্রাম)', calories: 60, protein: 3.5, category: 'dairy' },
  { id: '15', nameBn: 'পাকা কলা (সবরি / সাগর)', nameEn: 'Ripe Banana', portion: '১টি মাঝারি', calories: 105, protein: 1.3, category: 'fruit' },
  { id: '16', nameBn: 'আপেল', nameEn: 'Fresh Apple', portion: '১টি মাঝারি', calories: 95, protein: 0.5, category: 'fruit' },
  { id: '17', nameBn: 'পেয়ারা', nameEn: 'Guava', portion: '১টি মাঝারি', calories: 50, protein: 1.5, category: 'fruit' },
  { id: '18', nameBn: 'সবুজ শাকসবজি (মিক্সড)', nameEn: 'Mixed Vegetable Curry', portion: '১ বাটি', calories: 85, protein: 2.5, category: 'veg' },
  { id: '19', nameBn: 'আলু ভর্তা', nameEn: 'Mashed Potato (Aloo Bhorta)', portion: '১ টেবিল চামচ', calories: 90, protein: 1.5, category: 'veg' },
  { id: '20', nameBn: 'চিনাবাদাম (ভাজা)', nameEn: 'Roasted Peanuts', portion: '১ মুঠো (৩০ গ্রাম)', calories: 170, protein: 7.0, category: 'snack' },
  { id: '21', nameBn: 'রং চা (চিনি ছাড়া)', nameEn: 'Black Tea (No sugar)', portion: '১ কাপ', calories: 2, protein: 0.1, category: 'snack' },
  { id: '22', nameBn: 'দুধ চা (চিনিসহ)', nameEn: 'Milk Tea with Sugar', portion: '১ কাপ', calories: 95, protein: 2.2, category: 'snack' },
];

interface FirstAidGuide {
  id: string;
  titleBn: string;
  titleEn: string;
  urgency: 'critical' | 'high' | 'moderate';
  dosBn: string[];
  dontsBn: string[];
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'heart_attack',
    titleBn: 'হার্ট অ্যাটাক ও বুকে তীব্র ব্যথা',
    titleEn: 'Heart Attack & Chest Pain',
    urgency: 'critical',
    dosBn: [
      'রোগীকে স্থিরভাবে বসিয়ে রাখুন (হালকা হেলান দিয়ে পা মুড়িয়ে)।',
      'তৎক্ষণাৎ ৩২৫ মিগ্রা অ্যাসপিরিন ট্যাবলেট চিবিয়ে খেতে দিন (যদি অ্যালার্জি না থাকে)।',
      'যদি ডাক্তারের প্রেসক্রিপশন করা নাইট্রেট স্প্রে থাকে, তবে জিহ্বার নিচে দিন।',
      'অবিলম্বে জরুরি জাতীয় সেবা ৯৯৯ অথবা অ্যাম্বুলেন্সে কল করুন।',
    ],
    dontsBn: [
      'রোগীকে কোনোভাবেই হাঁটাহাঁটি বা সিঁড়ি বেয়ে উঠতে দেবেন না।',
      'অচেতন অবস্থায় মুখে কোনো পানি বা খাবার দেবেন না।',
    ],
  },
  {
    id: 'heatstroke',
    titleBn: 'হিটস্ট্রোক ও তীব্র গরমে অচেতন',
    titleEn: 'Heatstroke & Sunstroke',
    urgency: 'critical',
    dosBn: [
      'রোগীকে অবিলম্বে ছায়াযুক্ত ঠান্ডা বা ফ্যানের নিচে নিয়ে আসুন।',
      'শরীরের কাপড় ঢিলা করে দিন এবং ঘাড়, বগল ও কুঁচকিতে ভেজা গামছা বা বরফ ধরুন।',
      'জ্ঞান থাকলে প্রচুর খাবার স্যালাইন ও স্বাভাবিক পানি পান করান।',
    ],
    dontsBn: [
      'অচেতন রোগীর মুখে জোর করে তরল ঢালবেন না (শ্বাসনালীতে আটকে যেতে পারে)।',
      'অতিরিক্ত বরফ-শীতল পানিতে রোগীকে ডুবিয়ে রাখবেন না (রক্তনালী সংকুচিত হতে পারে)।',
    ],
  },
  {
    id: 'burns',
    titleBn: 'আগুনে পোড়া বা ফুটন্ত পানি/তেল পড়া',
    titleEn: 'Burns & Scalds',
    urgency: 'high',
    dosBn: [
      'ক্ষতস্থানে একটানা ১৫-২০ মিনিট সাধারণ ট্যাপের পরিষ্কার পানি ঢালুন।',
      'পরিষ্কার শুকনো সুতি কাপড় বা গজ দিয়ে ক্ষত ঢেকে দ্রুত হাসপাতালে নিন।',
    ],
    dontsBn: [
      'টুথপেস্ট, ডিমের সাদা অংশ, তেল বা মাখন কোনোভাবেই লাগাবেন না (ইনফেকশন হতে পারে)।',
      'পোড়া ফোস্কা নিজে নিজে গলিয়ে বা ফাটিয়ে দেবেন না।',
    ],
  },
  {
    id: 'bleeding',
    titleBn: 'অতিরিক্ত রক্তক্ষরণ ও গভীর কাটা',
    titleEn: 'Severe Bleeding & Wounds',
    urgency: 'high',
    dosBn: [
      'পরিষ্কার সুতি কাপড় দিয়ে ক্ষতস্থানের ওপর একটানা সরাসরি চাপ দিয়ে ধরে রাখুন।',
      'সম্ভব হলে আহত অঙ্গ হৃৎপিণ্ডের চেয়ে কিছুটা উঁচুতে রাখুন।',
      'চাপ বজায় রেখে ব্যান্ডেজ বা কাপড় দিয়ে শক্ত করে বেঁধে হাসপাতালে নিন।',
    ],
    dontsBn: [
      'ক্ষতে জমে থাকা রক্ত বারবার মুছে ফেলবেন না, এতে রক্ত জমাট বাঁধতে বাধা পায়।',
      'কাটা স্থানে কোনো ধারালো বস্তু গেঁথে থাকলে তা নিজে টেনে বের করবেন না।',
    ],
  },
  {
    id: 'snakebite',
    titleBn: 'সাপের কামড় (Snakebite)',
    titleEn: 'Snakebite Emergency',
    urgency: 'critical',
    dosBn: [
      'রোগীকে সম্পূর্ণ স্থির রাখুন, আতঙ্কিত হতে দেবেন না (নড়াচড়ায় বিষ দ্রুত ছড়ায়)।',
      'কামড়ের স্থান সাবান-পানি দিয়ে ধুয়ে আলতো করে পরিষ্কার কাপড় দিয়ে বাঁধুন।',
      'যত দ্রুত সম্ভব অ্যান্টিভেনম সুবিধা সংবলিত সরকারি সদর হাসপাতালে নিয়ে যান।',
    ],
    dontsBn: [
      'কামড় দেওয়া স্থানে দড়ি দিয়ে টাইট গিঁট দেবেন না বা রক্তপ্রবাহ বন্ধ করবেন না।',
      'ছুরি দিয়ে চেরা, মুখ দিয়ে বিষ চোষা বা ওঝা-কবিরাজের কাছে যাওয়া সম্পূর্ণ নিষিদ্ধ।',
    ],
  },
];

export const BmiCalorieCalculator: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<TabType>('bmi');

  // Common Profile Inputs for BMI & Calorie
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInch, setHeightInch] = useState<number>(6);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<number>(1.375); // Light activity
  const [copied, setCopied] = useState<boolean>(false);

  // Height conversion to meters & inches
  const totalInches = heightFeet * 12 + heightInch;
  const heightMeters = totalInches * 0.0254;

  // BMI Calculation
  let bmi = 0;
  if (heightMeters > 0 && weightKg > 0) {
    bmi = weightKg / (heightMeters * heightMeters);
  }

  const minIdealWeight = 18.5 * (heightMeters * heightMeters);
  const maxIdealWeight = 24.9 * (heightMeters * heightMeters);

  const getBmiCategory = (score: number) => {
    if (score < 18.5) {
      return {
        labelBn: 'কম ওজন (Underweight)',
        labelEn: 'Underweight',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/30',
        advice: 'পুষ্টিকর সুষম খাদ্য গ্রহণ করে স্বাস্থ্যকর উপায়ে ওজন বৃদ্ধির দিকে নজর দিন।',
      };
    } else if (score <= 24.9) {
      return {
        labelBn: 'আদর্শ ও স্বাভাবিক ওজন (Normal)',
        labelEn: 'Normal weight',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        advice: 'অভিনন্দন! আপনার বর্তমান ওজন চমৎকার স্বাভাবিক সীমায় রয়েছে।',
      };
    } else if (score <= 29.9) {
      return {
        labelBn: 'অতিরিক্ত ওজন (Overweight)',
        labelEn: 'Overweight',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10 border-orange-500/30',
        advice: 'প্রতিদিন ৩০ মিনিট দ্রুত হাঁটুন এবং মিষ্টি, ফাস্টফুড ও তেলযুক্ত খাবার বর্জন করুন।',
      };
    } else {
      return {
        labelBn: 'স্থূলতা বা অতিরিক্ত মেদ (Obese)',
        labelEn: 'Obese',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10 border-rose-500/30',
        advice: 'হৃদরোগ ও ডায়াবেটিস ঝুঁকি কমাতে বিশেষজ্ঞ চিকিৎসকের পরামর্শ নিয়ে ডায়েট করুন।',
      };
    }
  };

  const bmiCat = getBmiCategory(bmi);

  // BMR & TDEE
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * (totalInches * 2.54) - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * (totalInches * 2.54) - 5 * age - 161;
  }

  const tdee = Math.round(bmr * activityLevel);
  const weightLossCal = Math.max(1200, tdee - 500);

  // ==========================================
  // TAB 2: BLOOD PRESSURE LOGBOOK
  // ==========================================
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);
  const [bpPulse, setBpPulse] = useState<number>(75);
  const [bpNote, setBpNote] = useState<string>('');
  const [bpRecords, setBpRecords] = useState<BloodPressureRecord[]>([]);

  useEffect(() => {
    setBpRecords(getStoredBloodPressureRecords());
  }, []);

  const handleSaveBp = () => {
    tallySounds.playSuccessChime();
    const updated = saveBloodPressureRecord({
      systolic: bpSys,
      diastolic: bpDia,
      pulse: bpPulse,
      note: bpNote.trim() || undefined,
    });
    setBpRecords(updated);
    setBpNote('');
  };

  const handleDeleteBp = (id: string) => {
    const updated = deleteBloodPressureRecord(id);
    setBpRecords(updated);
  };

  const currentBpClass = classifyBloodPressure(bpSys, bpDia);

  // ==========================================
  // TAB 3: BLOOD SUGAR LOGBOOK
  // ==========================================
  const [bsValue, setBsValue] = useState<number>(5.8);
  const [bsTiming, setBsTiming] = useState<'fasting' | 'post_meal' | 'random'>('fasting');
  const [bsNote, setBsNote] = useState<string>('');
  const [bsRecords, setBsRecords] = useState<BloodSugarRecord[]>([]);

  useEffect(() => {
    setBsRecords(getStoredBloodSugarRecords());
  }, []);

  const handleSaveBs = () => {
    tallySounds.playSuccessChime();
    const updated = saveBloodSugarRecord({
      valueMmol: bsValue,
      timing: bsTiming,
      note: bsNote.trim() || undefined,
    });
    setBsRecords(updated);
    setBsNote('');
  };

  const handleDeleteBs = (id: string) => {
    const updated = deleteBloodSugarRecord(id);
    setBsRecords(updated);
  };

  const currentBsClass = classifyBloodSugar(bsValue, bsTiming);

  // ==========================================
  // TAB 4: WATER HYDRATION TRACKER
  // ==========================================
  const [waterState, setWaterState] = useState<DailyWaterState>(getTodayWaterState());

  useEffect(() => {
    setWaterState(getTodayWaterState());
  }, []);

  const handleAddGlass = () => {
    tallySounds.playClickSound();
    const newGlasses = waterState.glasses + 1;
    const updated = saveWaterState(newGlasses, waterState.goalGlasses);
    setWaterState(updated);
    if (newGlasses === updated.goalGlasses) {
      tallySounds.playSuccessChime();
    }
  };

  const handleMinusGlass = () => {
    if (waterState.glasses <= 0) return;
    tallySounds.playClickSound();
    const updated = saveWaterState(waterState.glasses - 1, waterState.goalGlasses);
    setWaterState(updated);
  };

  // Recommended water based on weight
  const customWaterGoalLiters = (weightKg * 0.035).toFixed(1);
  const customWaterGlassesGoal = Math.round(parseFloat(customWaterGoalLiters) * 4);

  // ==========================================
  // TAB 5: FOOD DATABASE & SEARCH
  // ==========================================
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFoods = FOOD_DATABASE.filter((f) => {
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchQ =
      !foodSearch.trim() ||
      f.nameBn.toLowerCase().includes(foodSearch.toLowerCase()) ||
      f.nameEn.toLowerCase().includes(foodSearch.toLowerCase());
    return matchCat && matchQ;
  });

  const handleCopyReport = async () => {
    const text = `ডিজিটাল স্বাস্থ্য ও পরিমাপক রিপোর্ট:
উচ্চতা: ${heightFeet}' ${heightInch}" (${(heightMeters * 100).toFixed(0)} সেমি)
ওজন: ${weightKg} কেজি | বয়স: ${age} বছর (${gender === 'male' ? 'পুরুষ' : 'মহিলা'})
-----------------------------------
• BMI স্কোর: ${bmi.toFixed(1)} (${bmiCat.labelBn})
• আদর্শ স্বাস্থ্যকর ওজন: ${minIdealWeight.toFixed(1)} - ${maxIdealWeight.toFixed(1)} কেজি
• দৈনিক ক্যালরি চাহিদা (TDEE): ${tdee} kcal
• ওজন হ্রাস লক্ষ্য: ${weightLossCal} kcal
• দৈনিক পানির লক্ষ্যমাত্রা: ${customWaterGoalLiters} লিটার (~${customWaterGlassesGoal} গ্লাস)`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'bmi-calorie',
      titleEn: 'Health & BMI Hub',
      titleBn: 'স্বাস্থ্য ও বিএমআই হাব',
      expression: `${heightFeet}'${heightInch}" | ${weightKg}kg`,
      result: `BMI ${bmi.toFixed(1)} (${bmiCat.labelBn}) | ${tdee} kcal`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-300" />
              {isBn ? 'ডিজিটাল হেলথ ও ভাইটালস হাব' : 'Smart Digital Health Hub'}
            </span>
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'রিপোর্ট কপি' : 'Copy Report')}</span>
            </button>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isBn ? 'স্বাস্থ্য, বিএমআই ও প্রেসার লগবুক' : 'Health, BMI & Blood Pressure'}
          </h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            {isBn
              ? 'বিএমআই, রক্তচাপ ও ডায়াবেটিস লগবুক, হাইড্রেশন ট্র্যাকার এবং জীবনরক্ষাকারী ফার্স্ট এইড'
              : 'BMI, blood pressure & glucose logbook, hydration tracker and emergency first aid'}
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-6 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-[11px] font-bold">
        {[
          { id: 'bmi', labelBn: 'BMI', labelEn: 'BMI', icon: Scale },
          { id: 'bp', labelBn: 'প্রেসার', labelEn: 'BP Log', icon: Heart },
          { id: 'sugar', labelBn: 'সুগার', labelEn: 'Sugar', icon: Activity },
          { id: 'water', labelBn: 'পানি', labelEn: 'Water', icon: Droplets },
          { id: 'food', labelBn: 'খাদ্য', labelEn: 'Food', icon: Utensils },
          { id: 'firstaid', labelBn: 'এইড', labelEn: 'FirstAid', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="truncate w-full text-center leading-tight">
                {isBn ? tab.labelBn : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: BMI & CALORIE & IDEAL WEIGHT
         ========================================================================= */}
      {activeTab === 'bmi' && (
        <div className="flex flex-col gap-4">
          {/* Profile Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{isBn ? 'শারীরিক পরিমাপ ও বয়স দিন:' : 'Physical Measurements & Age:'}</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setGender('male')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    gender === 'male' ? 'bg-[#0B63F6] text-white' : 'text-slate-500'
                  }`}
                >
                  পুরুষ (Male)
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-500'
                  }`}
                >
                  মহিলা (Female)
                </button>
              </div>
            </div>

            {/* Height Inputs */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                উচ্চতা (Height):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={heightFeet || ''}
                  onChange={(e) => setHeightFeet(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                  placeholder="ফুট (Feet)"
                />
                <input
                  type="number"
                  value={heightInch || ''}
                  onChange={(e) => setHeightInch(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                  placeholder="ইঞ্চি (Inches)"
                />
              </div>
            </div>

            {/* Weight and Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ওজন কেজি (Weight):
                </label>
                <input
                  type="number"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                  placeholder="কেজি (kg)"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  বয়স (Age):
                </label>
                <input
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                  placeholder="বছর"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                দৈনিক শারীরিক পরিশ্রমের মাত্রা:
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
              >
                <option value="1.2">ব্যায়াম ছাড়া / বসে কাজ (Sedentary)</option>
                <option value="1.375">হালকা পরিশ্রম / সপ্তাহে ১-৩ দিন হাঁটা</option>
                <option value="1.55">মাঝারি পরিশ্রম / সপ্তাহে ৩-৫ দিন ব্যায়াম</option>
                <option value="1.725">ভারী পরিশ্রম / প্রতিদিন খেলাধুলা বা কায়িক শ্রম</option>
              </select>
            </div>
          </div>

          {/* BMI Result Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isBn ? 'আপনার বডি মাস ইনডেক্স (BMI) ফলাফল:' : 'BMI Result:'}
              </span>
              <span className={`text-xs font-extrabold ${bmiCat.color}`}>
                {isBn ? bmiCat.labelBn : bmiCat.labelEn}
              </span>
            </div>

            {/* Big Score Display */}
            <div className={`p-4 rounded-2xl border ${bmiCat.bg} flex items-center justify-between`}>
              <div>
                <h3 className={`text-3xl font-black font-mono ${bmiCat.color}`}>
                  {formatNumber(bmi.toFixed(1), lang)}
                  <span className="text-sm font-sans font-bold ml-1 text-slate-500">BMI</span>
                </h3>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {bmiCat.advice}
                </p>
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">আদর্শ স্বাভাবিক ওজন:</span>
                <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatNumber(minIdealWeight.toFixed(1), lang)} - {formatNumber(maxIdealWeight.toFixed(1), lang)} কেজি
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">স্বাভাবিক BMI ১৮.৫ - ২৪.৯</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">দৈনিক ক্যালরি চাহিদা (TDEE):</span>
                <span className="text-base font-extrabold font-mono text-[#0B63F6]">
                  {formatNumber(tdee, lang)} kcal
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">বর্তমান ওজন ধরে রাখতে</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">ওজন কমাতে দৈনিক ক্যালরি:</span>
                <span className="text-base font-extrabold font-mono text-amber-500">
                  {formatNumber(weightLossCal, lang)} kcal
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">প্রতি সপ্তাহে ০.৫ কেজি হ্রাস</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">দৈনিক পানির চাহিদা:</span>
                <span className="text-base font-extrabold font-mono text-cyan-500">
                  {formatNumber(customWaterGoalLiters, lang)} লিটার
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">প্রায় {customWaterGlassesGoal} গ্লাস পানি</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BLOOD PRESSURE LOGBOOK (রক্তচাপ ও প্রেসার ট্র্যাকার)
         ========================================================================= */}
      {activeTab === 'bp' && (
        <div className="flex flex-col gap-4">
          {/* BP Entry Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Heart size={14} className="text-rose-500" />
              {isBn ? 'রক্তচাপ পরিমাপ ইনপুট (mmHg):' : 'Blood Pressure Input:'}
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">সিস্টোলিক (উপরের)</label>
                <input
                  type="number"
                  value={bpSys}
                  onChange={(e) => setBpSys(Math.max(50, parseInt(e.target.value) || 0))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl text-center font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">স্বাভাবিক: ১২০</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">ডায়াস্টোলিক (নিচের)</label>
                <input
                  type="number"
                  value={bpDia}
                  onChange={(e) => setBpDia(Math.max(30, parseInt(e.target.value) || 0))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl text-center font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">স্বাভাবিক: ৮০</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">পালস (হৃদস্পন্দন)</label>
                <input
                  type="number"
                  value={bpPulse}
                  onChange={(e) => setBpPulse(Math.max(40, parseInt(e.target.value) || 0))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl text-center font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">BPM</span>
              </div>
            </div>

            {/* Current BP Evaluation Status */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ক্লিনিক্যাল স্ট্যাটাস:</span>
                <span className={`text-xs font-extrabold ${currentBpClass.colorClass}`}>
                  {currentBpClass.categoryBn}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentBpClass.adviceBn}
              </p>
            </div>

            {/* Note Input & Save Button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={bpNote}
                onChange={(e) => setBpNote(e.target.value)}
                placeholder="নোট (যেমন: সকালে নাস্তার পর, হাঁটার পর...)"
                className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs"
              />
              <button
                onClick={handleSaveBp}
                className="px-4 h-10 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={14} />
                <span>লগ সেভ</span>
              </button>
            </div>
          </div>

          {/* Stored BP History List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>সংরক্ষিত রক্তচাপ ইতিহাস ({bpRecords.length}টি):</span>
              <span className="text-[10px] text-slate-400 font-normal">সর্বশেষ ৫০টি রেকর্ড</span>
            </span>

            {bpRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                এখনো কোনো রক্তচাপ লগ সংরক্ষণ করা হয়নি। পরিমাপ লিখে ‘লগ সেভ’ বাটনে চাপুন।
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bpRecords.map((rec) => {
                  const dateStr = new Date(rec.timestamp).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatNumber(rec.systolic, lang)}/{formatNumber(rec.diastolic, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({formatNumber(rec.pulse, lang)} bpm)
                          </span>
                          <span className={`text-[11px] font-bold ${rec.colorClass}`}>
                            {rec.categoryBn.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <Clock size={10} />
                          <span>{dateStr}</span>
                          {rec.note && <span className="text-slate-500">| {rec.note}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBp(rec.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BLOOD SUGAR LOGBOOK (ডায়াবেটিস ও রক্তের শর্করা)
         ========================================================================= */}
      {activeTab === 'sugar' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Activity size={14} className="text-emerald-500" />
              {isBn ? 'রক্তের গ্লুকোজ / সুগার পরিমাপ (mmol/L):' : 'Blood Glucose Input:'}
            </span>

            {/* Timing Selector */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[
                { id: 'fasting', labelBn: 'খালি পেটে (Fasting)' },
                { id: 'post_meal', labelBn: 'খাবার ২ ঘণ্টা পর' },
                { id: 'random', labelBn: 'র‍্যান্ডম (যে কোনো সময়)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBsTiming(t.id as any)}
                  className={`py-2 px-1 rounded-xl border text-center transition ${
                    bsTiming === t.id
                      ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-[11px]">{t.labelBn}</span>
                </button>
              ))}
            </div>

            {/* Sugar Value Input */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  সুগার মান (mmol/L):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bsValue}
                  onChange={(e) => setBsValue(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base text-slate-900 dark:text-white"
                />
              </div>

              <div className="w-28 text-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block">mg/dL রূপান্তর:</span>
                <span className="text-sm font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {formatNumber(Math.round(bsValue * 18), lang)}
                </span>
                <span className="text-[9px] text-slate-400 block">mg/dL</span>
              </div>
            </div>

            {/* Status Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ডায়াবেটিস স্ট্যাটাস:</span>
                <span className={`text-xs font-extrabold ${currentBsClass.colorClass}`}>
                  {currentBsClass.categoryBn}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentBsClass.adviceBn}
              </p>
            </div>

            {/* Note & Save */}
            <div className="flex gap-2">
              <input
                type="text"
                value={bsNote}
                onChange={(e) => setBsNote(e.target.value)}
                placeholder="নোট (ওষুধ/ইনসুলিন নেওয়ার বিবরণ)..."
                className="flex-1 h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs"
              />
              <button
                onClick={handleSaveBs}
                className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus size={14} />
                <span>লগ সেভ</span>
              </button>
            </div>
          </div>

          {/* Stored Sugar History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              সংরক্ষিত সুগার ইতিহাস ({bsRecords.length}টি):
            </span>

            {bsRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                এখনো কোনো ব্লাড সুগার লগ সংরক্ষণ করা হয়নি।
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bsRecords.map((rec) => {
                  const dateStr = new Date(rec.timestamp).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                            {formatNumber(rec.valueMmol.toFixed(1), lang)} mmol/L
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({rec.timing === 'fasting' ? 'খালি পেটে' : rec.timing === 'post_meal' ? 'খাবারের পর' : 'র‍্যান্ডম'})
                          </span>
                          <span className={`text-[11px] font-bold ${rec.colorClass}`}>
                            {rec.categoryBn.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <Clock size={10} />
                          <span>{dateStr}</span>
                          {rec.note && <span className="text-slate-500">| {rec.note}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBs(rec.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DAILY WATER HYDRATION TRACKER (দৈনিক পানি ট্র্যাকার)
         ========================================================================= */}
      {activeTab === 'water' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets size={14} className="text-cyan-500" />
              {isBn ? 'আজকের দৈনিক পানি পান ট্র্যাকার (Hydration):' : 'Today’s Water Hydration Tracker:'}
            </span>

            {/* Circular Progress & Glass Counter */}
            <div className="relative w-44 h-44 rounded-full border-8 border-cyan-100 dark:border-cyan-950/60 flex flex-col items-center justify-center p-4 shadow-inner">
              <Droplets className="w-8 h-8 text-cyan-500 mb-1 animate-bounce" />
              <h3 className="text-4xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                {formatNumber(waterState.glasses, lang)}
                <span className="text-lg font-sans font-bold text-slate-400">/{formatNumber(waterState.goalGlasses, lang)}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500 mt-0.5">গ্লাস (Glass)</span>
              <span className="text-[10px] text-cyan-500 font-mono mt-0.5">
                {(waterState.glasses * 0.25).toFixed(2)} লিটার
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (waterState.glasses / waterState.goalGlasses) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>০%</span>
                <span>লক্ষ্য: {formatNumber(waterState.goalGlasses, lang)} গ্লাস ({(waterState.goalGlasses * 0.25).toFixed(1)}L)</span>
                <span>১০০%</span>
              </div>
            </div>

            {/* Action Buttons (+ and -) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleMinusGlass}
                disabled={waterState.glasses <= 0}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xl active:scale-90 transition disabled:opacity-30"
              >
                -
              </button>
              <button
                onClick={handleAddGlass}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-sm shadow-md active:scale-95 transition flex items-center gap-2"
              >
                <Plus size={16} />
                <span>+১ গ্লাস পানি খেলাম</span>
              </button>
            </div>

            {/* Health Hydration Advice */}
            <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left w-full">
              <span className="font-bold text-cyan-900 dark:text-cyan-300 block mb-1">
                💧 পানির উপকারিতা ও বৈজ্ঞানিক পরামর্শ:
              </span>
              পর্যাপ্ত পানি পান কিডনির কার্যকারিতা সচল রাখে, কোষ্ঠকাঠিন্য দূর করে, ত্বকের আর্দ্রতা বাড়ায় এবং মাথাব্যথা রোধ করে। প্রতি ১ ঘণ্টায় অন্তত ১ গ্লাস পানি পানের অভ্যাস গড়ে তুলুন।
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: BANGLADESHI FOOD CALORIE CHART (খাদ্য তালিকা)
         ========================================================================= */}
      {activeTab === 'food' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils size={14} className="text-[#0B63F6]" />
              {isBn ? 'দেশি খাবারের ক্যালরি ও প্রোটিন তালিকা:' : 'Bangladeshi Food Calorie Chart:'}
            </span>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                placeholder="খাবারের নাম লিখে খুঁজুন (যেমন: ভাত, মাছ, ডিম, দুধ)..."
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl pl-9 pr-3 text-xs font-bold"
              />
            </div>

            {/* Food Cards */}
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {filteredFoods.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {f.nameBn}
                    </span>
                    <span className="text-[10px] text-slate-400">{f.portion}</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-extrabold text-[#0B63F6] block">
                      {formatNumber(f.calories, lang)} kcal
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      প্রোটিন: {formatNumber(f.protein, lang)}g
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: EMERGENCY FIRST AID GUIDE (জীবনরক্ষাকারী প্রাথমিক চিকিৎসা)
         ========================================================================= */}
      {activeTab === 'firstaid' && (
        <div className="flex flex-col gap-4">
          {/* Emergency Hotline Banner */}
          <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black block">জাতীয় জরুরি সেবা: ৯৯৯ (999)</span>
                <span className="text-[11px] text-white/90">অ্যাম্বুলেন্স, পুলিশ ও ফায়ার সার্ভিস</span>
              </div>
            </div>
            <a
              href="tel:999"
              className="px-3.5 py-1.5 rounded-xl bg-white text-red-600 font-extrabold text-xs active:scale-95 transition"
            >
              কল করুন
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-500" />
              জরুরি মুহূর্তে জীবনরক্ষাকারী করণীয় ও বর্জনীয়:
            </span>

            <div className="flex flex-col gap-3">
              {FIRST_AID_GUIDES.map((g) => (
                <div
                  key={g.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-[13px]">
                      {g.titleBn}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                      {g.urgency === 'critical' ? 'জরুরি সংকট' : 'গুরুত্বপূর্ণ'}
                    </span>
                  </div>

                  {/* Dos */}
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                      ✓ কী করবেন:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                      {g.dosBn.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Don'ts */}
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                      ✗ কী করবেন না:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {g.dontsBn.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
