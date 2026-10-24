import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Check, Layers } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';

interface Props {
  lang: Language;
}

type UnitType = 'length' | 'weight' | 'temp' | 'area' | 'volume';

interface UnitDef {
  id: string;
  nameEn: string;
  nameBn: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const UNIT_GROUPS: Record<UnitType, { nameEn: string; nameBn: string; units: UnitDef[] }> = {
  length: {
    nameEn: 'Length',
    nameBn: 'দৈর্ঘ্য',
    units: [
      { id: 'm', nameEn: 'Meter', nameBn: 'মিটার', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', nameEn: 'Kilometer', nameBn: 'কিলোমিটার', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', nameEn: 'Centimeter', nameBn: 'সেন্টিমিটার', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: 'mm', nameEn: 'Millimeter', nameBn: 'মিলিমিটার', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'ft', nameEn: 'Foot', nameBn: 'ফুট', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'in', nameEn: 'Inch', nameBn: 'ইঞ্চি', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'yd', nameEn: 'Yard', nameBn: 'গজ', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', nameEn: 'Mile', nameBn: 'মাইল', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  weight: {
    nameEn: 'Weight & Mass',
    nameBn: 'ওজন ও ভর',
    units: [
      { id: 'kg', nameEn: 'Kilogram', nameBn: 'কিলোগ্রাম', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', nameEn: 'Gram', nameBn: 'গ্রাম', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'mg', nameEn: 'Milligram', nameBn: 'মিলিগ্রাম', symbol: 'mg', toBase: (v) => v * 0.000001, fromBase: (v) => v * 1000000 },
      { id: 'lb', nameEn: 'Pound', nameBn: 'পাউন্ড', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', nameEn: 'Ounce', nameBn: 'আউন্স', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      { id: 't', nameEn: 'Metric Ton', nameBn: 'মেট্রিক টন', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'tola', nameEn: 'Tola (Gold)', nameBn: 'তোলা (স্বর্ণ)', symbol: 'তোলা', toBase: (v) => v * 0.0116638, fromBase: (v) => v / 0.0116638 },
      { id: 'mon', nameEn: 'Mon (South Asia)', nameBn: 'মণ (৪০ কেজি)', symbol: 'মণ', toBase: (v) => v * 40, fromBase: (v) => v / 40 },
    ],
  },
  temp: {
    nameEn: 'Temperature',
    nameBn: 'তাপমাত্রা',
    units: [
      { id: 'c', nameEn: 'Celsius', nameBn: 'সেলসিয়াস', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', nameEn: 'Fahrenheit', nameBn: 'ফারেনহাইট', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', nameEn: 'Kelvin', nameBn: 'কেলভিন', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  area: {
    nameEn: 'Area & Land',
    nameBn: 'ক্ষেত্রফল ও জমি',
    units: [
      { id: 'sqm', nameEn: 'Square Meter', nameBn: 'বর্গমিটার', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sqft', nameEn: 'Square Foot', nameBn: 'বর্গফুট', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'shotok', nameEn: 'Shotok / Decimal', nameBn: 'শতক / ডেসিমাল', symbol: 'শতক', toBase: (v) => v * 40.4686, fromBase: (v) => v / 40.4686 },
      { id: 'katha', nameEn: 'Katha', nameBn: 'কাঠা', symbol: 'কাঠা', toBase: (v) => v * 66.89, fromBase: (v) => v / 66.89 },
      { id: 'bigha', nameEn: 'Bigha (33 Shotok)', nameBn: 'বিঘা', symbol: 'বিঘা', toBase: (v) => v * 1335.46, fromBase: (v) => v / 1335.46 },
      { id: 'acre', nameEn: 'Acre', nameBn: 'একর', symbol: 'acre', toBase: (v) => v * 4046.8564, fromBase: (v) => v / 4046.8564 },
      { id: 'hectare', nameEn: 'Hectare', nameBn: 'হেক্টর', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
  volume: {
    nameEn: 'Volume',
    nameBn: 'আয়তন ও তরল',
    units: [
      { id: 'l', nameEn: 'Liter', nameBn: 'লিটার', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', nameEn: 'Milliliter', nameBn: 'মিলিলিটার', symbol: 'mL', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'cum', nameEn: 'Cubic Meter', nameBn: 'ঘনমিটার', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'gal', nameEn: 'Gallon (US)', nameBn: 'গ্যালন (ইউএস)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'floz', nameEn: 'Fluid Ounce', nameBn: 'ফ্লুইড আউন্স', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    ],
  },
};

export const UnitConverter: React.FC<Props> = ({ lang }) => {
  const [category, setCategory] = useState<UnitType>('length');
  const [fromUnitId, setFromUnitId] = useState<string>('m');
  const [toUnitId, setToUnitId] = useState<string>('ft');
  const [inputValue, setInputValue] = useState<string>('1');
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TEXT[lang];
  const group = UNIT_GROUPS[category];

  const fromUnit = group.units.find((u) => u.id === fromUnitId) || group.units[0];
  const toUnit = group.units.find((u) => u.id === toUnitId) || group.units[1];

  const numInput = parseFloat(inputValue) || 0;

  // Convert
  const baseValue = fromUnit.toBase(numInput);
  const resultValue = toUnit.fromBase(baseValue);

  // Format smartly (avoid 0.00000000001 or scientific notation where possible)
  const formatResult = (val: number): string => {
    if (val === 0) return '0';
    if (Math.abs(val) < 0.0001 || Math.abs(val) >= 1e8) {
      return val.toExponential(4);
    }
    return parseFloat(val.toFixed(6)).toString();
  };

  const formattedResult = formatResult(resultValue);

  const handleSwap = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  const handleCategoryChange = (cat: UnitType) => {
    setCategory(cat);
    const newUnits = UNIT_GROUPS[cat].units;
    setFromUnitId(newUnits[0].id);
    setToUnitId(newUnits[1] ? newUnits[1].id : newUnits[0].id);
  };

  const handleCopy = () => {
    const fromName = lang === 'bn' ? fromUnit.nameBn : fromUnit.nameEn;
    const toName = lang === 'bn' ? toUnit.nameBn : toUnit.nameEn;
    const text = `${inputValue} ${fromName} (${fromUnit.symbol}) = ${formattedResult} ${toName} (${toUnit.symbol})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    addStoredHistory({
      toolId: 'converter',
      titleEn: 'Unit Conversion',
      titleBn: 'একক রূপান্তর',
      expression: `${inputValue} ${fromUnit.symbol} to ${toUnit.symbol}`,
      result: `${formattedResult} ${toUnit.symbol}`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Category Pills Bar */}
      <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl no-scrollbar">
        {(Object.keys(UNIT_GROUPS) as UnitType[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-xl transition shrink-0 ${
              category === cat
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? UNIT_GROUPS[cat].nameBn : UNIT_GROUPS[cat].nameEn}
          </button>
        ))}
      </div>

      {/* Main Converter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        {/* Input Value & From Unit */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            {lang === 'bn' ? 'রূপান্তর করার মান' : 'Value to Convert'}
          </label>
          <div className="grid grid-cols-5 gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="col-span-3 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="col-span-2 h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {group.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {lang === 'bn' ? u.nameBn : u.nameEn} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition active:rotate-180 shadow-xs"
            title="Swap Units"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Target Unit Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            {lang === 'bn' ? 'গন্তব্য একক (যে এককে রূপান্তর হবে)' : 'Target Unit'}
          </label>
          <select
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
            className="w-full h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {group.units.map((u) => (
              <option key={u.id} value={u.id}>
                {lang === 'bn' ? u.nameBn : u.nameEn} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Result Container */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 flex flex-col gap-2 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">
            {formatNumber(inputValue, lang)} {lang === 'bn' ? fromUnit.nameBn : fromUnit.nameEn} =
          </span>
          <div className="flex items-baseline justify-between gap-2 overflow-hidden">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono truncate">
              {formatNumber(formattedResult, lang)}
            </span>
            <span className="text-sm font-semibold text-slate-300 shrink-0">
              {toUnit.symbol} ({lang === 'bn' ? toUnit.nameBn : toUnit.nameEn})
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition mt-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : (lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy Conversion')}</span>
          </button>
        </div>
      </div>

      {/* Quick All-Units Reference Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'bn' ? 'একই সাথে অন্যান্য এককে মান:' : 'Instant All-Units Matrix:'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {group.units.map((u) => {
            const converted = formatResult(u.fromBase(baseValue));
            return (
              <div
                key={u.id}
                className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  u.id === toUnitId
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {lang === 'bn' ? u.nameBn : u.nameEn} ({u.symbol})
                </span>
                <span className="font-mono font-bold text-xs truncate mt-1">
                  {formatNumber(converted, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
