import React, { useState } from 'react';
import { Percent, Copy, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type TabType = 'simple' | 'ratio' | 'discount' | 'profit' | 'change';

export const PercentageCalculator: React.FC<Props> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [copied, setCopied] = useState<boolean>(false);

  // Tab 1: Simple (X% of Y)
  const [percentX, setPercentX] = useState<string>('15');
  const [valueY, setValueY] = useState<string>('200');

  // Tab 2: Ratio (X is what % of Y)
  const [partX, setPartX] = useState<string>('45');
  const [totalY, setTotalY] = useState<string>('180');

  // Tab 3: Discount (Original Price - Disc % = Final)
  const [originalPrice, setOriginalPrice] = useState<string>('1200');
  const [discountPercent, setDiscountPercent] = useState<string>('20');

  // Tab 4: Profit & Loss (Cost Price vs Selling Price)
  const [costPrice, setCostPrice] = useState<string>('500');
  const [sellingPrice, setSellingPrice] = useState<string>('650');

  // Tab 5: % Change (Initial Value -> Final Value)
  const [initialVal, setInitialVal] = useState<string>('80');
  const [finalVal, setFinalVal] = useState<string>('120');

  const t = UI_TEXT[lang];

  // Calculations
  // Tab 1
  const numPercentX = parseFloat(percentX) || 0;
  const numValueY = parseFloat(valueY) || 0;
  const simpleResult = (numPercentX * numValueY) / 100;

  // Tab 2
  const numPartX = parseFloat(partX) || 0;
  const numTotalY = parseFloat(totalY) || 0;
  const ratioResult = numTotalY !== 0 ? (numPartX / numTotalY) * 100 : null;

  // Tab 3
  const numOrig = parseFloat(originalPrice) || 0;
  const numDisc = parseFloat(discountPercent) || 0;
  const savings = (numOrig * numDisc) / 100;
  const finalPrice = Math.max(0, numOrig - savings);

  // Tab 4
  const numCost = parseFloat(costPrice) || 0;
  const numSell = parseFloat(sellingPrice) || 0;
  const profitLossAmount = numSell - numCost;
  const isProfit = profitLossAmount >= 0;
  const profitLossMargin = numCost > 0 ? (Math.abs(profitLossAmount) / numCost) * 100 : 0;

  // Tab 5
  const numInit = parseFloat(initialVal) || 0;
  const numFin = parseFloat(finalVal) || 0;
  const changeDiff = numFin - numInit;
  const isIncrease = changeDiff >= 0;
  const percentChange = numInit !== 0 ? (Math.abs(changeDiff) / Math.abs(numInit)) * 100 : null;

  const handleCopy = async (textToCopy: string, expr: string, res: string) => {
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'percentage',
      titleEn: 'Percentage',
      titleBn: 'শতকরা হিসাব',
      expression: expr,
      result: res,
    });
  };

  const tabs = [
    { id: 'simple', labelEn: 'X% of Y', labelBn: 'শতকরা মান' },
    { id: 'ratio', labelEn: 'What %', labelBn: 'কত শতাংশ' },
    { id: 'discount', labelEn: 'Discount', labelBn: 'মূল্যছাড়' },
    { id: 'profit', labelEn: 'Profit/Loss', labelBn: 'লাভ ও ক্ষতি' },
    { id: 'change', labelEn: '% Change', labelBn: 'বৃদ্ধি/হ্রাস' },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Scrollable Sub Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-xl transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? tab.labelBn : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        {/* Tab 1: Simple percentage */}
        {activeTab === 'simple' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'কোনো সংখ্যার নির্দিষ্ট শতকরা কত?' : 'Calculate X% of Y'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'শতকরা হার (%)' : 'Percentage (%)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={percentX}
                  onChange={(e) => setPercentX(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'মোট সংখ্যা' : 'Of Value'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={valueY}
                  onChange={(e) => setValueY(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                  {lang === 'bn'
                    ? `${formatNumber(percentX, lang)}% এর ${formatNumber(valueY, lang)} =`
                    : `${percentX}% of ${valueY} =`}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
                  {formatNumber(simpleResult.toFixed(2).replace(/\.00$/, ''), lang)}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${percentX}% of ${valueY} = ${simpleResult}`,
                    `${percentX}% of ${valueY}`,
                    String(simpleResult)
                  )
                }
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 active:scale-95 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি' : 'কপি করুন'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'সূত্র: (শতকরা হার × মোট সংখ্যা) ÷ ১০০' : 'Formula: (Percentage × Total) ÷ 100'}
            </div>
          </div>
        )}

        {/* Tab 2: Ratio */}
        {activeTab === 'ratio' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'একটি সংখ্যা অন্য সংখ্যার কত শতাংশ?' : 'X is what percentage of Y?'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'অংশ (X)' : 'Part Value (X)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={partX}
                  onChange={(e) => setPartX(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'মোট মান (Y)' : 'Total Base (Y)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={totalY}
                  onChange={(e) => setTotalY(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                  {lang === 'bn' ? `${formatNumber(partX, lang)} হলো ${formatNumber(totalY, lang)} এর:` : `${partX} is of ${totalY}:`}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
                  {ratioResult !== null
                    ? `${formatNumber(ratioResult.toFixed(2), lang)}%`
                    : (lang === 'bn' ? 'ভুল মান (শূন্য)' : 'Div by 0')}
                </span>
              </div>
              {ratioResult !== null && (
                <button
                  onClick={() =>
                    handleCopy(
                      `${partX} is ${ratioResult.toFixed(2)}% of ${totalY}`,
                      `${partX} / ${totalY}`,
                      `${ratioResult.toFixed(2)}%`
                    )
                  }
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 active:scale-95 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি' : 'কপি করুন'}</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'সূত্র: (অংশ ÷ মোট মান) × ১০০' : 'Formula: (Part ÷ Total) × 100'}
            </div>
          </div>
        )}

        {/* Tab 3: Discount */}
        {activeTab === 'discount' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'কেনাকাটার মূল্যছাড় ও সাশ্রয়' : 'Discount & Savings Calculator'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'আসল মূল্য' : 'Original Price'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'মূল্যছাড় (%)' : 'Discount (%)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'ছাড়ের পর চূড়ান্ত মূল্য' : 'Final Price After Discount'}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                    {formatNumber(finalPrice.toFixed(2), lang)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'মোট সাশ্রয়' : 'You Save'}</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {formatNumber(savings.toFixed(2), lang)} ({formatNumber(discountPercent, lang)}%)
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `Original: ${originalPrice}, Discount: ${discountPercent}%, Final Price: ${finalPrice.toFixed(2)}, Saved: ${savings.toFixed(2)}`,
                    `Discount on ${originalPrice}`,
                    finalPrice.toFixed(2)
                  )
                }
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-98 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.actions.copied : (lang === 'bn' ? 'হিসাব কপি করুন' : 'Copy Discount Result')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Profit & Loss */}
        {activeTab === 'profit' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'ব্যবসায় লাভ বা ক্ষতির হিসাব' : 'Profit & Loss Margin Calculator'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'ক্রয়মূল্য (Cost)' : 'Cost Price (CP)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'বিক্রয়মূল্য (Sale)' : 'Selling Price (SP)'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border flex flex-col gap-3 ${
                isProfit
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isProfit ? (lang === 'bn' ? 'নিট লাভ (Profit)' : 'Net Profit') : (lang === 'bn' ? 'নিট ক্ষতি (Loss)' : 'Net Loss')}
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono block ${
                      isProfit ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'
                    }`}
                  >
                    {formatNumber(Math.abs(profitLossAmount).toFixed(2), lang)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{lang === 'bn' ? 'মার্জিন শতকরা' : 'Margin Rate'}</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatNumber(profitLossMargin.toFixed(2), lang)}%
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    `Cost: ${costPrice}, Sell: ${sellingPrice}, Result: ${isProfit ? 'Profit' : 'Loss'} of ${Math.abs(profitLossAmount).toFixed(2)} (${profitLossMargin.toFixed(2)}%)`,
                    `Profit/Loss on CP ${costPrice}`,
                    `${Math.abs(profitLossAmount).toFixed(2)}`
                  )
                }
                className="w-full h-10 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-98 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.actions.copied : (lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy Profit/Loss')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: % Change */}
        {activeTab === 'change' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'শতকরা পরিবর্তন (বৃদ্ধি বা হ্রাস)' : 'Percentage Increase or Decrease'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'পূর্ববর্তী মান' : 'Initial Value'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={initialVal}
                  onChange={(e) => setInitialVal(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {lang === 'bn' ? 'বর্তমান মান' : 'Final Value'}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={finalVal}
                  onChange={(e) => setFinalVal(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">
                    {isIncrease
                      ? (lang === 'bn' ? 'শতকরা বৃদ্ধি (Increase)' : 'Percentage Increase')
                      : (lang === 'bn' ? 'শতকরা হ্রাস (Decrease)' : 'Percentage Decrease')}
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isIncrease ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {percentChange !== null
                      ? `${isIncrease ? '+' : '-'}${formatNumber(percentChange.toFixed(2), lang)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'মোট পার্থক্য' : 'Absolute Change'}</span>
                  <span className="text-base font-bold text-white font-mono">
                    {formatNumber(changeDiff.toFixed(2), lang)}
                  </span>
                </div>
              </div>

              {percentChange !== null && (
                <button
                  onClick={() =>
                    handleCopy(
                      `From ${initialVal} to ${finalVal}: ${isIncrease ? '+' : '-'}${percentChange.toFixed(2)}%`,
                      `Change ${initialVal} -> ${finalVal}`,
                      `${percentChange.toFixed(2)}%`
                    )
                  }
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-98 transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? t.actions.copied : (lang === 'bn' ? 'কপি করুন' : 'Copy Change Result')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
