import React, { useState } from 'react';
import {
  DollarSign,
  Calendar,
  Percent,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  PieChart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

export const LoanEmiCalculator: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];

  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [isTenureMonths, setIsTenureMonths] = useState<boolean>(false);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Total tenure in months
  const totalMonths = isTenureMonths ? tenureMonths : tenureYears * 12;

  // Monthly Interest Rate
  const monthlyRate = interestRate / 12 / 100;

  // EMI Formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
  let emi = 0;
  if (monthlyRate > 0 && totalMonths > 0 && loanAmount > 0) {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    emi = (loanAmount * monthlyRate * factor) / (factor - 1);
  } else if (totalMonths > 0 && loanAmount > 0) {
    emi = loanAmount / totalMonths;
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
  const principalPercentage = 100 - interestPercentage;

  // Generate Year-by-year Amortization
  const generateYearlySchedule = () => {
    const years = Math.ceil(totalMonths / 12);
    let balance = loanAmount;
    const schedule: { year: number; principalPaid: number; interestPaid: number; balance: number }[] = [];

    for (let y = 1; y <= years; y++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      const monthsInThisYear = Math.min(12, totalMonths - (y - 1) * 12);

      for (let m = 0; m < monthsInThisYear; m++) {
        const intPayment = balance * monthlyRate;
        const prinPayment = emi - intPayment;
        yearInterest += intPayment;
        yearPrincipal += prinPayment;
        balance = Math.max(0, balance - prinPayment);
      }

      schedule.push({
        year: y,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        balance,
      });
    }

    return schedule;
  };

  const handleReset = () => {
    setLoanAmount(500000);
    setInterestRate(9.5);
    setTenureYears(5);
    setTenureMonths(60);
    setIsTenureMonths(false);
  };

  const handleCopy = async () => {
    const text = `${lang === 'bn' ? 'ইএমআই ও লোন হিসাব' : 'Loan EMI Calculation'}:
${lang === 'bn' ? 'মূল লোন' : 'Principal Amount'}: ৳${loanAmount.toLocaleString()}
${lang === 'bn' ? 'সুদের হার' : 'Interest Rate'}: ${interestRate}%
${lang === 'bn' ? 'মেয়াদ' : 'Tenure'}: ${totalMonths} ${lang === 'bn' ? 'মাস' : 'months'}
------------------------
${lang === 'bn' ? 'প্রতি মাসের কিস্তি (EMI)' : 'Monthly EMI'}: ৳${Math.round(emi).toLocaleString()}
${lang === 'bn' ? 'মোট প্রদেয় সুদ' : 'Total Interest'}: ৳${Math.round(totalInterest).toLocaleString()}
${lang === 'bn' ? 'মোট পরিশোধযোগ্য টাকা' : 'Total Payment'}: ৳${Math.round(totalPayment).toLocaleString()}`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'emi',
      titleEn: 'Loan EMI Calculator',
      titleBn: 'ইএমআই ও লোন ক্যালকুলেটর',
      expression: `৳${loanAmount.toLocaleString()} @ ${interestRate}% (${totalMonths}m)`,
      result: `EMI: ৳${Math.round(emi).toLocaleString()}`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#0B63F6]" />
            <span>{lang === 'bn' ? 'ঋণের তথ্য প্রদান করুন:' : 'Loan Parameters:'}</span>
          </span>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.actions.reset}</span>
          </button>
        </div>

        {/* Loan Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'ঋণের মোট পরিমাণ (লোন অ্যামাউন্ট):' : 'Loan Amount:'}
            </label>
            <span className="text-xs font-mono font-bold text-[#0B63F6]">
              ৳ {loanAmount.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
            <input
              type="number"
              value={loanAmount || ''}
              onChange={(e) => setLoanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[100000, 300000, 500000, 1000000, 2000000].map((amt) => (
              <button
                key={amt}
                onClick={() => setLoanAmount(amt)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  loanAmount === amt
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                ৳ {amt >= 100000 ? `${amt / 100000} লাখ` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'বার্ষিক সুদের হার (Interest Rate %):' : 'Annual Interest Rate (%):'}
            </label>
            <span className="text-xs font-mono font-bold text-[#0B63F6]">
              {interestRate}%
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={interestRate || ''}
              onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
            />
            <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[7.5, 9.0, 10.5, 12.0, 14.0].map((r) => (
              <button
                key={r}
                onClick={() => setInterestRate(r)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  interestRate === r
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* Tenure */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'ঋণের মেয়াদ (Tenure):' : 'Loan Tenure:'}
            </label>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setIsTenureMonths(false)}
                className={`px-2 py-0.5 rounded ${!isTenureMonths ? 'bg-white dark:bg-slate-700 text-[#0B63F6] shadow-xs' : 'text-slate-500'}`}
              >
                {lang === 'bn' ? 'বছর' : 'Years'}
              </button>
              <button
                onClick={() => {
                  setIsTenureMonths(true);
                  setTenureMonths(tenureYears * 12);
                }}
                className={`px-2 py-0.5 rounded ${isTenureMonths ? 'bg-white dark:bg-slate-700 text-[#0B63F6] shadow-xs' : 'text-slate-500'}`}
              >
                {lang === 'bn' ? 'মাস' : 'Months'}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              value={isTenureMonths ? tenureMonths : tenureYears}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                if (isTenureMonths) setTenureMonths(val);
                else setTenureYears(val);
              }}
              className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {isTenureMonths ? (lang === 'bn' ? 'মাস' : 'Months') : (lang === 'bn' ? 'বছর' : 'Years')}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
              <button
                key={y}
                onClick={() => {
                  setIsTenureMonths(false);
                  setTenureYears(y);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  !isTenureMonths && tenureYears === y
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {y} {lang === 'bn' ? 'বছর' : 'Yr'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'bn' ? 'হিসাবের ফলাফল:' : 'Calculated EMI Breakdown:'}</span>
        </span>

        {/* Big EMI Display */}
        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-400">
            {lang === 'bn' ? 'প্রতি মাসের কিস্তি (Monthly EMI)' : 'Monthly Installment (EMI)'}
          </span>
          <span className="text-3xl font-black font-mono text-emerald-400 mt-1">
            ৳ {formatNumber(Math.round(emi).toLocaleString(), lang)}
          </span>
        </div>

        {/* 2-Column Details */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col">
            <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'মোট প্রদেয় সুদ' : 'Total Interest'}</span>
            <span className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              ৳ {formatNumber(Math.round(totalInterest).toLocaleString(), lang)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col">
            <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'মোট পরিশোধযোগ্য টাকা' : 'Total Payment'}</span>
            <span className="text-sm font-bold text-blue-400 font-mono mt-0.5">
              ৳ {formatNumber(Math.round(totalPayment).toLocaleString(), lang)}
            </span>
          </div>
        </div>

        {/* Ratio Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>মূল ঋণ ({principalPercentage.toFixed(1)}%)</span>
            <span>সুদ ({interestPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full h-2.5 bg-amber-500 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${principalPercentage}%` }}
              className="h-full bg-blue-500 rounded-l-full"
            />
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.actions.copied : (lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy Loan Summary')}</span>
        </button>
      </div>

      {/* Yearly Schedule Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0B63F6]" />
            <span>{lang === 'bn' ? 'বছরভিত্তিক পেমেন্ট শিডিউল দেখুন' : 'Yearly Payment Schedule'}</span>
          </span>
          {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSchedule && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-1">বছর</th>
                  <th className="py-2 px-1">মূল পরিশোধ</th>
                  <th className="py-2 px-1">সুদ পরিশোধ</th>
                  <th className="py-2 px-1 text-right">অবশিষ্ট ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {generateYearlySchedule().map((row) => (
                  <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2 px-1 font-bold">বছর {row.year}</td>
                    <td className="py-2 px-1 font-mono text-blue-600 dark:text-blue-400">
                      ৳{Math.round(row.principalPaid).toLocaleString()}
                    </td>
                    <td className="py-2 px-1 font-mono text-amber-600 dark:text-amber-400">
                      ৳{Math.round(row.interestPaid).toLocaleString()}
                    </td>
                    <td className="py-2 px-1 font-mono text-right font-semibold">
                      ৳{Math.round(row.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
