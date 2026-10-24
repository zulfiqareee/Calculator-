import React, { useState } from 'react';
import { Flame, Copy, Check, RotateCcw, Lightbulb, HelpCircle } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';

interface Props {
  lang: Language;
}

interface AppliancePreset {
  id: string;
  nameEn: string;
  nameBn: string;
  defaultWatt: number;
  defaultHours: number;
}

const PRESETS: AppliancePreset[] = [
  { id: 'custom', nameEn: 'Custom Appliance', nameBn: 'নিজস্ব ওয়াট লিখুন', defaultWatt: 100, defaultHours: 5 },
  { id: 'fan', nameEn: 'Ceiling Fan', nameBn: 'সিলিং ফ্যান', defaultWatt: 75, defaultHours: 12 },
  { id: 'led_bulb', nameEn: 'LED Light Bulb', nameBn: 'এলইডি লাইট', defaultWatt: 15, defaultHours: 6 },
  { id: 'ac', nameEn: '1.5 Ton AC (Inverter)', nameBn: 'দেড় টন এসি (ইনভার্টার)', defaultWatt: 1400, defaultHours: 8 },
  { id: 'fridge', nameEn: 'Refrigerator (250L)', nameBn: 'ফ্রিজ (মাঝারি)', defaultWatt: 180, defaultHours: 14 },
  { id: 'tv', nameEn: 'LED Smart TV 43"', nameBn: 'স্মার্ট টেলিভিশন', defaultWatt: 65, defaultHours: 5 },
  { id: 'laptop', nameEn: 'Laptop / Computer', nameBn: 'ল্যাপটপ / কম্পিউটার', defaultWatt: 65, defaultHours: 7 },
  { id: 'iron', nameEn: 'Electric Clothes Iron', nameBn: 'ইস্ত্রি (আয়রন)', defaultWatt: 1000, defaultHours: 0.5 },
  { id: 'pump', nameEn: 'Water Pump 1 HP', nameBn: 'পানির মোটর (১ ঘোড়া)', defaultWatt: 746, defaultHours: 1 },
];

export const EnergyConsumptionCalculator: React.FC<Props> = ({ lang }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('fan');
  const [applianceName, setApplianceName] = useState<string>('Ceiling Fan');
  const [wattage, setWattage] = useState<string>('75');
  const [quantity, setQuantity] = useState<string>('2');
  const [hoursPerDay, setHoursPerDay] = useState<string>('10');
  const [ratePerKwh, setRatePerKwh] = useState<string>('8.50');
  const [currencySymbol, setCurrencySymbol] = useState<string>('৳');
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find((item) => item.id === presetId);
    if (p) {
      setApplianceName(lang === 'bn' ? p.nameBn : p.nameEn);
      setWattage(String(p.defaultWatt));
      setHoursPerDay(String(p.defaultHours));
    }
  };

  const numWatt = Math.max(0, parseFloat(wattage) || 0);
  const numQty = Math.max(1, parseInt(quantity, 10) || 1);
  const numHours = Math.min(24, Math.max(0, parseFloat(hoursPerDay) || 0));
  const numRate = Math.max(0, parseFloat(ratePerKwh) || 0);

  // Calculations
  // Total Watts = wattage * quantity
  const totalWatts = numWatt * numQty;
  // Daily kWh = (totalWatts * hours) / 1000
  const dailyKwh = (totalWatts * numHours) / 1000;
  const monthlyKwh = dailyKwh * 30;
  const yearlyKwh = dailyKwh * 365;

  const dailyCost = dailyKwh * numRate;
  const monthlyCost = monthlyKwh * numRate;
  const yearlyCost = yearlyKwh * numRate;

  const handleCopy = () => {
    const summary = `${applianceName} Energy Consumption:
Appliance: ${applianceName} (${numWatt}W x ${numQty})
Daily Usage: ${numHours} hours/day
Daily Energy: ${dailyKwh.toFixed(3)} kWh (${currencySymbol} ${dailyCost.toFixed(2)})
Monthly Energy: ${monthlyKwh.toFixed(2)} kWh (${currencySymbol} ${monthlyCost.toFixed(2)})
Yearly Cost: ${currencySymbol} ${yearlyCost.toFixed(2)}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    addStoredHistory({
      toolId: 'energy',
      titleEn: 'Appliance Energy',
      titleBn: 'যন্ত্রের বিদ্যুৎ খরচ',
      expression: `${applianceName} (${numWatt}W × ${numQty}, ${numHours}h)`,
      result: `${monthlyKwh.toFixed(1)} kWh/mo (${currencySymbol} ${monthlyCost.toFixed(1)})`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Preset Appliances Picker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'bn' ? 'সাধারণ গৃহস্থালি যন্ত্র নির্বাচন করুন' : 'Select Appliance Preset'}
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'bn' ? p.nameBn : p.nameEn} ({p.defaultWatt}W)
              </option>
            ))}
          </select>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Wattage */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'যন্ত্রের ওয়াট (Watt)' : 'Wattage (W)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={wattage}
                onChange={(e) => setWattage(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                W
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'যন্ত্রের সংখ্যা (টি)' : 'Quantity (Pcs)'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          {/* Daily Usage Hours */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'দৈনিক ব্যবহার (ঘণ্টা)' : 'Daily Usage (Hours)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="24"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                hrs
              </span>
            </div>
          </div>

          {/* Rate per kWh */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'প্রতি ইউনিট দর' : 'Cost per kWh'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={ratePerKwh}
                onChange={(e) => setRatePerKwh(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consumption Breakdown Card */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {lang === 'bn' ? 'মাসিক বিদ্যুৎ খরচ (৩০ দিন)' : 'Monthly Electricity Cost (30 Days)'}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {formatNumber(monthlyKwh.toFixed(2), lang)} kWh
          </span>
        </div>

        {/* Big monthly cost display */}
        <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
          {currencySymbol} {formatNumber(monthlyCost.toFixed(2), lang)}
        </div>

        {/* Breakdown table */}
        <div className="space-y-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'দৈনিক শক্তি খরচ:' : 'Daily Consumption:'}</span>
            <span className="font-mono font-semibold">
              {formatNumber(dailyKwh.toFixed(3), lang)} kWh ({currencySymbol} {formatNumber(dailyCost.toFixed(2), lang)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'মাসিক মোট শক্তি:' : 'Monthly Units:'}</span>
            <span className="font-mono font-semibold">{formatNumber(monthlyKwh.toFixed(2), lang)} Units (kWh)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'বাৎসরিক মোট খরচ (৩৬৫ দিন):' : 'Estimated Annual Cost:'}</span>
            <span className="font-mono font-semibold text-emerald-400">
              {currencySymbol} {formatNumber(yearlyCost.toFixed(2), lang)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition shadow-sm mt-1"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.actions.copied : (lang === 'bn' ? 'হিসাব কপি করুন' : 'Copy Energy Estimate')}</span>
        </button>
      </div>

      {/* Energy Saving Tip */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
        <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'bn'
            ? 'পরামর্শ: ইনভার্টার প্রযুক্তি সম্বলিত এসি ও ফ্রিজ সাধারণ মডেলের তুলনায় ৩০%-৫০% পর্যন্ত বিদ্যুৎ সাশ্রয় করে।'
            : 'Tip: Upgrading to 5-star inverter appliances can reduce monthly electricity consumption by 30% to 50%.'}
        </p>
      </div>
    </div>
  );
};
