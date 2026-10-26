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
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type LandMode = 'plot' | 'converter' | 'share';

export const LandMeasurementCalculator: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];
  const [mode, setMode] = useState<LandMode>('plot');

  // ==========================================
  // MODE 1: PLOT MEASUREMENT (৪ বাহুর জমি)
  // ==========================================
  const [length1Feet, setLength1Feet] = useState<number>(100);
  const [length1Inch, setLength1Inch] = useState<number>(0);
  const [length2Feet, setLength2Feet] = useState<number>(105);
  const [length2Inch, setLength2Inch] = useState<number>(0);

  const [width1Feet, setWidth1Feet] = useState<number>(50);
  const [width1Inch, setWidth1Inch] = useState<number>(0);
  const [width2Feet, setWidth2Feet] = useState<number>(52);
  const [width2Inch, setWidth2Inch] = useState<number>(0);

  // Optional diagonal (কর্ণ) for exact triangle calculation
  const [useDiagonal, setUseDiagonal] = useState<boolean>(false);
  const [diagonalFeet, setDiagonalFeet] = useState<number>(115);

  // Total lengths in feet
  const l1 = length1Feet + length1Inch / 12;
  const l2 = length2Feet + length2Inch / 12;
  const w1 = width1Feet + width1Inch / 12;
  const w2 = width2Feet + width2Inch / 12;
  const diag = diagonalFeet;

  // Calculate Area in Sq Ft
  let totalSqFt = 0;
  if (useDiagonal && diag > 0) {
    // Triangle 1: l1, w1, diag
    const s1 = (l1 + w1 + diag) / 2;
    const a1 = Math.sqrt(Math.max(0, s1 * (s1 - l1) * (s1 - w1) * (s1 - diag)));
    // Triangle 2: l2, w2, diag
    const s2 = (l2 + w2 + diag) / 2;
    const a2 = Math.sqrt(Math.max(0, s2 * (s2 - l2) * (s2 - w2) * (s2 - diag)));
    totalSqFt = a1 + a2;
  } else {
    // Average Method (গড় পদ্ধতি): Avg Length x Avg Width
    const avgLength = (l1 + l2) / 2;
    const avgWidth = (w1 + w2) / 2;
    totalSqFt = avgLength * avgWidth;
  }

  // Conversions
  const shotok = totalSqFt / 435.6; // ১ শতক = ৪৩৫.৬ বর্গফুট
  const katha = totalSqFt / 720; // ১ কাঠা = ৭২০ বর্গফুট
  const bigha = totalSqFt / 14400; // ১ বিঘা = ১৪,৪০০ বর্গফুট (২০ কাঠা বা ৩৩ শতক)
  const acre = totalSqFt / 43560; // ১ একর = ৪৩,৫৬০ বর্গফুট (১০০ শতক)
  const chhatak = totalSqFt / 45; // ১ ছটাক = ৪৫ বর্গফুট
  const sqMeter = totalSqFt * 0.092903; // ১ বর্গমিটার = ১০.৭৬৪ বর্গফুট

  // ==========================================
  // MODE 2: CONVERTER (ইউনিট কনভার্টার)
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
      case 'sqft':
        return val;
      default:
        return val;
    }
  };

  const convSqFt = getSqFtFromUnit(convValue, convUnit);

  // ==========================================
  // MODE 3: SHARE / FARAIZ (অংশীদারিত্ব ভাগ)
  // ==========================================
  const [totalLandShotok, setTotalLandShotok] = useState<number>(33);
  const [shares, setShares] = useState<{ id: string; name: string; shareRatio: number }[]>([
    { id: '1', name: 'অংশীদার ১ (ওয়ারিশ)', shareRatio: 8 },
    { id: '2', name: 'অংশীদার ২ (ওয়ারিশ)', shareRatio: 8 },
  ]);

  const totalShareSum = shares.reduce((acc, s) => acc + s.shareRatio, 0) || 1;

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    let text = '';
    if (mode === 'plot') {
      text = `জমির পরিমাপের হিসাব:
মোট ক্ষেত্রফল: ${totalSqFt.toFixed(2)} বর্গফুট (${sqMeter.toFixed(2)} বর্গমিটার)
------------------------
শতক / ডেসিমেল: ${shotok.toFixed(3)} শতক
কাঠা: ${katha.toFixed(3)} কাঠা
বিঘা: ${bigha.toFixed(3)} বিঘা
ছটাক: ${chhatak.toFixed(2)} ছটাক
একর: ${acre.toFixed(4)} একর`;
    } else {
      text = `জমির কনভার্সন: ${convValue} ${convUnit} = ${(convSqFt / 435.6).toFixed(3)} শতক (${convSqFt.toFixed(1)} বর্গফুট)`;
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
      expression: `${totalSqFt.toFixed(1)} sq ft`,
      result: `${shotok.toFixed(3)} শতক / ${katha.toFixed(2)} কাঠা`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Sub-mode switcher */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-xs font-bold">
        {[
          { id: 'plot', labelBn: 'জমি পরিমাপ', labelEn: 'Plot Measure', icon: Compass },
          { id: 'converter', labelBn: 'একক রূপান্তর', labelEn: 'Converter', icon: ArrowRightLeft },
          { id: 'share', labelBn: 'অংশীদার ভাগ', labelEn: 'Land Shares', icon: Users },
        ].map((m) => {
          const Icon = m.icon;
          const isSel = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as LandMode)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? m.labelBn : m.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          MODE 1: PLOT MEASUREMENT (৪ বাহুর জমি)
         ========================================================================= */}
      {mode === 'plot' && (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-[#0B63F6]">
                <MapPin className="w-4 h-4" />
                <span>{lang === 'bn' ? '৪ দিকের দৈর্ঘ্য ও প্রস্থ দিন (ফুট ও ইঞ্চি):' : 'Enter 4 Boundary Lengths:'}</span>
              </span>
              <button
                onClick={() => {
                  setLength1Feet(100);
                  setLength2Feet(105);
                  setWidth1Feet(50);
                  setWidth2Feet(52);
                  setLength1Inch(0);
                  setLength2Inch(0);
                  setWidth1Inch(0);
                  setWidth2Inch(0);
                }}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.actions.reset}</span>
              </button>
            </div>

            {/* Visual Mini Plot Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700 flex flex-col items-center justify-center text-[11px] relative py-6">
              <span className="font-bold text-[#0B63F6] mb-1">উত্তর দৈর্ঘ্য: {l1.toFixed(1)} ft</span>
              <div className="w-48 h-20 border-2 border-dashed border-[#0B63F6] rounded-xl flex items-center justify-between px-2 text-slate-500 font-semibold text-[10px]">
                <span>পশ্চিম: {w2.toFixed(1)} ft</span>
                <span className="text-center font-bold text-slate-700 dark:text-slate-200">
                  {totalSqFt.toFixed(0)} sq ft
                </span>
                <span>পূর্ব: {w1.toFixed(1)} ft</span>
              </div>
              <span className="font-bold text-[#0B63F6] mt-1">দক্ষিণ দৈর্ঘ্য: {l2.toFixed(1)} ft</span>
            </div>

            {/* Length 1 & Length 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Length 1 (North) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  উত্তর দৈর্ঘ্য (Length 1)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={length1Feet || ''}
                      onChange={(e) => setLength1Feet(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={length1Inch || ''}
                      onChange={(e) => setLength1Inch(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                  </div>
                </div>
              </div>

              {/* Length 2 (South) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  দক্ষিণ দৈর্ঘ্য (Length 2)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={length2Feet || ''}
                      onChange={(e) => setLength2Feet(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={length2Inch || ''}
                      onChange={(e) => setLength2Inch(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Width 1 & Width 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Width 1 (East) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পূর্ব প্রস্থ (Width 1)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={width1Feet || ''}
                      onChange={(e) => setWidth1Feet(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={width1Inch || ''}
                      onChange={(e) => setWidth1Inch(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                  </div>
                </div>
              </div>

              {/* Width 2 (West) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পশ্চিম প্রস্থ (Width 2)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={width2Feet || ''}
                      onChange={(e) => setWidth2Feet(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ফুট</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={width2Inch || ''}
                      onChange={(e) => setWidth2Inch(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border rounded-lg px-2 text-xs font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ইঞ্চি</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Diagonal Option */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={useDiagonal}
                  onChange={(e) => setUseDiagonal(e.target.checked)}
                  className="rounded text-[#0B63F6] focus:ring-[#0B63F6] w-4 h-4"
                />
                <span>কর্ণ (Diagonal) পরিমাপ যুক্ত করুন (হেরন্সের সঠিক ত্রিভুজ ফর্মুলা)</span>
              </label>
              {useDiagonal && (
                <div className="relative">
                  <input
                    type="number"
                    value={diagonalFeet || ''}
                    onChange={(e) => setDiagonalFeet(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="কর্ণের দৈর্ঘ্য (ফুট)"
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">ফুট</span>
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>জমির মোট পরিমাপের ফলাফল:</span>
            </span>

            {/* Highlighted Decimal / Shotok */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">মোট জমির পরিমাণ:</span>
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {formatNumber(shotok.toFixed(3), lang)} <span className="text-sm font-bold text-slate-300">শতক / ডেসিমেল</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-blue-400">
                  {formatNumber(katha.toFixed(2), lang)} <span className="text-xs font-normal text-slate-300">কাঠা</span>
                </span>
              </div>
            </div>

            {/* All Units Grid */}
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
                <span className="text-sm font-mono font-bold text-white">{(totalSqFt / 871.2).toFixed(2)} গণ্ডা</span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.actions.copied : 'পরিমাপের হিসাব কপি করুন'}</span>
            </button>
          </div>
        </>
      )}

      {/* =========================================================================
          MODE 2: CONVERTER
         ========================================================================= */}
      {mode === 'converter' && (
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
                <option value="sqft">বর্গফুট (Sq Ft)</option>
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
                <span className="text-slate-400 text-[10px] block">বর্গফুট:</span>
                <span className="font-bold font-mono text-white">{convSqFt.toFixed(1)} sq ft</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: SHARES & DIVISION
         ========================================================================= */}
      {mode === 'share' && (
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
              className="px-2.5 py-1 bg-[#0B63F6] text-white rounded-lg text-xs font-bold"
            >
              + অংশীদার যোগ
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {shares.map((s, idx) => {
              const personShotok = (totalLandShotok * s.shareRatio) / totalShareSum;
              const personSqFt = personShotok * 435.6;
              return (
                <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl flex items-center justify-between gap-2">
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
                      className="text-xs text-rose-500 font-bold ml-1"
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
