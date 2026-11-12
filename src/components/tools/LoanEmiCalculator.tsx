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
  Building2,
  PiggyBank,
  Receipt,
  Landmark,
  ShieldCheck,
  Scale,
  Printer,
  Calculator,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';
import { tallySounds } from '../../utils/tallyAudioVoice';
import {
  calculateLoanEmi,
  calculateDps,
  calculateFdr,
  calculateSanchayapatra,
  calculateVat,
  SanchayapatraType,
} from '../../utils/financeEngine';

interface Props {
  lang: Language;
}

type FinanceTab = 'emi' | 'dps' | 'fdr' | 'sanchay' | 'vat';

export const LoanEmiCalculator: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<FinanceTab>('emi');
  const [copied, setCopied] = useState<boolean>(false);

  // ==========================================
  // TAB 1: LOAN EMI STATE
  // ==========================================
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [isTenureMonths, setIsTenureMonths] = useState<boolean>(false);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const totalMonths = isTenureMonths ? tenureMonths : tenureYears * 12;
  const emiResult = calculateLoanEmi(loanAmount, interestRate, totalMonths);

  // ==========================================
  // TAB 2: DPS (DEPOSIT PENSION SCHEME) STATE
  // ==========================================
  const [dpsMonthlyDeposit, setDpsMonthlyDeposit] = useState<number>(5000);
  const [dpsInterestRate, setDpsInterestRate] = useState<number>(8.5);
  const [dpsTenureYears, setDpsTenureYears] = useState<number>(5);
  const [dpsHasTin, setDpsHasTin] = useState<boolean>(true);

  const dpsResult = calculateDps(dpsMonthlyDeposit, dpsInterestRate, dpsTenureYears, dpsHasTin);

  // ==========================================
  // TAB 3: FDR (FIXED DEPOSIT) STATE
  // ==========================================
  const [fdrPrincipal, setFdrPrincipal] = useState<number>(300000);
  const [fdrRate, setFdrRate] = useState<number>(9.0);
  const [fdrTenureYears, setFdrTenureYears] = useState<number>(1);
  const [fdrHasTin, setFdrHasTin] = useState<boolean>(true);

  const fdrResult = calculateFdr(fdrPrincipal, fdrRate, fdrTenureYears, fdrHasTin);

  // ==========================================
  // TAB 4: SANCHAYAPATRA (জাতীয় সঞ্চয়পত্র)
  // ==========================================
  const [sanchayAmount, setSanchayAmount] = useState<number>(1000000); // 10 Lakhs
  const [sanchayType, setSanchayType] = useState<SanchayapatraType>('poribar');

  const sanchayResult = calculateSanchayapatra(sanchayAmount, sanchayType);

  // ==========================================
  // TAB 5: VAT CALCULATOR STATE
  // ==========================================
  const [vatAmountInput, setVatAmountInput] = useState<number>(1000);
  const [vatRate, setVatRate] = useState<number>(15);
  const [vatIsInclusive, setVatIsInclusive] = useState<boolean>(false);

  const vatResult = calculateVat(vatAmountInput, vatRate, vatIsInclusive);

  const handleCopy = async () => {
    tallySounds.playClickSound();
    let text = '';
    if (activeTab === 'emi') {
      text = `ব্যাংক লোন ও কিস্তি রিপোর্ট:
মূল লোন: ৳${loanAmount.toLocaleString('en-IN')}
সুদের হার: ${interestRate}% | মেয়াদ: ${totalMonths} মাস
-----------------------------
মাসিক কিস্তি (EMI): ৳${emiResult.monthlyEmi.toLocaleString('en-IN')}
মোট পরিশোধ: ৳${emiResult.totalPayment.toLocaleString('en-IN')}
মোট সুদ: ৳${emiResult.totalInterest.toLocaleString('en-IN')}`;
    } else if (activeTab === 'dps') {
      text = `ডিপিএস (DPS) ম্যাচিউরিটি রিপোর্ট:
মাসিক জমা: ৳${dpsMonthlyDeposit.toLocaleString('en-IN')}
মেয়াদ: ${dpsTenureYears} বছর | মুনাফা হার: ${dpsInterestRate}%
মোট জমা টাকা: ৳${dpsResult.totalInvested.toLocaleString('en-IN')}
অর্জিত মোট মুনাফা: ৳${dpsResult.grossInterest.toLocaleString('en-IN')}
ট্যাক্স কর্তন (${dpsHasTin ? '১০%' : '১৫%'}): ৳${dpsResult.taxAmount.toLocaleString('en-IN')}
-----------------------------
মেয়াদান্তে নিট প্রাপ্তি: ৳${dpsResult.netMaturityAmount.toLocaleString('en-IN')}`;
    } else if (activeTab === 'fdr') {
      text = `এফডিআর (FDR) মুনাফা রিপোর্ট:
স্থায়ী আমানত: ৳${fdrPrincipal.toLocaleString('en-IN')}
মেয়াদ: ${fdrTenureYears} বছর | মুনাফার হার: ${fdrRate}%
নিট মুনাফা: ৳${fdrResult.netProfit.toLocaleString('en-IN')}
মাসিক তোলার সুযোগ: ৳${fdrResult.monthlyIncome.toLocaleString('en-IN')}/মাস
মেয়াদান্তে মোট প্রাপ্তি: ৳${fdrResult.totalMaturity.toLocaleString('en-IN')}`;
    } else if (activeTab === 'sanchay') {
      text = `জাতীয় সঞ্চয়পত্র মুনাফা রিপোর্ট (${sanchayResult.typeNameBn}):
বিনিয়োগের পরিমাণ: ৳${sanchayAmount.toLocaleString('en-IN')}
${sanchayResult.periodLabel}: ৳${sanchayResult.netProfitPerPeriod.toLocaleString('en-IN')}
বার্ষিক মোট নিট মুনাফা: ৳${sanchayResult.annualNetProfit.toLocaleString('en-IN')}
উৎস কর কর্তন: ${sanchayResult.sourceTaxPercent}%`;
    } else {
      text = `ভ্যাট (VAT) হিসাব:
মূল্য: ৳${vatAmountInput.toLocaleString('en-IN')} (${vatIsInclusive ? 'ভ্যাট সহ' : 'ভ্যাট ছাড়া'})
ভ্যাট হার: ${vatRate}%
ভ্যাট পরিমাণ: ৳${vatResult.vatAmount.toLocaleString('en-IN')}
সর্বমোট মূল্য: ৳${vatResult.totalAmount.toLocaleString('en-IN')}`;
    }

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'emi',
      titleEn: 'Smart Banking & Finance',
      titleBn: 'ব্যাংকিং ও লোন হাব',
      expression: `${activeTab.toUpperCase()}: ৳${loanAmount.toLocaleString('en-IN')}`,
      result: `EMI ৳${emiResult.monthlyEmi.toLocaleString('en-IN')}`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-300" />
              {isBn ? 'স্মার্ট ব্যাংকিং ও ইনভেস্টমেন্ট হাব' : 'Smart Banking & Finance Hub'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition text-xs font-bold"
                title="Print"
              >
                <Printer size={14} />
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isBn ? 'লোন ইএমআই, ডিপিএস ও সঞ্চয়পত্র হাব' : 'Loan EMI, DPS & Sanchayapatra'}
          </h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            {isBn
              ? 'ব্যাংক লোন কিস্তি, ডিপিএস ম্যাচিউরিটি, এফডিআর ও জাতীয় সঞ্চয়পত্রের সরকারি স্ল্যাবভিত্তিক মুনাফা'
              : 'Bank loan amortization, DPS maturity, FDR fixed deposits & national savings certificates'}
          </p>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="grid grid-cols-5 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-[11px] font-bold">
        {[
          { id: 'emi', labelBn: 'লোন EMI', labelEn: 'Loan EMI', icon: DollarSign },
          { id: 'dps', labelBn: 'ডিপিএস', labelEn: 'DPS', icon: PiggyBank },
          { id: 'fdr', labelBn: 'এফডিআর', labelEn: 'FDR', icon: Building2 },
          { id: 'sanchay', labelBn: 'সঞ্চয়পত্র', labelEn: 'Sanchaya', icon: Landmark },
          { id: 'vat', labelBn: 'ভ্যাট ও কর', labelEn: 'VAT', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
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
          TAB 1: BANK LOAN & EMI CALCULATOR
         ========================================================================= */}
      {activeTab === 'emi' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            {/* Loan Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ঋণ / লোনের পরিমাণ (টাকা):
              </label>
              <input
                type="number"
                value={loanAmount || ''}
                onChange={(e) => setLoanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-2xl px-3 font-mono font-bold text-base text-slate-900 dark:text-white"
              />
            </div>

            {/* Interest Rate & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  বার্ষিক সুদের হার (%):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">মার্কেট রেট ৯% - ১৪%</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-sm text-slate-900 dark:text-white"
              />
              <div className="flex gap-1.5 mt-2">
                {[
                  { label: 'হোম লোন ৯%', rate: 9.0 },
                  { label: 'অটো লোন ১১%', rate: 11.0 },
                  { label: 'পার্সোনাল ১৩%', rate: 13.0 },
                ].map((p) => (
                  <button
                    key={p.rate}
                    onClick={() => setInterestRate(p.rate)}
                    className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  পরিশোধের মেয়াদ ({isTenureMonths ? 'মাস' : 'বছর'}):
                </label>
                <button
                  onClick={() => setIsTenureMonths(!isTenureMonths)}
                  className="text-[10px] text-[#0B63F6] font-bold"
                >
                  {isTenureMonths ? 'বছরে পরিবর্তন করুন' : 'মাসে পরিবর্তন করুন'}
                </button>
              </div>

              {isTenureMonths ? (
                <input
                  type="number"
                  value={tenureMonths || ''}
                  onChange={(e) => setTenureMonths(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-sm"
                  placeholder="কত মাস"
                />
              ) : (
                <div className="grid grid-cols-4 gap-1.5 font-mono text-xs font-bold">
                  {[1, 3, 5, 10].map((y) => (
                    <button
                      key={y}
                      onClick={() => setTenureYears(y)}
                      className={`py-2 rounded-xl border text-center transition ${
                        tenureYears === y
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] border-[#0B63F6]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      {y} বছর
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly EMI Hero Card */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-emerald-100 block font-medium">প্রতি মাসের কিস্তি (EMI):</span>
                <h3 className="text-3xl font-black font-mono">
                  ৳{emiResult.monthlyEmi.toLocaleString('en-IN')}
                </h3>
                <span className="text-[10px] text-emerald-100/80 block mt-0.5">
                  মেয়াদ: {totalMonths} মাস ({Math.round(totalMonths / 12)} বছর)
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <DollarSign size={28} className="text-white" />
              </div>
            </div>

            {/* Total Payment & Interest Split */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">মোট সুদ দিতে হবে:</span>
                <span className="text-base font-extrabold font-mono text-rose-500">
                  ৳{emiResult.totalInterest.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  লোনের {emiResult.interestPercentage.toFixed(1)}% সুদ
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">সর্বমোট পরিশোধ:</span>
                <span className="text-base font-extrabold font-mono text-[#0B63F6]">
                  ৳{emiResult.totalPayment.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">মূলধন + মোট সুদ</span>
              </div>
            </div>

            {/* Amortization Schedule Accordion */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 flex items-center justify-between font-bold text-slate-700 dark:text-slate-300"
              >
                <span>বছরভিত্তিক ঋণ পরিশোধের শিডিউল (Amortization):</span>
                {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showSchedule && (
                <div className="p-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 border-b pb-1">
                    <span>বছর</span>
                    <span>মূলধন পরিশোধ</span>
                    <span>সুদ পরিশোধ</span>
                    <span className="text-right">বাকি ব্যালেন্স</span>
                  </div>
                  {emiResult.yearlySchedule.map((s) => (
                    <div key={s.year} className="grid grid-cols-4 text-[11px] font-mono py-1 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                      <span className="font-bold">বছর {s.year}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">৳{s.principalPaid.toLocaleString('en-IN')}</span>
                      <span className="text-rose-500">৳{s.interestPaid.toLocaleString('en-IN')}</span>
                      <span className="text-right font-bold">৳{s.balance.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DPS (DEPOSIT PENSION SCHEME) CALCULATOR
         ========================================================================= */}
      {activeTab === 'dps' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <PiggyBank size={14} className="text-pink-500" />
              {isBn ? 'ডিপিএস মাসিক কিস্তি ও মুনাফা হিসাব:' : 'DPS Deposit & Maturity:'}
            </span>

            {/* Monthly Deposit */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                প্রতি মাসে জমার পরিমাণ (টাকা):
              </label>
              <input
                type="number"
                value={dpsMonthlyDeposit || ''}
                onChange={(e) => setDpsMonthlyDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base text-pink-600 dark:text-pink-400"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2 text-[10px] font-bold">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDpsMonthlyDeposit(amt)}
                    className="py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                  >
                    ৳{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মেয়াদ (বছর):
                </label>
                <select
                  value={dpsTenureYears}
                  onChange={(e) => setDpsTenureYears(parseInt(e.target.value))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold font-mono"
                >
                  <option value="3">৩ বছর (৩৬ মাস)</option>
                  <option value="5">৫ বছর (৬০ মাস)</option>
                  <option value="7">৭ বছর (৮৪ মাস)</option>
                  <option value="10">১০ বছর (১২০ মাস)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মুনাফার হার (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dpsInterestRate}
                  onChange={(e) => setDpsInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* TIN Certificate toggle */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-300 block">টিন (TIN) সার্টিফিকেট আছে?</span>
                <span className="text-[10px] text-slate-500">টিন থাকলে ১০% ট্যাক্স, না থাকলে ১৫%</span>
              </div>
              <input
                type="checkbox"
                checked={dpsHasTin}
                onChange={(e) => setDpsHasTin(e.target.checked)}
                className="w-4 h-4 rounded text-[#0B63F6]"
              />
            </div>

            {/* DPS Result Card */}
            <div className="p-5 bg-gradient-to-r from-pink-600 to-rose-700 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-pink-100 block font-medium">মেয়াদ শেষে মোট নিট প্রাপ্তি:</span>
                <h3 className="text-3xl font-black font-mono">
                  ৳{dpsResult.netMaturityAmount.toLocaleString('en-IN')}
                </h3>
                <span className="text-[10px] text-pink-100/80 block mt-0.5">
                  ট্যাক্স কর্তনের পর নিট টাকা
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <PiggyBank size={28} className="text-white" />
              </div>
            </div>

            {/* DPS Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold">মোট জমা আসল:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  ৳{dpsResult.totalInvested.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold">অর্জিত মোট লাভ:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ৳{dpsResult.grossInterest.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold">ট্যাক্স ({dpsHasTin ? '১০%' : '১৫%'}):</span>
                <span className="font-bold font-mono text-rose-500">
                  ৳{dpsResult.taxAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FDR (FIXED DEPOSIT) CALCULATOR
         ========================================================================= */}
      {activeTab === 'fdr' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Building2 size={14} className="text-[#0B63F6]" />
              {isBn ? 'স্থায়ী আমানত (FDR) এককালীন বিনিয়োগ:' : 'Fixed Deposit (FDR) Calculator:'}
            </span>

            {/* Principal Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                স্থায়ী আমানত জমার পরিমাণ (টাকা):
              </label>
              <input
                type="number"
                value={fdrPrincipal || ''}
                onChange={(e) => setFdrPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base text-[#0B63F6]"
              />
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-bold">
                {[100000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setFdrPrincipal(amt)}
                    className="py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                  >
                    ৳{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate & Tenure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বার্ষিক সুদের হার (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={fdrRate}
                  onChange={(e) => setFdrRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মেয়াদ (বছর):
                </label>
                <select
                  value={fdrTenureYears}
                  onChange={(e) => setFdrTenureYears(parseInt(e.target.value))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold font-mono"
                >
                  <option value="1">১ বছর</option>
                  <option value="2">২ বছর</option>
                  <option value="3">৩ বছর</option>
                  <option value="5">৫ বছর</option>
                </select>
              </div>
            </div>

            {/* FDR Result Hero */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-blue-100 block font-medium">মেয়াদ শেষে আসল ও লাভ মিলিয়ে:</span>
                <h3 className="text-3xl font-black font-mono">
                  ৳{fdrResult.totalMaturity.toLocaleString('en-IN')}
                </h3>
                <span className="text-[10px] text-blue-100/80 block mt-0.5">
                  নিট লাভ: ৳{fdrResult.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Building2 size={28} className="text-white" />
              </div>
            </div>

            {/* Monthly Interest Option */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-purple-900 dark:text-purple-300 block">
                  মাসিক মুনাফা তোলার সুবিধা:
                </span>
                <span className="text-[10px] text-slate-500">যদি প্রতি মাসে লাভ তুলতে চান</span>
              </div>
              <span className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
                ৳{fdrResult.monthlyIncome.toLocaleString('en-IN')}/মাস
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SANCHAYAPATRA (জাতীয় সঞ্চয়পত্র মুনাফা হাব)
         ========================================================================= */}
      {activeTab === 'sanchay' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Landmark size={14} className="text-amber-500" />
              {isBn ? 'সরকারি সঞ্চয়পত্রের প্রকারভেদ ও স্ল্যাব মুনাফা:' : 'Sanchayapatra Profit Hub:'}
            </span>

            {/* Sanchaya Type Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">সঞ্চয়পত্রের ধরন:</label>
              <select
                value={sanchayType}
                onChange={(e) => setSanchayType(e.target.value as SanchayapatraType)}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
              >
                <option value="poribar">পরিবার সঞ্চয়পত্র (৫ বছর - মাসিক কিস্তি মুনাফা)</option>
                <option value="three_month">৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র (৩ বছর)</option>
                <option value="pensioner">পেনশনার সঞ্চয়পত্র (৫ বছর - অবসরপ্রাপ্তদের জন্য)</option>
                <option value="bangladesh">বাংলাদেশ সঞ্চয়পত্র (৫ বছর - সাধারণ)</option>
              </select>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                বিনিয়োগের পরিমাণ (টাকা):
              </label>
              <input
                type="number"
                value={sanchayAmount || ''}
                onChange={(e) => setSanchayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base text-amber-600 dark:text-amber-400"
              />
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-bold">
                {[500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSanchayAmount(amt)}
                    className="py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                  >
                    ৳{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Card */}
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-amber-100 block font-medium">
                  {sanchayResult.periodLabel}:
                </span>
                <h3 className="text-3xl font-black font-mono">
                  ৳{sanchayResult.netProfitPerPeriod.toLocaleString('en-IN')}
                </h3>
                <span className="text-[10px] text-amber-100/80 block mt-0.5">
                  উৎস কর {sanchayResult.sourceTaxPercent}% কর্তনের পর নিট টাকা
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Landmark size={28} className="text-white" />
              </div>
            </div>

            {/* Sanchaya Details Note */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs flex flex-col gap-1">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                সরকারি স্ল্যাব নীতিমালা:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                ১৫ লাখ টাকা পর্যন্ত সর্বোচ্চ রেট কার্যকর। ১৫ লাখ থেকে ৩০ লাখ পর্যন্ত দ্বিতীয় ধাপ এবং ৩০ লাখের বেশি বিনিয়োগে ৩য় ধাপের মুনাফা প্রযোজ্য। ৫ লাখ পর্যন্ত বিনিয়োগে ৫% কর, এর বেশি হলে ১০% কর স্বয়ংক্রিয়ভাবে ব্যাংক কর্তন করে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: VAT CALCULATOR
         ========================================================================= */}
      {activeTab === 'vat' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Receipt size={14} className="text-[#0B63F6]" />
              {isBn ? 'মূল্য সংযোজন কর (ভ্যাট / VAT) হিসাব:' : 'VAT & Sales Tax Calculator:'}
            </span>

            {/* Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                টাকার পরিমাণ (Amount):
              </label>
              <input
                type="number"
                value={vatAmountInput || ''}
                onChange={(e) => setVatAmountInput(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base"
              />
            </div>

            {/* VAT Rate */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ভ্যাট হার (%):
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold font-mono">
                {[5, 7.5, 10, 15].map((r) => (
                  <button
                    key={r}
                    onClick={() => setVatRate(r)}
                    className={`py-2 rounded-xl border text-center transition ${
                      vatRate === r
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] border-[#0B63F6]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Inclusive vs Exclusive */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-11 items-center text-xs font-bold">
              <button
                onClick={() => setVatIsInclusive(false)}
                className={`h-full rounded-xl transition ${
                  !vatIsInclusive ? 'bg-white dark:bg-slate-700 text-[#0B63F6] shadow-xs' : 'text-slate-500'
                }`}
              >
                ভ্যাট ছাড়া (Exclusive)
              </button>
              <button
                onClick={() => setVatIsInclusive(true)}
                className={`h-full rounded-xl transition ${
                  vatIsInclusive ? 'bg-white dark:bg-slate-700 text-[#0B63F6] shadow-xs' : 'text-slate-500'
                }`}
              >
                ভ্যাট সহ (Inclusive)
              </button>
            </div>

            {/* VAT Output Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col gap-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">মূল পণ্য/সেবার দাম:</span>
                <span className="text-sm font-bold font-mono">৳{vatResult.baseAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-amber-400">ভ্যাট ({vatRate}%):</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  + ৳{vatResult.vatAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-white">সর্বমোট প্রদেয় বিল:</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ৳{vatResult.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
