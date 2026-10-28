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
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type MainTab = 'plot' | 'converter' | 'share';
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
  const [shapeType, setShapeType] = useState<ShapeType>('triangles'); // Default to irregular multi-triangle

  // ==========================================
  // SHAPE 1: 4 বাহুর জমি (চতুর্ভুজ + কর্ণ)
  // ==========================================
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

  // Quad calculation
  let quadAreaSqFt = 0;
  let quadValid = true;
  if (useDiagonal && diagTotal > 0) {
    // Triangle 1: l1, w1, diag
    const t1 = calculateHeronArea(l1Total, w1Total, diagTotal);
    // Triangle 2: l2, w2, diag
    const t2 = calculateHeronArea(l2Total, w2Total, diagTotal);
    if (t1.valid && t2.valid) {
      quadAreaSqFt = t1.area + t2.area;
    } else {
      quadValid = false;
      // Fallback to average if triangle inequality broken
      quadAreaSqFt = ((l1Total + l2Total) / 2) * ((w1Total + w2Total) / 2);
    }
  } else {
    // Average method (গড় পদ্ধতি)
    quadAreaSqFt = ((l1Total + l2Total) / 2) * ((w1Total + w2Total) / 2);
  }

  // ==========================================
  // SHAPE 2: আঁকা-বাঁকা বহুভুজ জমি (বহু-ত্রিভুজায়ন পদ্ধতি)
  // ==========================================
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

  // ==========================================
  // SHAPE 3: তেকোনা জমি (৩ বাহুর ত্রিভুজ)
  // ==========================================
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

  // ==========================================
  // SHAPE 4: নদী বা রাস্তার আঁকা-বাঁকা সীমানা (অফসেট পদ্ধতি)
  // ==========================================
  const [intervalFt, setIntervalFt] = useState<number>(20);
  const [offsets, setOffsets] = useState<OffsetPoint[]>([
    { id: 'off-1', feet: 15, inch: 0 },
    { id: 'off-2', feet: 25, inch: 0 },
    { id: 'off-3', feet: 32, inch: 0 },
    { id: 'off-4', feet: 28, inch: 0 },
    { id: 'off-5', feet: 18, inch: 0 },
  ]);

  // Trapezoidal formula: d * [ (O1 + On)/2 + O2 + O3 + ... + On-1 ]
  let curveAreaSqFt = 0;
  if (offsets.length >= 2 && intervalFt > 0) {
    const values = offsets.map((o) => o.feet + o.inch / 12);
    const first = values[0];
    const last = values[values.length - 1];
    const middleSum = values.slice(1, -1).reduce((acc, v) => acc + v, 0);
    curveAreaSqFt = intervalFt * ((first + last) / 2 + middleSum);
  }

  // Active Total Area Determination based on current ShapeType
  let totalSqFt = 0;
  if (shapeType === 'quad') {
    totalSqFt = quadAreaSqFt;
  } else if (shapeType === 'triangles') {
    totalSqFt = multiTriangleTotalSqFt;
  } else if (shapeType === 'triangle') {
    totalSqFt = singleTriResult.valid ? singleTriResult.area : 0;
  } else if (shapeType === 'curve') {
    totalSqFt = curveAreaSqFt;
  }

  // Conversions
  const shotok = totalSqFt / 435.6; // ১ শতক = ৪৩৫.৬ বর্গফুট
  const katha = totalSqFt / 720; // ১ কাঠা = ৭২০ বর্গফুট
  const bigha = totalSqFt / 14400; // ১ বিঘা = ১৪,৪০০ বর্গফুট (২০ কাঠা বা ৩৩.০৫৭ শতক)
  const acre = totalSqFt / 43560; // ১ একর = ৪৩,৫৬০ বর্গফুট (১০০ শতক)
  const chhatak = totalSqFt / 45; // ১ ছটাক = ৪৫ বর্গফুট
  const ganda = totalSqFt / 871.2; // ১ গণ্ডা = ৮৭১.২ বর্গফুট (২ শতক)
  const sqMeter = totalSqFt * 0.092903; // ১ বর্গমিটার = ১০.৭৬৪ বর্গফুট

  // ==========================================
  // TAB 2: CONVERTER
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

  // ==========================================
  // TAB 3: SHARE / FARAIZ (অংশীদার ভাগ)
  // ==========================================
  const [totalLandShotok, setTotalLandShotok] = useState<number>(33);
  const [shares, setShares] = useState<{ id: string; name: string; shareRatio: number }[]>([
    { id: '1', name: 'ওয়ারিশ ১ (পুত্র/অংশীদার)', shareRatio: 8 },
    { id: '2', name: 'ওয়ারিশ ২ (কন্যা/অংশীদার)', shareRatio: 4 },
  ]);

  const totalShareSum = shares.reduce((acc, s) => acc + s.shareRatio, 0) || 1;

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    let text = '';
    const shapeLabel =
      shapeType === 'triangles'
        ? 'আঁকা-বাঁকা বহু-ত্রিভুজ পদ্ধতি'
        : shapeType === 'quad'
        ? '৪ বাহু ও কর্ণ পদ্ধতি'
        : shapeType === 'triangle'
        ? 'তেকোনা ৩ বাহু পদ্ধতি'
        : 'নদী/রাস্তার বাঁকা সীমানা অফসেট পদ্ধতি';

    if (activeTab === 'plot') {
      text = `জমির পরিমাপের হিসাব (${shapeLabel}):
মোট ক্ষেত্রফল: ${totalSqFt.toFixed(2)} বর্গফুট (${sqMeter.toFixed(2)} বর্গমিটার)
--------------------------------------
শতক / ডেসিমেল: ${shotok.toFixed(3)} শতক
কাঠা: ${katha.toFixed(3)} কাঠা
বিঘা: ${bigha.toFixed(3)} বিঘা
ছটাক: ${chhatak.toFixed(2)} ছটাক
একর: ${acre.toFixed(4)} একর
গণ্ডা: ${ganda.toFixed(2)} গণ্ডা`;

      if (shapeType === 'triangles') {
        text += `\n\nখণ্ড ত্রিভুজসমূহের বিবরণ:`;
        triangleResults.forEach((tr, i) => {
          text += `\n• ${tr.nameBn}: বাহু(${tr.a.toFixed(1)}', ${tr.b.toFixed(1)}', ${tr.c.toFixed(1)}') = ${tr.areaSqFt.toFixed(1)} বর্গফুট (${tr.shotok.toFixed(3)} শতক)`;
        });
      }
    } else if (activeTab === 'converter') {
      text = `জমির একক রূপান্তর: ${convValue} ${convUnit} = ${(convSqFt / 435.6).toFixed(3)} শতক (${convSqFt.toFixed(1)} বর্গফুট)`;
    } else {
      text = `জমির অংশীদার বণ্টন (মোট ${totalLandShotok} শতক):\n` +
        shares
          .map((s) => {
            const pShotok = (totalLandShotok * s.shareRatio) / totalShareSum;
            return `• ${s.name}: ${pShotok.toFixed(2)} শতক (${(pShotok * 435.6).toFixed(0)} বর্গফুট)`;
          })
          .join('\n');
    }

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'land',
      titleEn: 'Land Measurement',
      titleBn: 'জমির হিসাব ও পরিমাপক',
      expression: `${totalSqFt.toFixed(1)} sq ft (${shapeLabel})`,
      result: `${shotok.toFixed(3)} শতক / ${katha.toFixed(2)} কাঠা`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none">
      {/* Main Tab Switcher */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-xs font-bold">
        {[
          { id: 'plot', labelBn: 'জমি পরিমাপ', labelEn: 'Plot Measure', icon: Compass },
          { id: 'converter', labelBn: 'একক রূপান্তর', labelEn: 'Converter', icon: ArrowRightLeft },
          { id: 'share', labelBn: 'অংশীদার ভাগ', labelEn: 'Land Shares', icon: Users },
        ].map((m) => {
          const Icon = m.icon;
          const isSel = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id as MainTab)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? m.labelBn : m.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: PLOT MEASUREMENT (জমি পরিমাপ)
         ========================================================================= */}
      {activeTab === 'plot' && (
        <div className="flex flex-col gap-4">
          {/* Shape Selector Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block px-2 pb-1.5">
              {lang === 'bn' ? 'জমির ধরন নির্বাচন করুন:' : 'Select Land Shape:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
              {[
                {
                  id: 'triangles',
                  labelBn: 'আঁকা-বাঁকা জমি',
                  subBn: 'বহু-ত্রিভুজ পদ্ধতি',
                  labelEn: 'Irregular Land',
                  highlight: true,
                },
                {
                  id: 'quad',
                  labelBn: '৪ বাহু ও কর্ণ',
                  subBn: 'চতুর্ভুজ জমি',
                  labelEn: '4-Sided + Diag',
                },
                {
                  id: 'triangle',
                  labelBn: 'তেকোনা জমি',
                  subBn: '৩ বাহুর পরিমাপ',
                  labelEn: '3-Sided Triangle',
                },
                {
                  id: 'curve',
                  labelBn: 'বাঁকা নদী/রাস্তা',
                  subBn: 'অফসেট পদ্ধতি',
                  labelEn: 'Curved Offset',
                },
              ].map((s) => {
                const isSel = shapeType === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setShapeType(s.id as ShapeType)}
                    className={`py-2 px-2 rounded-xl text-center transition flex flex-col items-center justify-center ${
                      isSel
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-2 border-[#0B63F6] text-[#0B63F6] dark:text-blue-400 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="leading-tight block font-extrabold text-[11px]">
                      {lang === 'bn' ? s.labelBn : s.labelEn}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal block mt-0.5 truncate max-w-full">
                      {lang === 'bn' ? s.subBn : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =============================================================
              SUB-MODE: আঁকা-বাঁকা জমি (বহু-ত্রিভুজায়ন পদ্ধতি)
             ============================================================= */}
          {shapeType === 'triangles' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Shapes className="w-4 h-4 text-[#0B63F6]" />
                    <span>{lang === 'bn' ? 'আঁকা-বাঁকা জমির ত্রিভুজায়ন পদ্ধতি' : 'Irregular Triangulation'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'আমিনদের নিয়ম অনুযায়ী জমিকে বিভিন্ন ত্রিভুজে ভাগ করে ৩টি বাহুর মাপ দিন'
                      : "Divide irregular plot into triangles and input 3 side lengths for each"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const nextNum = triangles.length + 1;
                    setTriangles([
                      ...triangles,
                      {
                        id: `t-${Date.now()}`,
                        nameBn: `ত্রিভুজ ${nextNum} (${nextNum === 3 ? 'তৃতীয়' : nextNum === 4 ? 'চতুর্থ' : 'পরবর্তী'} খণ্ড)`,
                        nameEn: `Triangle ${nextNum}`,
                        aFt: 70,
                        aIn: 0,
                        bFt: 65,
                        bIn: 0,
                        cFt: 85,
                        cIn: 0,
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0B63F6] dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ ত্রিভুজ যোগ' : '+ Add Triangle'}</span>
                </button>
              </div>

              {/* Triangle Cards List */}
              <div className="flex flex-col gap-3">
                {triangles.map((tri, idx) => {
                  const res = triangleResults[idx];
                  return (
                    <div
                      key={tri.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-2.5 transition"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className="flex items-center gap-1.5 text-[#0B63F6]">
                          <span className="w-5 h-5 rounded-full bg-[#0B63F6] text-white flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span>{lang === 'bn' ? tri.nameBn : tri.nameEn}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {res && res.valid ? (
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              {res.shotok.toFixed(3)} শতক ({res.areaSqFt.toFixed(1)} sq ft)
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>অসম্ভব মাপ</span>
                            </span>
                          )}
                          {triangles.length > 1 && (
                            <button
                              onClick={() => setTriangles(triangles.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-500 p-1 transition"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3 Sides inputs (Side A, Side B, Side C) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Side A */}
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            বাহু ১ (Side A)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.aFt || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].aFt = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ফুট
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.aIn || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].aIn = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ইঞ্চি
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Side B */}
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            বাহু ২ (Side B)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.bFt || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].bFt = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ফুট
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.bIn || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].bIn = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ইঞ্চি
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Side C (or Diagonal/Common Border) */}
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            বাহু ৩ / কর্ণ (Side C)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.cFt || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].cFt = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ফুট
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={tri.cIn || ''}
                                onChange={(e) => {
                                  const updated = [...triangles];
                                  updated[idx].cIn = Math.max(0, parseFloat(e.target.value) || 0);
                                  setTriangles(updated);
                                }}
                                className="w-full h-8 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2 text-xs font-bold"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                                ইঞ্চি
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informational Guidance */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'টিপস: যেকোনো বাঁকা, অসম বা ৫/৬ কোণা জমিকে সুবিধাজনক কোণায় ফিতা টেনে ত্রিভুজ বানিয়ে ফেলুন। প্রতিটি ত্রিভুজের ৩ বাহুর মাপ দিলেই সবগুলোর যোগফল নিখুঁতভাবে পাওয়া যাবে।'
                    : 'Tip: Convert any irregular or curved land into multiple triangles by measuring corner diagonals. Heron’s formula will accurately compute the total area.'}
                </span>
              </div>
            </div>
          )}

          {/* =============================================================
              SUB-MODE: ৪ বাহু ও কর্ণ (চতুর্ভুজ)
             ============================================================= */}
          {shapeType === 'quad' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-[#0B63F6]">
                  <MapPin className="w-4 h-4" />
                  <span>{lang === 'bn' ? '৪ দিকের দৈর্ঘ্য ও প্রস্থ (ফুট ও ইঞ্চি):' : 'Enter 4 Boundary Lengths:'}</span>
                </span>
                <button
                  onClick={() => {
                    setL1Ft(100);
                    setL2Ft(105);
                    setW1Ft(50);
                    setW2Ft(52);
                    setL1In(0);
                    setL2In(0);
                    setW1In(0);
                    setW2In(0);
                    setDiagFt(115);
                    setDiagIn(0);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.actions.reset}</span>
                </button>
              </div>

              {/* Visual Plot Preview Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700 flex flex-col items-center justify-center text-[11px] relative py-5">
                <span className="font-bold text-[#0B63F6] mb-1">উত্তর দৈর্ঘ্য: {l1Total.toFixed(1)} ft</span>
                <div className="w-48 h-20 border-2 border-dashed border-[#0B63F6] rounded-xl flex items-center justify-between px-2 text-slate-500 font-semibold text-[10px] relative">
                  <span>পশ্চিম: {w2Total.toFixed(1)} ft</span>
                  <div className="text-center font-bold text-slate-700 dark:text-slate-200">
                    <span className="block">{totalSqFt.toFixed(0)} sq ft</span>
                    {useDiagonal && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 block font-normal">
                        কর্ণ: {diagTotal.toFixed(1)} ft
                      </span>
                    )}
                  </div>
                  <span>পূর্ব: {w1Total.toFixed(1)} ft</span>
                </div>
                <span className="font-bold text-[#0B63F6] mt-1">দক্ষিণ দৈর্ঘ্য: {l2Total.toFixed(1)} ft</span>
              </div>

              {/* Length 1 (North) & Length 2 (South) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    উত্তর দৈর্ঘ্য (Length 1)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={l1Ft || ''}
                        onChange={(e) => setL1Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={l1In || ''}
                        onChange={(e) => setL1In(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    দক্ষিণ দৈর্ঘ্য (Length 2)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={l2Ft || ''}
                        onChange={(e) => setL2Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={l2In || ''}
                        onChange={(e) => setL2In(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Width 1 (East) & Width 2 (West) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    পূর্ব প্রস্থ (Width 1)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={w1Ft || ''}
                        onChange={(e) => setW1Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={w1In || ''}
                        onChange={(e) => setW1In(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    পশ্চিম প্রস্থ (Width 2)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={w2Ft || ''}
                        onChange={(e) => setW2Ft(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={w2In || ''}
                        onChange={(e) => setW2In(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagonal Toggle & Input */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useDiagonal}
                    onChange={(e) => setUseDiagonal(e.target.checked)}
                    className="rounded text-[#0B63F6] focus:ring-[#0B63F6] w-4 h-4"
                  />
                  <span>কর্ণ (Diagonal) পরিমাপ যুক্ত করুন (অসম চতুর্ভুজে হেরন্সের নির্ভুল ফর্মুলা)</span>
                </label>
                {useDiagonal && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={diagFt || ''}
                        onChange={(e) => setDiagFt(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="কর্ণ ফুট"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={diagIn || ''}
                        onChange={(e) => setDiagIn(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="কর্ণ ইঞ্চি"
                        className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================
              SUB-MODE: তেকোনা জমি (৩ বাহুর মাপ)
             ============================================================= */}
          {shapeType === 'triangle' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#0B63F6]" />
                <span>{lang === 'bn' ? 'তেকোনা বা ত্রিভুজাকার জমি পরিমাপ' : 'Triangular Plot'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Side 1 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ১ম বাহু (Side 1)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={triAFt || ''}
                        onChange={(e) => setTriAFt(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={triAIn || ''}
                        onChange={(e) => setTriAIn(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>

                {/* Side 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ২য় বাহু (Side 2)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={triBFt || ''}
                        onChange={(e) => setTriBFt(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={triBIn || ''}
                        onChange={(e) => setTriBIn(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>

                {/* Side 3 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ৩য় বাহু (Side 3)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={triCFt || ''}
                        onChange={(e) => setTriCFt(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={triCIn || ''}
                        onChange={(e) => setTriCIn(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                    </div>
                  </div>
                </div>
              </div>

              {!singleTriResult.valid && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>ত্রিভুজের যেকোনো দুই বাহুর যোগফল অবশ্যই তৃতীয় বাহুর চেয়ে বড় হতে হবে। বাহুর মাপ ঠিক করুন।</span>
                </div>
              )}
            </div>
          )}

          {/* =============================================================
              SUB-MODE: বাঁকা নদী বা রাস্তার সীমানা (অফসেট পদ্ধতি)
             ============================================================= */}
          {shapeType === 'curve' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0B63F6]" />
                    <span>{lang === 'bn' ? 'নদী/রাস্তার বাঁকা সীমানা (অফসেট পদ্ধতি)' : 'Curved Boundary Offset'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'সোজা বেস লাইন বরাবর নির্দিষ্ট ব্যবধানে বাঁকা পাড়ের অফসেট উচ্চতা দিন'
                      : 'Measure perpendicular offsets along a baseline (Trapezoidal Rule)'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOffsets([
                      ...offsets,
                      { id: `off-${Date.now()}`, feet: 20, inch: 0 },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0B63F6] dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ পয়েন্ট যোগ' : '+ Add Point'}</span>
                </button>
              </div>

              {/* Baseline Interval */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পয়েন্টগুলোর মধ্যবর্তী সমদূরত্ব (Interval d):
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={intervalFt || ''}
                    onChange={(e) => setIntervalFt(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-3 text-xs font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">ফুট</span>
                </div>
              </div>

              {/* Offset Points Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {offsets.map((pt, idx) => (
                  <div
                    key={pt.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-1 relative"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>অফসেট {idx + 1} (O{idx + 1})</span>
                      {offsets.length > 2 && (
                        <button
                          onClick={() => setOffsets(offsets.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative">
                        <input
                          type="number"
                          value={pt.feet || ''}
                          onChange={(e) => {
                            const updated = [...offsets];
                            updated[idx].feet = Math.max(0, parseFloat(e.target.value) || 0);
                            setOffsets(updated);
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-1.5 text-xs font-bold"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">ফুট</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={pt.inch || ''}
                          onChange={(e) => {
                            const updated = [...offsets];
                            updated[idx].inch = Math.max(0, parseFloat(e.target.value) || 0);
                            setOffsets(updated);
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-1.5 text-xs font-bold"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400">ইঞ্চি</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================
              COMPREHENSIVE RESULTS DISPLAY CARD
             ============================================================= */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>
                {shapeType === 'triangles'
                  ? 'আঁকা-বাঁকা জমির সর্বমোট ফলাফল (হেরন সূত্র):'
                  : 'জমির মোট পরিমাপের ফলাফল:'}
              </span>
            </span>

            {/* Highlighted Decimal / Shotok */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">মোট জমির পরিমাণ:</span>
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {formatNumber(shotok.toFixed(3), lang)}{' '}
                  <span className="text-sm font-bold text-slate-300">শতক / ডেসিমেল</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-blue-400">
                  {formatNumber(katha.toFixed(2), lang)}{' '}
                  <span className="text-xs font-normal text-slate-300">কাঠা</span>
                </span>
              </div>
            </div>

            {/* All Units Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">বর্গফুট (Sq Ft):</span>
                <span className="text-sm font-mono font-bold text-white">{totalSqFt.toFixed(1)} sq ft</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">বর্গমিটার (Sq M):</span>
                <span className="text-sm font-mono font-bold text-white">{sqMeter.toFixed(1)} m²</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">বিঘা (Bigha):</span>
                <span className="text-sm font-mono font-bold text-white">{bigha.toFixed(3)} বিঘা</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">ছটাক (Chhatak):</span>
                <span className="text-sm font-mono font-bold text-white">{chhatak.toFixed(2)} ছটাক</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">একর (Acre):</span>
                <span className="text-sm font-mono font-bold text-white">{acre.toFixed(4)} একর</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">গণ্ডা (Ganda):</span>
                <span className="text-sm font-mono font-bold text-white">{ganda.toFixed(2)} গণ্ডা</span>
              </div>
            </div>

            {/* Triangle-by-Triangle Summary (if irregular multi-triangle) */}
            {shapeType === 'triangles' && (
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">প্রতিটি খণ্ডের বিবরণ:</span>
                <div className="flex flex-col gap-1">
                  {triangleResults.map((tr, idx) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-800/50"
                    >
                      <span className="text-slate-300 font-medium">
                        {idx + 1}. {tr.nameBn}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {tr.shotok.toFixed(3)} শতক ({tr.areaSqFt.toFixed(0)} sq ft)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCopy}
              className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.actions.copied : 'পরিমাপের হিসাব কপি ও সেভ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONVERTER (একক রূপান্তর)
         ========================================================================= */}
      {activeTab === 'converter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            জমির একক রূপান্তর ক্যালকুলেটর:
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">মান (Value):</label>
              <input
                type="number"
                value={convValue || ''}
                onChange={(e) => setConvValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">একক (Unit):</label>
              <select
                value={convUnit}
                onChange={(e) => setConvUnit(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 font-bold text-xs"
              >
                <option value="shotok">শতক / ডেসিমেল</option>
                <option value="katha">কাঠা</option>
                <option value="bigha">বিঘা</option>
                <option value="acre">একর</option>
                <option value="chhatak">ছটাক</option>
                <option value="ganda">গণ্ডা</option>
                <option value="sqft">বর্গফুট (Sq Ft)</option>
                <option value="sqm">বর্গমিটার (Sq M)</option>
              </select>
            </div>
          </div>

          {/* Converted Values Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col gap-2">
            <span className="text-[11px] font-bold text-emerald-400">রূপান্তরিত পরিমাপসমূহ:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">শতক:</span>
                <span className="font-bold font-mono text-emerald-400">{(convSqFt / 435.6).toFixed(3)} শতক</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">কাঠা:</span>
                <span className="font-bold font-mono text-blue-400">{(convSqFt / 720).toFixed(3)} কাঠা</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">বিঘা:</span>
                <span className="font-bold font-mono text-amber-400">{(convSqFt / 14400).toFixed(4)} বিঘা</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">ছটাক:</span>
                <span className="font-bold font-mono text-teal-400">{(convSqFt / 45).toFixed(2)} ছটাক</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">একর:</span>
                <span className="font-bold font-mono text-purple-400">{(convSqFt / 43560).toFixed(4)} একর</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">বর্গফুট:</span>
                <span className="font-bold font-mono text-white">{convSqFt.toFixed(1)} sq ft</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SHARES & DIVISION (অংশীদার ভাগ)
         ========================================================================= */}
      {activeTab === 'share' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              মোট জমির পরিমাণ (শতক):
            </label>
            <input
              type="number"
              value={totalLandShotok || ''}
              onChange={(e) => setTotalLandShotok(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-bold text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">অংশীদার তালিকা ({shares.length} জন):</span>
            <button
              onClick={() => {
                setShares([
                  ...shares,
                  { id: `s-${Date.now()}`, name: `অংশীদার ${shares.length + 1}`, shareRatio: 1 },
                ]);
              }}
              className="px-2.5 py-1 bg-[#0B63F6] text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition"
            >
              + অংশীদার যোগ
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {shares.map((s, idx) => {
              const personShotok = (totalLandShotok * s.shareRatio) / totalShareSum;
              const personSqFt = personShotok * 435.6;
              return (
                <div
                  key={s.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => {
                        const updated = [...shares];
                        updated[idx].name = e.target.value;
                        setShares(updated);
                      }}
                      className="text-xs font-bold bg-transparent border-b border-slate-300 dark:border-slate-600 pb-0.5 w-full"
                    />
                    <span className="text-[11px] text-[#0B63F6] font-bold font-mono block mt-1">
                      পাবে: {personShotok.toFixed(2)} শতক ({personSqFt.toFixed(0)} বর্গফুট)
                    </span>
                  </div>

                  <div className="w-20 text-right">
                    <label className="text-[9px] text-slate-400 block font-bold">অনুপাত / আনা</label>
                    <input
                      type="number"
                      value={s.shareRatio || ''}
                      onChange={(e) => {
                        const updated = [...shares];
                        updated[idx].shareRatio = parseFloat(e.target.value) || 0;
                        setShares(updated);
                      }}
                      className="w-full h-8 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold text-center"
                    />
                  </div>

                  {shares.length > 1 && (
                    <button
                      onClick={() => setShares(shares.filter((_, i) => i !== idx))}
                      className="text-xs text-rose-500 font-bold ml-1 hover:text-rose-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
