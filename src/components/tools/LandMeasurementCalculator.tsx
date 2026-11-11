import React, { useState } from 'react';
import {
  MapPin,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Layers,
  ArrowRightLeft,
  Users,
  Compass,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Shapes,
  BookOpen,
  FileText,
  Calculator,
  Printer,
  Scale,
  DollarSign,
  Share2,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';
import { LandPlotVisualizer } from './LandPlotVisualizer';
import {
  calculateFarayez,
  decimalToAnaGonda,
  anaGondaToDecimal,
  FarayezInput,
} from '../../utils/faraezEngine';
import {
  calculateLandRegistrationFees,
  DeedType,
  AreaType,
} from '../../utils/landRegistryEngine';

interface Props {
  lang: Language;
}

type MainTab = 'plot' | 'faraez' | 'khatiyan' | 'registry' | 'converter';
type ShapeType = 'quad' | 'triangles' | 'triangle' | 'curve';

interface TriangleSegment {
  id: string;
  nameBn: string;
  nameEn: string;
  aFt: number;
  aIn: number;
  bFt: number;
  bIn: number;
  cFt: number;
  cIn: number;
}

interface OffsetPoint {
  id: string;
  feet: number;
  inch: number;
}

// Calculate Heron's area from 3 sides in feet
function calculateHeronArea(a: number, b: number, c: number): { area: number; valid: boolean } {
  if (a <= 0 || b <= 0 || c <= 0) return { area: 0, valid: false };
  if (a + b <= c || a + c <= b || b + c <= a) return { area: 0, valid: false };
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  return { area, valid: true };
}

export const LandMeasurementCalculator: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];
  const [activeTab, setActiveTab] = useState<MainTab>('plot');
  const [shapeType, setShapeType] = useState<ShapeType>('quad');

  // ==========================================
  // TAB 1: PLOT MEASUREMENT (জমি পরিমাপ)
  // ==========================================
  // Shape 1: 4 বাহু ও কর্ণ
  const [l1Ft, setL1Ft] = useState<number>(100);
  const [l1In, setL1In] = useState<number>(0);
  const [l2Ft, setL2Ft] = useState<number>(105);
  const [l2In, setL2In] = useState<number>(0);
  const [w1Ft, setW1Ft] = useState<number>(50);
  const [w1In, setW1In] = useState<number>(0);
  const [w2Ft, setW2Ft] = useState<number>(52);
  const [w2In, setW2In] = useState<number>(0);

  const [useDiagonal, setUseDiagonal] = useState<boolean>(true);
  const [diagFt, setDiagFt] = useState<number>(115);
  const [diagIn, setDiagIn] = useState<number>(0);

  const l1Total = l1Ft + l1In / 12;
  const l2Total = l2Ft + l2In / 12;
  const w1Total = w1Ft + w1In / 12;
  const w2Total = w2Ft + w2In / 12;
  const diagTotal = diagFt + diagIn / 12;

  let quadAreaSqFt = 0;
  let quadValid = true;
  if (useDiagonal && diagTotal > 0) {
    const t1 = calculateHeronArea(l1Total, w1Total, diagTotal);
    const t2 = calculateHeronArea(l2Total, w2Total, diagTotal);
    if (t1.valid && t2.valid) {
      quadAreaSqFt = t1.area + t2.area;
    } else {
      quadValid = false;
      quadAreaSqFt = ((l1Total + l2Total) / 2) * ((w1Total + w2Total) / 2);
    }
  } else {
    quadAreaSqFt = ((l1Total + l2Total) / 2) * ((w1Total + w2Total) / 2);
  }

  // Shape 2: বহু-ত্রিভুজায়ন পদ্ধতি
  const [triangles, setTriangles] = useState<TriangleSegment[]>([
    {
      id: 't-1',
      nameBn: 'ত্রিভুজ ১ (প্রথম খণ্ড)',
      nameEn: 'Triangle 1 (Part A)',
      aFt: 80,
      aIn: 0,
      bFt: 60,
      bIn: 0,
      cFt: 100,
      cIn: 0,
    },
    {
      id: 't-2',
      nameBn: 'ত্রিভুজ ২ (দ্বিতীয় খণ্ড)',
      nameEn: 'Triangle 2 (Part B)',
      aFt: 100,
      aIn: 0,
      bFt: 75,
      bIn: 0,
      cFt: 90,
      cIn: 0,
    },
  ]);

  const triangleResults = triangles.map((tri) => {
    const a = tri.aFt + tri.aIn / 12;
    const b = tri.bFt + tri.bIn / 12;
    const c = tri.cFt + tri.cIn / 12;
    const { area, valid } = calculateHeronArea(a, b, c);
    return {
      ...tri,
      a,
      b,
      c,
      areaSqFt: area,
      shotok: area / 435.6,
      valid,
    };
  });

  const multiTriangleTotalSqFt = triangleResults.reduce(
    (sum, t) => sum + (t.valid ? t.areaSqFt : 0),
    0
  );
  const multiTriangleHasInvalid = triangleResults.some((t) => !t.valid);

  // Shape 3: তেকোনা ৩ বাহু
  const [triAFt, setTriAFt] = useState<number>(90);
  const [triAIn, setTriAIn] = useState<number>(0);
  const [triBFt, setTriBFt] = useState<number>(70);
  const [triBIn, setTriBIn] = useState<number>(0);
  const [triCFt, setTriCFt] = useState<number>(80);
  const [triCIn, setTriCIn] = useState<number>(0);

  const triATotal = triAFt + triAIn / 12;
  const triBTotal = triBFt + triBIn / 12;
  const triCTotal = triCFt + triCIn / 12;
  const singleTriResult = calculateHeronArea(triATotal, triBTotal, triCTotal);

  // Shape 4: আঁকা-বাঁকা সীমানা (অফসেট পদ্ধতি)
  const [intervalFt, setIntervalFt] = useState<number>(20);
  const [offsets, setOffsets] = useState<OffsetPoint[]>([
    { id: 'off-1', feet: 15, inch: 0 },
    { id: 'off-2', feet: 25, inch: 0 },
    { id: 'off-3', feet: 32, inch: 0 },
    { id: 'off-4', feet: 28, inch: 0 },
    { id: 'off-5', feet: 18, inch: 0 },
  ]);

  let curveAreaSqFt = 0;
  if (offsets.length >= 2 && intervalFt > 0) {
    const values = offsets.map((o) => o.feet + o.inch / 12);
    const first = values[0];
    const last = values[values.length - 1];
    const middleSum = values.slice(1, -1).reduce((acc, v) => acc + v, 0);
    curveAreaSqFt = intervalFt * ((first + last) / 2 + middleSum);
  }

  let totalSqFt = 0;
  if (shapeType === 'quad') totalSqFt = quadAreaSqFt;
  else if (shapeType === 'triangles') totalSqFt = multiTriangleTotalSqFt;
  else if (shapeType === 'triangle') totalSqFt = singleTriResult.valid ? singleTriResult.area : 0;
  else if (shapeType === 'curve') totalSqFt = curveAreaSqFt;

  // Conversions
  const shotok = totalSqFt / 435.6; // ১ শতক = ৪৩৫.৬ বর্গফুট
  const katha = totalSqFt / 720; // ১ কাঠা = ৭২০ বর্গফুট
  const bigha = totalSqFt / 14400; // ১ বিঘা = ১৪,৪০০ বর্গফুট
  const acre = totalSqFt / 43560; // ১ একর = ৪৩,৫৬০ বর্গফুট
  const chhatak = totalSqFt / 45; // ১ ছটাক = ৪৫ বর্গফুট
  const ganda = totalSqFt / 871.2; // ১ গণ্ডা = ৮৭১.২ বর্গফুট
  const sqMeter = totalSqFt * 0.092903;

  // ==========================================
  // TAB 2: ISLAMIC FARAEZ (ফারায়েজ ও ওয়ারিশ বণ্টন)
  // ==========================================
  const [faraezState, setFaraezState] = useState<FarayezInput>({
    deceasedGender: 'male',
    totalLandShotok: 33, // Default 1 bigha = 33 shotok
    totalValuationTaka: 5000000, // 50 Lakhs taka
    wifeCount: 1,
    hasHusband: false,
    sons: 2,
    daughters: 2,
    hasFather: false,
    hasMother: true,
    paternalGrandfather: false,
    grandmother: false,
    fullBrothers: 0,
    fullSisters: 0,
  });

  const faraezResult = calculateFarayez(faraezState);

  // ==========================================
  // TAB 3: KHATIYAN ANA-GONDA CONVERTER (পর্চার আনা-গণ্ডা)
  // ==========================================
  const [khAna, setKhAna] = useState<number>(4);
  const [khGonda, setKhGonda] = useState<number>(10);
  const [khKora, setKhKora] = useState<number>(2);
  const [khKranti, setKhKranti] = useState<number>(1);
  const [khTil, setKhTil] = useState<number>(0);
  const [khTotalPlotShotok, setKhTotalPlotShotok] = useState<number>(50); // Total dag shotok

  const khResult = anaGondaToDecimal(khAna, khGonda, khKora, khKranti, khTil);
  const khCalculatedShotok = khTotalPlotShotok * khResult.fraction;

  // Reverse: From Shotok to Ana-Gonda
  const [revShotokInput, setRevShotokInput] = useState<number>(12.5);
  const [revDagTotalShotok, setRevDagTotalShotok] = useState<number>(50);
  const revFraction =
    revDagTotalShotok > 0 ? Math.min(1, revShotokInput / revDagTotalShotok) : 0;
  const revAnaGonda = decimalToAnaGonda(revFraction);

  // ==========================================
  // TAB 4: LAND REGISTRY FEES (দলিল রেজিস্ট্রি খরচ)
  // ==========================================
  const [regDeedType, setRegDeedType] = useState<DeedType>('saf_kabala');
  const [regAreaType, setRegAreaType] = useState<AreaType>('city_corp');
  const [regDeedValue, setRegDeedValue] = useState<number>(2000000); // 20 Lakhs taka

  const regResult = calculateLandRegistrationFees({
    deedType: regDeedType,
    areaType: regAreaType,
    deedValueTaka: regDeedValue,
  });

  // ==========================================
  // TAB 5: GENERAL CONVERTER
  // ==========================================
  const [convValue, setConvValue] = useState<number>(10);
  const [convUnit, setConvUnit] = useState<string>('shotok');

  const getSqFtFromUnit = (val: number, u: string) => {
    switch (u) {
      case 'shotok':
        return val * 435.6;
      case 'katha':
        return val * 720;
      case 'bigha':
        return val * 14400;
      case 'acre':
        return val * 43560;
      case 'chhatak':
        return val * 45;
      case 'ganda':
        return val * 871.2;
      case 'sqft':
        return val;
      case 'sqm':
        return val * 10.7639;
      default:
        return val;
    }
  };
  const convSqFt = getSqFtFromUnit(convValue, convUnit);

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    let text = '';
    if (activeTab === 'plot') {
      text = `জমির ডিজিটাল পরিমাপের হিসাব:
মোট ক্ষেত্রফল: ${totalSqFt.toFixed(2)} বর্গফুট (${sqMeter.toFixed(2)} বর্গমিটার)
--------------------------------------
• শতক / ডেসিমেল: ${shotok.toFixed(3)} শতক
• কাঠা: ${katha.toFixed(3)} কাঠা
• বিঘা: ${bigha.toFixed(3)} বিঘা
• একর: ${acre.toFixed(4)} একর
• ছটাক: ${chhatak.toFixed(2)} ছটাক
• গণ্ডা: ${ganda.toFixed(2)} গণ্ডা`;
    } else if (activeTab === 'faraez') {
      text = `ইসলামিক ফারায়েজ ও ওয়ারিশ সম্পত্তি বণ্টন (মোট জমি: ${faraezState.totalLandShotok} শতক, মূল্য: ৳${faraezState.totalValuationTaka}):\n` +
        faraezResult.heirs
          .map(
            (h) =>
              `• ${h.roleBn}: ${h.totalShotok.toFixed(2)} শতক (${h.totalPercentage.toFixed(1)}%) | আনা-গণ্ডা: ${h.anaGondaText} | মূল্য: ৳${h.totalTaka.toLocaleString('en-IN')}`
          )
          .join('\n') +
        `\n\nব্যাখ্যা: ${faraezResult.explanationBn}`;
    } else if (activeTab === 'khatiyan') {
      text = `খতিয়ানের আনা-গণ্ডা হিসাব:
অংশ: ${khAna} আনা ${khGonda} গণ্ডা ${khKora} কড়া ${khKranti} ক্রান্তি ${khTil} তিল
সহস্রাংশ: ${khResult.sahasrangsho} / ১০০০
মোট ${khTotalPlotShotok} শতক জমির মধ্যে প্রাপ্তি: ${khCalculatedShotok.toFixed(3)} শতক`;
    } else if (activeTab === 'registry') {
      text = `দলিল রেজিস্ট্রি ও সরকারি ফি হিসাব (${regResult.deedTitleBn}):
মোট দলিলের মূল্য: ৳${regDeedValue.toLocaleString('en-IN')}
এলাকা: ${regResult.areaTitleBn}
মোট সরকারি ফি: ৳${regResult.totalGovtFees.toLocaleString('en-IN')}
--------------------------------------
` + regResult.feeItems.map((f) => `• ${f.nameBn} (${f.rateLabel}): ৳${f.amountTaka.toLocaleString('en-IN')}`).join('\n');
    } else {
      text = `জমির একক রূপান্তর: ${convValue} ${convUnit} = ${(convSqFt / 435.6).toFixed(3)} শতক (${convSqFt.toFixed(1)} বর্গফুট)`;
    }

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'land',
      titleEn: 'Land Measurement & Farayez',
      titleBn: 'জমির পরিমাপ ও ফারায়েজ',
      expression: `${activeTab.toUpperCase()}: ${totalSqFt.toFixed(1)} sq ft`,
      result: `${shotok.toFixed(3)} শতক`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-300" />
              {lang === 'bn' ? 'ডিজিটাল আমিন ও ল্যান্ড সার্ভেয়ার' : 'Smart Digital Land Surveyor'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition flex items-center gap-1 text-xs font-bold"
                title={lang === 'bn' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Survey Report'}
              >
                <Printer size={14} />
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {lang === 'bn' ? 'জমির পরিমাপ ও ইসলামিক ফারায়েজ' : 'Land Measurement & Farayez'}
          </h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            {lang === 'bn'
              ? 'নিখুঁত জ্যামিতিক নকশা, হেরন সূত্র, ১৬ আনা খতিয়ান পর্চা ও কুরআন-সুন্নাহ মোতাবেক উত্তরাধিকার সম্পত্তি বণ্টন'
              : 'Precision cadastre CAD, Heron triangulation, 16-Ana Khatiyan & Quranic inheritance distribution'}
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-5 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-[11px] font-bold">
        {[
          { id: 'plot', labelBn: 'জমি পরিমাপ', labelEn: 'Measure', icon: Compass },
          { id: 'faraez', labelBn: 'ফারায়েজ বণ্টন', labelEn: 'Farayez', icon: Scale },
          { id: 'khatiyan', labelBn: 'খতিয়ান পর্চা', labelEn: 'Khatiyan', icon: FileText },
          { id: 'registry', labelBn: 'দলিল ফি', labelEn: 'Registry', icon: DollarSign },
          { id: 'converter', labelBn: 'একক রূপান্তর', labelEn: 'Convert', icon: ArrowRightLeft },
        ].map((m) => {
          const Icon = m.icon;
          const isSel = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id as MainTab)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="truncate w-full text-center leading-tight">
                {lang === 'bn' ? m.labelBn : m.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: PLOT MEASUREMENT (জমি পরিমাপ)
         ========================================================================= */}
      {activeTab === 'plot' && (
        <div className="flex flex-col gap-4">
          {/* Shape Selector Sub-tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shapes size={14} className="text-[#0B63F6]" />
                {lang === 'bn' ? 'জমির ধরন ও জরিপ পদ্ধতি নির্বাচন করুন:' : 'Select Plot Shape & Method:'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                {
                  id: 'quad',
                  labelBn: '৪ বাহু ও কর্ণ পদ্ধতি',
                  labelEn: '4-Side & Diagonal',
                  descBn: 'আয়তাকার বা অসম ৪ কোনা জমি',
                },
                {
                  id: 'triangles',
                  labelBn: 'আঁকা-বাঁকা বহু-ত্রিভুজায়ন',
                  labelEn: 'Irregular Multi-Triangle',
                  descBn: 'অনেক বাঁকা জমিকে ত্রিভুজে ভাগ',
                },
                {
                  id: 'triangle',
                  labelBn: 'তেকোনা ৩ বাহু (হেরন সূত্র)',
                  labelEn: 'Triangle (Heron)',
                  descBn: '৩ কোনা জমির সঠিক পরিমাপ',
                },
                {
                  id: 'curve',
                  labelBn: 'নদী/রাস্তার বাঁকা সীমানা',
                  labelEn: 'Curved River/Road Offset',
                  descBn: 'অফসেট পদ্ধতিতে ট্রাপিজয়েডাল হিসাব',
                },
              ].map((s) => {
                const isSel = shapeType === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setShapeType(s.id as ShapeType)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSel
                        ? 'border-[#0B63F6] bg-blue-50/60 dark:bg-blue-950/40 text-[#0B63F6] shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-[12px]">{lang === 'bn' ? s.labelBn : s.labelEn}</span>
                    <span className="text-[10px] text-slate-500 font-normal mt-1">{s.descBn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Cadastral SVG Map */}
          {shapeType === 'quad' && (
            <LandPlotVisualizer
              type="quad"
              l1={l1Total}
              l2={l2Total}
              w1={w1Total}
              w2={w2Total}
              diag={useDiagonal ? diagTotal : 0}
              totalSqFt={totalSqFt}
              totalShotok={shotok}
              lang={lang}
            />
          )}

          {shapeType === 'triangles' && (
            <LandPlotVisualizer
              type="triangles"
              triangles={triangleResults}
              totalSqFt={totalSqFt}
              totalShotok={shotok}
              lang={lang}
            />
          )}

          {shapeType === 'triangle' && (
            <LandPlotVisualizer
              type="triangle"
              a={triATotal}
              b={triBTotal}
              c={triCTotal}
              totalSqFt={totalSqFt}
              totalShotok={shotok}
              valid={singleTriResult.valid}
              lang={lang}
            />
          )}

          {shapeType === 'curve' && (
            <LandPlotVisualizer
              type="curve"
              intervalFt={intervalFt}
              offsets={offsets}
              totalSqFt={totalSqFt}
              totalShotok={shotok}
              lang={lang}
            />
          )}

          {/* Inputs Section for Plot Measurement */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-500" />
              {lang === 'bn' ? 'সীমানা পরিমাপের মান ইনপুট (ফুট ও ইঞ্চি):' : 'Boundary Input (Feet & Inches):'}
            </h3>

            {/* Quad Inputs */}
            {shapeType === 'quad' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      উত্তর বাহু (দৈর্ঘ্য ১):
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={l1Ft || ''}
                          onChange={(e) => setL1Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ফুট"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          value={l1In || ''}
                          onChange={(e) => setL1In(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ইঞ্চি"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      দক্ষিণ বাহু (দৈর্ঘ্য ২):
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={l2Ft || ''}
                          onChange={(e) => setL2Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ফুট"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          value={l2In || ''}
                          onChange={(e) => setL2In(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ইঞ্চি"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      পশ্চিম বাহু (প্রস্থ ১):
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={w1Ft || ''}
                          onChange={(e) => setW1Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ফুট"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          value={w1In || ''}
                          onChange={(e) => setW1In(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ইঞ্চি"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      পূর্ব বাহু (প্রস্থ ২):
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={w2Ft || ''}
                          onChange={(e) => setW2Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ফুট"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          value={w2In || ''}
                          onChange={(e) => setW2In(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ইঞ্চি"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagonal Checkbox & Input */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0B63F6] flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useDiagonal}
                        onChange={(e) => setUseDiagonal(e.target.checked)}
                        className="rounded text-[#0B63F6] focus:ring-0"
                      />
                      <span>কর্ণ মেপে নিখুঁত হেরন সূত্রে হিসাব (আমিন পদ্ধতি)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">প্রস্তাবিত</span>
                  </div>

                  {useDiagonal && (
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={diagFt || ''}
                          onChange={(e) => setDiagFt(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-3 text-xs font-bold font-mono"
                          placeholder="কর্ণের দৈর্ঘ্য (ফুট)"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={diagIn || ''}
                          onChange={(e) => setDiagIn(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold font-mono text-center"
                          placeholder="ইঞ্চি"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Irregular Multi-triangles Inputs */}
            {shapeType === 'triangles' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    ত্রিভুজ খণ্ডসমূহ ({triangles.length}টি):
                  </span>
                  <button
                    onClick={() => {
                      setTriangles([
                        ...triangles,
                        {
                          id: `t-${Date.now()}`,
                          nameBn: `ত্রিভুজ ${triangles.length + 1}`,
                          nameEn: `Triangle ${triangles.length + 1}`,
                          aFt: 60,
                          aIn: 0,
                          bFt: 50,
                          bIn: 0,
                          cFt: 70,
                          cIn: 0,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 bg-[#0B63F6] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition"
                  >
                    <Plus size={12} />
                    <span>নতুন ত্রিভুজ যোগ</span>
                  </button>
                </div>

                {triangles.map((tri, idx) => (
                  <div
                    key={tri.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {tri.nameBn}
                      </span>
                      {triangles.length > 1 && (
                        <button
                          onClick={() => setTriangles(triangles.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">বাহু ১ (ফুট):</label>
                        <input
                          type="number"
                          value={tri.aFt || ''}
                          onChange={(e) => {
                            const updated = [...triangles];
                            updated[idx].aFt = parseFloat(e.target.value) || 0;
                            setTriangles(updated);
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">বাহু ২ (ফুট):</label>
                        <input
                          type="number"
                          value={tri.bFt || ''}
                          onChange={(e) => {
                            const updated = [...triangles];
                            updated[idx].bFt = parseFloat(e.target.value) || 0;
                            setTriangles(updated);
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">বাহু ৩ (ফুট):</label>
                        <input
                          type="number"
                          value={tri.cFt || ''}
                          onChange={(e) => {
                            const updated = [...triangles];
                            updated[idx].cFt = parseFloat(e.target.value) || 0;
                            setTriangles(updated);
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single Triangle Inputs */}
            {shapeType === 'triangle' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">বাহু ক (ফুট):</label>
                  <input
                    type="number"
                    value={triAFt || ''}
                    onChange={(e) => setTriAFt(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold text-center"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">বাহু খ (ফুট):</label>
                  <input
                    type="number"
                    value={triBFt || ''}
                    onChange={(e) => setTriBFt(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold text-center"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">বাহু গ (ফুট):</label>
                  <input
                    type="number"
                    value={triCFt || ''}
                    onChange={(e) => setTriCFt(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold text-center"
                  />
                </div>
              </div>
            )}

            {/* Curve Offsets Inputs */}
            {shapeType === 'curve' && (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    অফসেট ব্যবধান d (ফুট):
                  </label>
                  <input
                    type="number"
                    value={intervalFt || ''}
                    onChange={(e) => setIntervalFt(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-24 h-9 bg-white dark:bg-slate-900 border rounded-xl px-2 text-xs font-bold text-center"
                  />
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {offsets.map((off, idx) => (
                    <div key={off.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                      <label className="text-[9px] text-slate-500 font-bold block">O{idx + 1}</label>
                      <input
                        type="number"
                        value={off.feet || ''}
                        onChange={(e) => {
                          const updated = [...offsets];
                          updated[idx].feet = parseFloat(e.target.value) || 0;
                          setOffsets(updated);
                        }}
                        className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Complete Land Unit Breakdown Cards */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'জমির বিস্তারিত একক ফলাফল:' : 'Detailed Regional Land Area Breakdown:'}
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 font-bold block">শতক / ডেসিমেল (Shotok):</span>
                <span className="text-lg font-extrabold text-emerald-300 font-mono">
                  {formatNumber(shotok.toFixed(3), lang)}
                </span>
                <span className="text-[9px] text-emerald-400/80 block mt-0.5">১ শতক = ৪৩৫.৬ বর্গফুট</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30">
                <span className="text-[10px] text-blue-400 font-bold block">কাঠা (Katha):</span>
                <span className="text-lg font-extrabold text-blue-300 font-mono">
                  {formatNumber(katha.toFixed(3), lang)}
                </span>
                <span className="text-[9px] text-blue-400/80 block mt-0.5">১ কাঠা = ৭২০ বর্গফুট (১.৬৫ শতক)</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold block">বিঘা (Bigha):</span>
                <span className="text-base font-extrabold text-amber-300 font-mono">
                  {formatNumber(bigha.toFixed(4), lang)}
                </span>
                <span className="text-[9px] text-amber-400/80 block mt-0.5">১ বিঘা = ২০ কাঠা (৩৩.৩৩ শতক)</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30">
                <span className="text-[10px] text-purple-400 font-bold block">একর (Acre):</span>
                <span className="text-base font-extrabold text-purple-300 font-mono">
                  {formatNumber(acre.toFixed(4), lang)}
                </span>
                <span className="text-[9px] text-purple-400/80 block mt-0.5">১ একর = ১০০ শতক (৩ বিঘা ৮ ছটাক)</span>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-400 font-bold block">ছটাক (Chhatak):</span>
                <span className="text-base font-extrabold text-cyan-300 font-mono">
                  {formatNumber(chhatak.toFixed(2), lang)}
                </span>
                <span className="text-[9px] text-cyan-400/80 block mt-0.5">১ ছটাক = ৪৫ বর্গফুট</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 font-bold block">গণ্ডা (Ganda):</span>
                <span className="text-base font-extrabold text-rose-300 font-mono">
                  {formatNumber(ganda.toFixed(2), lang)}
                </span>
                <span className="text-[9px] text-rose-400/80 block mt-0.5">১ গণ্ডা = ৮৭১.২ বর্গফুট (২ শতক)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>বর্গফুট: {formatNumber(totalSqFt.toFixed(2), lang)} sq ft</span>
              <span>বর্গমিটার: {formatNumber(sqMeter.toFixed(2), lang)} sq m</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ISLAMIC FARAEZ (ইসলামিক ফারায়েজ ও ওয়ারিশ সম্পত্তি বণ্টন)
         ========================================================================= */}
      {activeTab === 'faraez' && (
        <div className="flex flex-col gap-4">
          {/* Faraez Config Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                <BookOpen size={13} className="text-emerald-500" />
                {lang === 'bn' ? 'মৃত ব্যক্তি ও মোট সম্পত্তির পরিমাণ:' : 'Deceased & Property Assets:'}
              </span>
            </div>

            {/* Deceased Gender */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setFaraezState({
                    ...faraezState,
                    deceasedGender: 'male',
                    hasHusband: false,
                    wifeCount: faraezState.wifeCount || 1,
                  })
                }
                className={`py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  faraezState.deceasedGender === 'male'
                    ? 'border-[#0B63F6] bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                <span>মৃত ব্যক্তি: পুরুষ (স্বামী/পিতা)</span>
              </button>

              <button
                onClick={() =>
                  setFaraezState({
                    ...faraezState,
                    deceasedGender: 'female',
                    hasHusband: true,
                    wifeCount: 0,
                  })
                }
                className={`py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  faraezState.deceasedGender === 'female'
                    ? 'border-[#0B63F6] bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                <span>মৃত ব্যক্তি: মহিলা (স্ত্রী/মাতা)</span>
              </button>
            </div>

            {/* Total Land & Valuation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মোট জমির পরিমাণ (শতক):
                </label>
                <input
                  type="number"
                  value={faraezState.totalLandShotok || ''}
                  onChange={(e) =>
                    setFaraezState({
                      ...faraezState,
                      totalLandShotok: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মোট মূল্যায়ন / টাকা (ঐচ্ছিক):
                </label>
                <input
                  type="number"
                  value={faraezState.totalValuationTaka || ''}
                  onChange={(e) =>
                    setFaraezState({
                      ...faraezState,
                      totalValuationTaka: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono text-sm"
                  placeholder="টাকায় মূল্যমান"
                />
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Heirs Selector Grid */}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              জীবিত ওয়ারিশদের সংখ্যা নির্বাচন করুন:
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Spouse */}
              {faraezState.deceasedGender === 'male' ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">স্ত্রী (Wife):</span>
                  <select
                    value={faraezState.wifeCount}
                    onChange={(e) =>
                      setFaraezState({ ...faraezState, wifeCount: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                  >
                    <option value="0">নেই (০)</option>
                    <option value="1">১ জন</option>
                    <option value="2">২ জন</option>
                    <option value="3">৩ জন</option>
                    <option value="4">৪ জন</option>
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">স্বামী (Husband):</span>
                  <input
                    type="checkbox"
                    checked={faraezState.hasHusband}
                    onChange={(e) =>
                      setFaraezState({ ...faraezState, hasHusband: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#0B63F6]"
                  />
                </div>
              )}

              {/* Mother */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">মাতা (Mother):</span>
                <input
                  type="checkbox"
                  checked={faraezState.hasMother}
                  onChange={(e) =>
                    setFaraezState({ ...faraezState, hasMother: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#0B63F6]"
                />
              </div>

              {/* Father */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">পিতা (Father):</span>
                <input
                  type="checkbox"
                  checked={faraezState.hasFather}
                  onChange={(e) =>
                    setFaraezState({ ...faraezState, hasFather: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#0B63F6]"
                />
              </div>

              {/* Sons */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">পুত্র (Sons):</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={faraezState.sons}
                  onChange={(e) =>
                    setFaraezState({ ...faraezState, sons: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-16 h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center"
                />
              </div>

              {/* Daughters */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">কন্যা (Daughters):</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={faraezState.daughters}
                  onChange={(e) =>
                    setFaraezState({
                      ...faraezState,
                      daughters: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-16 h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center"
                />
              </div>

              {/* Brothers / Sisters (if no sons & father) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">সহোদর ভাই:</span>
                <input
                  type="number"
                  min="0"
                  value={faraezState.fullBrothers}
                  onChange={(e) =>
                    setFaraezState({
                      ...faraezState,
                      fullBrothers: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-16 h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Faraez Output Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Scale size={14} className="text-emerald-500" />
                ওয়ারিশদের মধ্যে সম্পত্তি বণ্টনের ফলাফল:
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                মোট বণ্টন: {faraezResult.totalDistributedPercentage.toFixed(1)}%
              </span>
            </div>

            {/* Explanation / Notes Banner */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
              <span className="font-bold block mb-1">কুরআন-সুন্নাহ ও ফিকহ নীতিমালা:</span>
              <p>{faraezResult.explanationBn}</p>
            </div>

            {/* Heir Cards */}
            <div className="flex flex-col gap-2.5">
              {faraezResult.heirs.map((heir, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {heir.roleBn}
                    </span>
                    <span className="text-[11px] font-bold text-[#0B63F6] font-mono">
                      {heir.totalPercentage.toFixed(2)}% ({heir.quranicShareLabel})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">প্রাপ্ত জমি:</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                        {heir.totalShotok.toFixed(3)} শতক
                      </span>
                      {heir.count > 1 && (
                        <span className="text-[9px] text-slate-500 block">
                          (জনপ্রতি {heir.individualShotok.toFixed(3)} শতক)
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">খতিয়ান আনা-গণ্ডা:</span>
                      <span className="font-bold font-mono text-purple-600 dark:text-purple-400 text-xs truncate block">
                        {heir.anaGondaText}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {heir.totalSqFt.toFixed(0)} বর্গফুট
                      </span>
                    </div>
                  </div>

                  {faraezState.totalValuationTaka > 0 && (
                    <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-300 font-mono">
                      <span>মূল্যমান: ৳{heir.totalTaka.toLocaleString('en-IN')}</span>
                      {heir.count > 1 && (
                        <span>(জনপ্রতি ৳{heir.individualTaka.toLocaleString('en-IN')})</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KHATIYAN ANA-GONDA CONVERTER (খতিয়ানের আনা-গণ্ডা ক্যালকুলেটর)
         ========================================================================= */}
      {activeTab === 'khatiyan' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-500" />
                সিএস, এসএ, আরএস, বিএস খতিয়ান রূপান্তর (১৬ আনা = সম্পূর্ণ):
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-xs">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">আনা (Ana)</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={khAna}
                  onChange={(e) => setKhAna(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                />
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">গণ্ডা (Gonda)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={khGonda}
                  onChange={(e) => setKhGonda(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                />
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">কড়া (Kora)</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={khKora}
                  onChange={(e) => setKhKora(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                />
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">ক্রান্তি (Kranti)</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={khKranti}
                  onChange={(e) => setKhKranti(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                />
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">তিল (Til)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={khTil}
                  onChange={(e) => setKhTil(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold text-center font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                উক্ত দাগের মোট জমির পরিমাণ (শতক):
              </label>
              <input
                type="number"
                value={khTotalPlotShotok || ''}
                onChange={(e) => setKhTotalPlotShotok(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono text-sm"
              />
            </div>

            {/* Result Box */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  খতিয়ানের অংশ থেকে প্রাপ্ত শতক:
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {khCalculatedShotok.toFixed(3)} শতক
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                <span>সহস্রাংশ: {khResult.sahasrangsho} / ১০০০</span>
                <span>শতকরা হার: {khResult.percentage.toFixed(2)}%</span>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Reverse Converter */}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              বিপরীত হিসাব: শতক থেকে খতিয়ানের আনা-গণ্ডা নির্ণয়
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">ব্যক্তির জমি (শতক):</label>
                <input
                  type="number"
                  value={revShotokInput || ''}
                  onChange={(e) => setRevShotokInput(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">মোট দাগের জমি (শতক):</label>
                <input
                  type="number"
                  value={revDagTotalShotok || ''}
                  onChange={(e) => setRevDagTotalShotok(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-purple-900 dark:text-purple-300 font-bold">পর্চায় লেখার আনা-গণ্ডা:</span>
              <span className="font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                {revAnaGonda.textBn}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: LAND REGISTRATION FEES (দলিল রেজিস্ট্রি ও সরকারি ফি)
         ========================================================================= */}
      {activeTab === 'registry' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <DollarSign size={14} className="text-emerald-500" />
              দলিল ও এলাকার ধরন নির্বাচন:
            </span>

            {/* Deed Type */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">দলিলের প্রকার:</label>
              <select
                value={regDeedType}
                onChange={(e) => setRegDeedType(e.target.value as DeedType)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
              >
                <option value="saf_kabala">সাফ-কবলা দলিল (জমি বিক্রয় ও ক্রয়)</option>
                <option value="heba_blood">রক্তের সম্পর্কের হেবা দলিল (পিতা, মাতা, সন্তান, ভাই-বোন)</option>
                <option value="bonton_nama">আপস বণ্টননামা দলিল (ওয়ারিশদের মধ্যে জমি ভাগ)</option>
                <option value="danpotro">সাধারণ দানপত্র দলিল</option>
              </select>
            </div>

            {/* Area Type */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">এলাকার ধরন:</label>
              <select
                value={regAreaType}
                onChange={(e) => setRegAreaType(e.target.value as AreaType)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
              >
                <option value="city_corp">সিটি কর্পোরেশন এলাকা</option>
                <option value="pouroshova">পৌরসভা এলাকা</option>
                <option value="union_parishad">ইউনিয়ন পরিষদ (পল্লী এলাকা)</option>
              </select>
            </div>

            {/* Deed Value */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                দলিলের মূল্য বা মৌজা রেট (টাকা):
              </label>
              <input
                type="number"
                value={regDeedValue || ''}
                onChange={(e) => setRegDeedValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm"
              />
            </div>

            {/* Total Fees Card */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-blue-200 block font-medium">আনুমানিক সর্বমোট সরকারি ফি:</span>
                <span className="text-xl font-extrabold font-mono">
                  ৳{regResult.totalGovtFees.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-xl backdrop-blur-xs font-bold">
                {regResult.areaTitleBn}
              </span>
            </div>

            {/* Fee Itemized List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                সরকারি ফি ও চালানের বিস্তারিত বিবরণ:
              </span>

              {regResult.feeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {item.nameBn}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.noteBn}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                      ৳{item.amountTaka.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.rateLabel})</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legal Tips */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <span className="font-bold block mb-1">গুরুত্বপূর্ণ সরকারি পরামর্শ:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {regResult.tipsBn.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CONVERTER (একক রূপান্তর)
         ========================================================================= */}
      {activeTab === 'converter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            জমির একক রূপান্তর ক্যালকুলেটর:
          </label>

          <div className="flex gap-2">
            <input
              type="number"
              value={convValue || ''}
              onChange={(e) => setConvValue(parseFloat(e.target.value) || 0)}
              className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-sm"
            />
            <select
              value={convUnit}
              onChange={(e) => setConvUnit(e.target.value)}
              className="w-32 h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 text-xs font-bold"
            >
              <option value="shotok">শতক (Decimal)</option>
              <option value="katha">কাঠা (Katha)</option>
              <option value="bigha">বিঘা (Bigha)</option>
              <option value="acre">একর (Acre)</option>
              <option value="chhatak">ছটাক (Chhatak)</option>
              <option value="ganda">গণ্ডা (Ganda)</option>
              <option value="sqft">বর্গফুট (Sq Ft)</option>
              <option value="sqm">বর্গমিটার (Sq M)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-bold">সমপরিমাণ রূপান্তর:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">শতক / ডেসিমেল:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {(convSqFt / 435.6).toFixed(3)} শতক
                </span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">কাঠা:</span>
                <span className="font-bold font-mono text-blue-400">
                  {(convSqFt / 720).toFixed(3)} কাঠা
                </span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">বিঘা:</span>
                <span className="font-bold font-mono text-amber-400">
                  {(convSqFt / 14400).toFixed(4)} বিঘা
                </span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">ছটাক:</span>
                <span className="font-bold font-mono text-teal-400">
                  {(convSqFt / 45).toFixed(2)} ছটাক
                </span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">একর:</span>
                <span className="font-bold font-mono text-purple-400">
                  {(convSqFt / 43560).toFixed(4)} একর
                </span>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block">বর্গফুট:</span>
                <span className="font-bold font-mono text-white">
                  {convSqFt.toFixed(1)} sq ft
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
