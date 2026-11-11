import React, { useState } from 'react';
import { Star, ShieldCheck, AlertCircle, Info, Sparkles, X } from 'lucide-react';
import { Customer, Transaction, toBn } from './TallyKhataView';
import { calculateCustomerCreditScore, CustomerCreditProfile } from '../../utils/tallyCreditScorer';
import { tallySounds } from '../../utils/tallyAudioVoice';

interface CustomerCreditBadgeProps {
  customer: Customer;
  transactions: Transaction[];
  compact?: boolean;
}

export const CustomerCreditBadge: React.FC<CustomerCreditBadgeProps> = ({
  customer,
  transactions,
  compact = false,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const profile: CustomerCreditProfile = calculateCustomerCreditScore(customer, transactions);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    tallySounds.playClickSound();
    setShowDetailModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="কাস্টমার ক্রেডিট ট্রাস্ট স্কোর দেখতে ক্লিক করুন"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition hover:scale-105 cursor-pointer ${profile.badgeBg} ${profile.badgeText} ${profile.borderColor}`}
      >
        {profile.rating === 'excellent' ? (
          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
        ) : profile.rating === 'moderate' ? (
          <ShieldCheck className="w-3 h-3 text-amber-500" />
        ) : (
          <AlertCircle className="w-3 h-3 text-rose-500" />
        )}
        <span>{profile.score} স্কোর</span>
        {!compact && <span className="opacity-80">({profile.labelBn})</span>}
      </button>

      {/* Credit Trust Score AI Detail Modal */}
      {showDetailModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  AI ক্রেডিট ট্রাস্ট বিশ্লেষণ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Radial Circle Header */}
            <div className="text-center py-2 flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-inner ${
                  profile.rating === 'excellent'
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : profile.rating === 'moderate'
                    ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                    : 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                }`}
              >
                {toBn(profile.score)}
              </div>
              <span className="font-bold text-sm mt-2 text-slate-800 dark:text-slate-200">
                {customer.name}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${profile.badgeBg} ${profile.badgeText}`}>
                রেটিং: {profile.labelBn}
              </span>
            </div>

            {/* Metric Breakdown Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">পরিশোধের হার</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {toBn(profile.repaymentRate)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">বকেয়া থাকার বয়স</span>
                <span className="font-black text-slate-700 dark:text-slate-300 text-sm">
                  {toBn(profile.agingDays)} দিন
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">মোট বাকির পরিমাণ</span>
                <span className="font-black text-slate-700 dark:text-slate-300 text-sm">
                  ৳ {toBn(profile.totalTaken)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">মোট জমা আদায়</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ৳ {toBn(profile.totalPaid)}
                </span>
              </div>
            </div>

            {/* AI Recommendation Message */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                💡 AI ব্যবসায়িক পরামর্শ:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{profile.aiRecommendation}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
};
