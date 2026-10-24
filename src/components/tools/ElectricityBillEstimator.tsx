import React, { useState } from 'react';
import { Zap, AlertTriangle, Copy, Check, RotateCcw, HelpCircle } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

interface Slab {
  labelEn: string;
  labelBn: string;
  min: number;
  max: number; // Infinity for last
  rate: number;
}

const DEFAULT_SLABS: Slab[] = [
  { labelEn: '1 - 75 Units (Lifeline)', labelBn: '১ - ৭৫ ইউনিট (লাইফলাইন)', min: 1, max: 75, rate: 4.85 },
  { labelEn: '76 - 200 Units (Step 1)', labelBn: '৭৬ - ২০০ ইউনিট (ধাপ ১)', min: 76, max: 200, rate: 6.63 },
  { labelEn: '201 - 300 Units (Step 2)', labelBn: '২০১ - ৩০০ ইউনিট (ধাপ ২)', min: 201, max: 300, rate: 6.95 },
  { labelEn: '301 - 400 Units (Step 3)', labelBn: '৩০১ - ৪০০ ইউনিট (ধাপ ৩)', min: 301, max: 400, rate: 7.34 },
  { labelEn: '401 - 600 Units (Step 4)', labelBn: '৪০১ - ৬০০ ইউনিট (ধাপ ৪)', min: 401, max: 600, rate: 11.51 },
  { labelEn: 'Above 600 Units (Step 5)', labelBn: '৬০০ ইউনিটের উপরে (ধাপ ৫)', min: 601, max: Infinity, rate: 13.26 },
];

export const ElectricityBillEstimator: React.FC<Props> = ({ lang }) => {
  const [units, setUnits] = useState<string>('150');
  const [pricingMode, setPricingMode] = useState<'slab' | 'flat'>('slab');
  const [flatRate, setFlatRate] = useState<string>('8.50');
  const [meterRent, setMeterRent] = useState<string>('40');
  const [demandCharge, setDemandCharge] = useState<string>('35');
  const [vatPercent, setVatPercent] = useState<string>('5');
  const [currencySymbol, setCurrencySymbol] = useState<string>('৳');
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  const parsedUnits = Math.max(0, parseFloat(units) || 0);
  const parsedFlatRate = Math.max(0, parseFloat(flatRate) || 0);
  const parsedMeterRent = Math.max(0, parseFloat(meterRent) || 0);
  const parsedDemandCharge = Math.max(0, parseFloat(demandCharge) || 0);
  const parsedVatPercent = Math.max(0, parseFloat(vatPercent) || 0);

  // Compute breakdown
  const slabBreakdown: { label: string; unitsInSlab: number; rate: number; cost: number }[] = [];
  let energyCharge = 0;

  if (pricingMode === 'flat') {
    energyCharge = parsedUnits * parsedFlatRate;
  } else {
    let remaining = parsedUnits;
    for (const slab of DEFAULT_SLABS) {
      if (remaining <= 0) break;
      const slabCapacity = slab.max === Infinity ? remaining : slab.max - slab.min + 1;
      const unitsInThisSlab = Math.min(remaining, slabCapacity);
      const cost = unitsInThisSlab * slab.rate;
      slabBreakdown.push({
        label: lang === 'bn' ? slab.labelBn : slab.labelEn,
        unitsInSlab: unitsInThisSlab,
        rate: slab.rate,
        cost: cost,
      });
      energyCharge += cost;
      remaining -= unitsInThisSlab;
    }
  }

  const subTotalBeforeVat = energyCharge + parsedMeterRent + parsedDemandCharge;
  const vatAmount = (subTotalBeforeVat * parsedVatPercent) / 100;
  const totalEstimatedBill = subTotalBeforeVat + vatAmount;

  const handleReset = () => {
    setUnits('150');
    setPricingMode('slab');
    setFlatRate('8.50');
    setMeterRent('40');
    setDemandCharge('35');
    setVatPercent('5');
  };

  const handleCopy = async () => {
    const summary = `${lang === 'bn' ? 'বিদ্যুৎ বিল হিসাব' : 'Electricity Bill Estimate'}:
${lang === 'bn' ? 'ব্যবহৃত ইউনিট' : 'Total Units'}: ${units} kWh
${lang === 'bn' ? 'বিদ্যুৎ চার্জ' : 'Energy Charge'}: ${currencySymbol} ${energyCharge.toFixed(2)}
${lang === 'bn' ? 'ডিমান্ড চার্জ' : 'Demand Charge'}: ${currencySymbol} ${parsedDemandCharge.toFixed(2)}
${lang === 'bn' ? 'মিটার ভাড়া' : 'Meter Rent'}: ${currencySymbol} ${parsedMeterRent.toFixed(2)}
VAT (${vatPercent}%): ${currencySymbol} ${vatAmount.toFixed(2)}
----------------------------
${lang === 'bn' ? 'সর্বমোট আনুমানিক বিল' : 'Total Estimated Bill'}: ${currencySymbol} ${totalEstimatedBill.toFixed(2)}`;

    const ok = await copyToClipboard(summary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    // Save calculation to history
    addStoredHistory({
      toolId: 'electricity',
      titleEn: 'Electricity Bill',
      titleBn: 'বিদ্যুৎ বিল হিসাব',
      expression: `${units} kWh (${pricingMode === 'slab' ? 'Slab Tariff' : 'Flat ' + flatRate})`,
      result: `${currencySymbol} ${totalEstimatedBill.toFixed(2)}`,
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full">
      {/* Disclaimer Alert Badge */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.disclaimers.electricityBill}</p>
      </div>

      {/* Main Input Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        {/* Unit Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'bn' ? 'মোট ব্যবহৃত বিদ্যুৎ (ইউনিট / kWh)' : 'Total Electricity Consumed (Units / kWh)'}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="e.g. 150"
              className="w-full h-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              kWh
            </span>
          </div>
        </div>

        {/* Pricing Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            {lang === 'bn' ? 'বিল নির্ধারণের পদ্ধতি' : 'Tariff Calculation Model'}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
            <button
              onClick={() => setPricingMode('slab')}
              className={`h-9 text-xs font-semibold rounded-xl transition ${
                pricingMode === 'slab'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'bn' ? 'স্ল্যাব/ধাপ ভিত্তিক রেট' : 'Slab / Tiered Rate'}
            </button>
            <button
              onClick={() => setPricingMode('flat')}
              className={`h-9 text-xs font-semibold rounded-xl transition ${
                pricingMode === 'flat'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lang === 'bn' ? 'একক ফ্ল্যাট রেট' : 'Flat Single Rate'}
            </button>
          </div>
        </div>

        {/* Flat Rate input if mode is flat */}
        {pricingMode === 'flat' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'প্রতি ইউনিটের দর (টাকা/মুদ্রা)' : 'Rate Per Unit (Cost / kWh)'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={flatRate}
              onChange={(e) => setFlatRate(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Meter Rent, Demand Charge, VAT Inputs */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'মিটার ভাড়া' : 'Meter Rent'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={meterRent}
              onChange={(e) => setMeterRent(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'ডিমান্ড চার্জ' : 'Demand Chg'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={demandCharge}
              onChange={(e) => setDemandCharge(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'ভ্যাট (%)' : 'VAT (%)'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={vatPercent}
              onChange={(e) => setVatPercent(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{lang === 'bn' ? 'মুদ্রার প্রতীক:' : 'Currency Symbol:'}</span>
          <div className="flex gap-2">
            {['৳', '$', '₹', '€', '£'].map((sym) => (
              <button
                key={sym}
                onClick={() => setCurrencySymbol(sym)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  currencySymbol === sym
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bill Result Summary Card */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              {lang === 'bn' ? 'আনুমানিক মোট বিল' : 'Estimated Total Bill'}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {lang === 'bn' ? 'অফিসিয়াল বিল নয়' : 'Non-Official'}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
          {currencySymbol} {formatNumber(totalEstimatedBill.toFixed(2), lang)}
        </div>

        {/* Breakdown List */}
        <div className="space-y-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'বিদ্যুৎ শক্তি চার্জ (Energy Charge):' : 'Energy Charge:'}</span>
            <span className="font-mono font-semibold">{currencySymbol} {formatNumber(energyCharge.toFixed(2), lang)}</span>
          </div>

          {pricingMode === 'slab' && slabBreakdown.length > 0 && (
            <div className="pl-2 border-l border-slate-700/60 my-1 space-y-1">
              {slabBreakdown.map((s, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                  <span>{s.label} ({formatNumber(s.unitsInSlab, lang)} u × {currencySymbol}{formatNumber(s.rate, lang)})</span>
                  <span className="font-mono">{currencySymbol} {formatNumber(s.cost.toFixed(2), lang)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'মিটার ভাড়া:' : 'Meter Rent:'}</span>
            <span className="font-mono">{currencySymbol} {formatNumber(parsedMeterRent.toFixed(2), lang)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'ডিমান্ড চার্জ:' : 'Demand Charge:'}</span>
            <span className="font-mono">{currencySymbol} {formatNumber(parsedDemandCharge.toFixed(2), lang)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? `ভ্যাট (${formatNumber(parsedVatPercent, lang)}%):` : `VAT (${parsedVatPercent}%):`}</span>
            <span className="font-mono">{currencySymbol} {formatNumber(vatAmount.toFixed(2), lang)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : (lang === 'bn' ? 'বিল বিবরণী কপি' : 'Copy Breakdown')}</span>
          </button>
          <button
            onClick={handleReset}
            className="h-11 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center justify-center transition active:scale-98"
            title={t.actions.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
