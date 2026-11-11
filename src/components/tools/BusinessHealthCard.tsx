import React from 'react';
import { Activity, TrendingUp, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Customer, Transaction, toBn } from './TallyKhataView';
import { ProductItem } from './TallyStockAndProfit';
import { calculateBusinessHealthScore, BusinessHealthProfile } from '../../utils/tallyCreditScorer';

interface BusinessHealthCardProps {
  customers: Customer[];
  transactions: Transaction[];
  products: ProductItem[];
  onNavigateToStock?: () => void;
}

export const BusinessHealthCard: React.FC<BusinessHealthCardProps> = ({
  customers,
  transactions,
  products,
  onNavigateToStock,
}) => {
  const health: BusinessHealthProfile = calculateBusinessHealthScore(customers, transactions, products);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/40 flex flex-col gap-4 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Google AI Business Health
              </span>
            </div>
            <h3 className="text-sm font-black mt-1">দোকানের ব্যবসায়িক হেলথ স্কোর</h3>
          </div>
        </div>

        {/* Score Radial Badge */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-indigo-300 block font-bold">সার্বিক স্থিতি</span>
            <span className="text-xs font-black text-amber-300">{health.statusBn}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-inner">
            <span className="text-xs font-black text-emerald-400 leading-none">{health.score}</span>
            <span className="text-[9px] font-bold text-white/60">গ্রেড {health.grade}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Metric 1: Cash Sales Ratio */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">নগদ বনাম বাকি বিক্রি</span>
            <span className="font-bold text-emerald-400">{toBn(health.cashSalesPct)}% নগদ</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${health.cashSalesPct}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <span className="text-[10px] text-slate-400">
            বাকি বিক্রি: {toBn(health.dueSalesPct)}%
          </span>
        </div>

        {/* Metric 2: Due Collection Efficiency */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">বকেয়া আদায়ের দক্ষতা</span>
            <span className="font-bold text-blue-400">{toBn(health.collectionRate)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${health.collectionRate}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <span className="text-[10px] text-slate-400">
            মোট বাকি আদায়ের গতি
          </span>
        </div>

        {/* Metric 3: Stock Status */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300">ইনভেন্টরি স্বাস্থ্য</span>
            <span className={`font-bold ${health.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {health.lowStockCount > 0 ? `${toBn(health.lowStockCount)}টি স্বল্প স্টক` : 'সব সচল'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              style={{
                width: `${Math.max(20, Math.min(100, ((products.length - health.lowStockCount) / Math.max(1, products.length)) * 100))}%`,
              }}
              className={`h-full rounded-full ${health.lowStockCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
          </div>
          <span className="text-[10px] text-slate-400">
            মোট তালিকাভুক্ত পণ্য: {toBn(products.length)}টি
          </span>
        </div>
      </div>

      {/* Actionable Tips */}
      {health.tips.length > 0 && (
        <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex flex-col gap-1.5 text-xs text-indigo-100">
          <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            AI স্মার্ট পরামর্শ:
          </span>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-200">
            {health.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
