import React, { useState } from 'react';
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
  Droplet,
  Info,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type TabType = 'bmi' | 'calorie' | 'food';

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

export const BmiCalorieCalculator: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];
  const [activeTab, setActiveTab] = useState<TabType>('bmi');

  // Common Profile Inputs
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInch, setHeightInch] = useState<number>(6);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<number>(1.375); // Light activity
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Height conversion to meters & inches
  const totalInches = heightFeet * 12 + heightInch;
  const heightMeters = totalInches * 0.0254;

  // BMI Calculation
  let bmi = 0;
  if (heightMeters > 0 && weightKg > 0) {
    bmi = weightKg / (heightMeters * heightMeters);
  }

  // Ideal weight range based on normal BMI (18.5 - 24.9)
  const minIdealWeight = 18.5 * (heightMeters * heightMeters);
  const maxIdealWeight = 24.9 * (heightMeters * heightMeters);

  // BMI Category
  const getBmiCategory = (score: number) => {
    if (score < 18.5) {
      return {
        labelBn: 'কম ওজন (Underweight)',
        labelEn: 'Underweight',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/30',
        advice: 'পুষ্টিকর খাদ্যতালিকা ও স্বাস্থ্যকর উপায়ে ওজন বাড়ানোর দিকে মনোযোগ দিন।',
      };
    } else if (score <= 24.9) {
      return {
        labelBn: 'আদর্শ ও স্বাভাবিক ওজন (Normal)',
        labelEn: 'Normal weight',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        advice: 'চমৎকার! আপনার বর্তমান ওজন একদম সঠিক। নিয়মিত সুষম খাবার ও ব্যায়াম বজায় রাখুন।',
      };
    } else if (score <= 29.9) {
      return {
        labelBn: 'অতিরিক্ত ওজন (Overweight)',
        labelEn: 'Overweight',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10 border-orange-500/30',
        advice: 'প্রতিদিন ৩০ মিনিট হাঁটুন এবং অতিরিক্ত তেল, চিনি ও ভাজাপোড়া খাবার পরিহার করুন।',
      };
    } else {
      return {
        labelBn: 'স্থূলতা বা অতিরিক্ত মেদ (Obese)',
        labelEn: 'Obese',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10 border-rose-500/30',
        advice: 'নিয়ন্ত্রিত ক্যালরি গ্রহণ ও বিশেষজ্ঞ ডাক্তারের পরামর্শ নিয়ে ওজন কমানো প্রয়োজন।',
      };
    }
  };

  const bmiCat = getBmiCategory(bmi);

  // BMR (Mifflin-St Jeor Formula)
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * (totalInches * 2.54) - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * (totalInches * 2.54) - 5 * age - 161;
  }

  // TDEE (Total Daily Energy Expenditure)
  const tdee = Math.round(bmr * activityLevel);
  const weightLossCal = Math.max(1200, tdee - 500);
  const weightGainCal = tdee + 500;
  const recommendedWater = (weightKg * 0.033).toFixed(1);

  // Filter Food Database
  const filteredFoods = FOOD_DATABASE.filter((f) => {
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchQ =
      !foodSearch.trim() ||
      f.nameBn.toLowerCase().includes(foodSearch.toLowerCase()) ||
      f.nameEn.toLowerCase().includes(foodSearch.toLowerCase());
    return matchCat && matchQ;
  });

  const handleCopy = async () => {
    const text = `স্বাস্থ্য ও ক্যালরি রিপোর্ট:
উচ্চতা: ${heightFeet} ফুট ${heightInch} ইঞ্চি (${(heightMeters * 100).toFixed(0)} সেমি)
ওজন: ${weightKg} কেজি | বয়স: ${age} বছর (${gender === 'male' ? 'পুরুষ' : 'মহিলা'})
------------------------
BMI স্কোর: ${bmi.toFixed(1)} (${bmiCat.labelBn})
আদর্শ ওজন সীমা: ${minIdealWeight.toFixed(1)} - ${maxIdealWeight.toFixed(1)} কেজি
দৈনিক ক্যালরি চাহিদা (TDEE): ${tdee} kcal
ওজন কমাতে লক্ষ্য: ${weightLossCal} kcal
দৈনিক পানি পানের পরিমাণ: ${recommendedWater} লিটার`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'bmi-calorie',
      titleEn: 'BMI & Calorie Tracker',
      titleBn: 'BMI ও ক্যালরি ক্যালকুলেটর',
      expression: `${heightFeet}'${heightInch}" | ${weightKg}kg`,
      result: `BMI ${bmi.toFixed(1)} (${bmiCat.labelBn}) | ${tdee} kcal`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Tab Switcher */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-xs font-bold">
        {[
          { id: 'bmi', labelBn: 'BMI ও স্বাস্থ্য', labelEn: 'BMI & Health', icon: Scale },
          { id: 'calorie', labelBn: 'দৈনিক ক্যালরি', labelEn: 'Calories & BMR', icon: Flame },
          { id: 'food', labelBn: 'খাদ্য তালিকা', labelEn: 'Food Chart', icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                isSel ? 'bg-[#0B63F6] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Form (Common for BMI & Calorie) */}
      {(activeTab === 'bmi' || activeTab === 'calorie') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>শারীরিক পরিমাপ দিন:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
              <button
                onClick={() => setGender('male')}
                className={`px-2.5 py-1 rounded-md font-bold ${
                  gender === 'male' ? 'bg-[#0B63F6] text-white' : 'text-slate-500'
                }`}
              >
                পুরুষ (Male)
              </button>
              <button
                onClick={() => setGender('female')}
                className={`px-2.5 py-1 rounded-md font-bold ${
                  gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-500'
                }`}
              >
                মহিলা (Female)
              </button>
            </div>
          </div>

          {/* Height (Feet & Inches) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              উচ্চতা (Height):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  value={heightFeet || ''}
                  onChange={(e) => setHeightFeet(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ফুট</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={heightInch || ''}
                  onChange={(e) => setHeightInch(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ইঞ্চি</span>
              </div>
            </div>
          </div>

          {/* Weight & Age */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                ওজন (Weight):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">কেজি</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                বয়স (Age):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">বছর</span>
              </div>
            </div>
          </div>

          {/* Activity Level (Shown in Calorie Tab) */}
          {activeTab === 'calorie' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                দৈনিক শারীরিক পরিশ্রমের মাত্রা (Activity Level):
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-xs"
              >
                <option value={1.2}>বসে কাজ / শারীরিক পরিশ্রম নেই (Sedentary)</option>
                <option value={1.375}>হালকা হাঁটাচলা / সপ্তাহে ১-৩ দিন ব্যায়াম</option>
                <option value={1.55}>মাঝারি পরিশ্রম / সপ্তাহে ৩-৫ দিন ব্যায়াম</option>
                <option value={1.725}>ভারী পরিশ্রম / প্রতিদিন কড়া ব্যায়াম</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 1: BMI RESULT CARD
         ========================================================================= */}
      {activeTab === 'bmi' && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>আপনার BMI ফলাফল:</span>
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${bmiCat.bg} ${bmiCat.color}`}>
              {bmiCat.labelBn}
            </span>
          </div>

          {/* BMI Big Number */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">বডি ম্যাস ইনডেক্স (BMI):</span>
              <span className="text-4xl font-black font-mono text-emerald-400 mt-1">
                {formatNumber(bmi.toFixed(1), lang)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">আপনার আদর্শ ওজন হওয়া উচিত:</span>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {minIdealWeight.toFixed(1)} - {maxIdealWeight.toFixed(1)} কেজি
              </span>
            </div>
          </div>

          {/* Visual BMI Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>১৮.৫ (কম)</span>
              <span>২৪.৯ (স্বাভাবিক)</span>
              <span>২৯.৯ (বেশি)</span>
              <span>৩৫+ (স্থূল)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-700 flex overflow-hidden">
              <div className="w-1/4 bg-amber-400 h-full" title="Underweight" />
              <div className="w-1/4 bg-emerald-500 h-full" title="Normal" />
              <div className="w-1/4 bg-orange-500 h-full" title="Overweight" />
              <div className="w-1/4 bg-rose-500 h-full" title="Obese" />
            </div>
          </div>

          {/* Advice Box */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 leading-relaxed">
            💡 <strong className="text-white">স্বাস্থ্য পরামর্শ:</strong> {bmiCat.advice}
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : 'রিপোর্ট কপি করুন'}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CALORIE RESULT CARD
         ========================================================================= */}
      {activeTab === 'calorie' && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>দৈনিক ক্যালরি ও মেটাবলিক চাহিদা:</span>
          </span>

          {/* TDEE */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">বর্তমান ওজন ধরে রাখতে ক্যালরি (TDEE):</span>
              <span className="text-3xl font-black font-mono text-amber-400 mt-1">
                {formatNumber(tdee, lang)} <span className="text-sm font-sans text-slate-300">kcal/দিন</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">বেসাল মেটাবলিজম (BMR):</span>
              <span className="text-sm font-bold font-mono text-slate-200">{Math.round(bmr)} kcal</span>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold block">ওজন কমাতে চান?</span>
              <span className="text-lg font-mono font-black text-white mt-0.5">{weightLossCal} kcal</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">সপ্তাহে প্রায় ৫০০ গ্রাম কমবে</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-blue-400 font-bold block">ওজন বাড়াতে চান?</span>
              <span className="text-lg font-mono font-black text-white mt-0.5">{weightGainCal} kcal</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">সপ্তাহে প্রায় ৫০০ গ্রাম বাড়বে</span>
            </div>
          </div>

          {/* Water Intake */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center gap-2.5 text-xs text-blue-200">
            <Droplet className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              আপনার ওজনের জন্য দৈনিক সর্বনিম্ন <strong className="text-white font-bold">{recommendedWater} লিটার</strong> বিশুদ্ধ পানি পান করা আবশ্যক।
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : 'ক্যালরি চার্ট কপি করুন'}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FOOD CALORIE CHART (খাদ্য তালিকা)
         ========================================================================= */}
      {activeTab === 'food' && (
        <div className="flex flex-col gap-3">
          {/* Search & Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="খাবারের নাম খুঁজুন (যেমন: ভাত, ডিম, মাছ, দুধ)..."
              className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {[
              { id: 'all', label: 'সব' },
              { id: 'grain', label: 'ভাত/রুটি' },
              { id: 'protein', label: 'মাছ/মাংস/ডিম' },
              { id: 'dairy', label: 'দুধ/দই' },
              { id: 'fruit', label: 'ফলমূল' },
              { id: 'veg', label: 'শাকসবজি' },
              { id: 'snack', label: 'চা/নাস্তা' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-[#0B63F6] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Food Items List */}
          <div className="flex flex-col gap-2">
            {filteredFoods.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{f.nameBn}</h4>
                  <span className="text-[11px] text-slate-400 block mt-0.5">পরিমাণ: {f.portion}</span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-amber-500 block">
                    {f.calories} <span className="text-[10px] text-slate-400 font-sans">kcal</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                    প্রোটিন: {f.protein}g
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
