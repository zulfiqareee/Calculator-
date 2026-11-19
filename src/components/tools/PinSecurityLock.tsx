import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { tallySounds } from '../../utils/tallyAudioVoice';
import {
  PIN_ENABLED_KEY,
  verifyTallyPin,
  saveHashedTallyPin,
  getPinLockoutState,
  recordFailedPinAttempt,
  resetPinLockout,
  getTallyCloudAccount,
  loginTallyCloudAccount,
} from '../../utils/tallySecurity';

export { PIN_ENABLED_KEY };

const DEFAULT_DEMO_PHONES = new Set(['০১৭১২-৩৪৫৬৭৮', '01712345678', '01712-345678']);

interface PinSecurityLockProps {
  isLocked: boolean;
  onUnlock: () => void;
  shopName?: string;
  shopPhone?: string;
}

function normalizeDigits(str: string): string {
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  return str.replace(/[০-৯]/g, (d) => bnToEn[d] || d).replace(/\D/g, '');
}

export const PinSecurityLock: React.FC<PinSecurityLockProps> = ({
  isLocked,
  onUnlock,
  shopName = 'মেসার্স ভাই ভাই এন্টারপ্রাইজ',
  shopPhone = '০১৭১২-৩৪৫৬৭৮',
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  // Recovery form state
  const [verifyPhoneLast4, setVerifyPhoneLast4] = useState<string>('');
  const [cloudPasscode, setCloudPasscode] = useState<string>('');
  const [newRecoveryPin, setNewRecoveryPin] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const cloudAccount = getTallyCloudAccount();
  const isCustomPhone = !DEFAULT_DEMO_PHONES.has(shopPhone.trim()) && normalizeDigits(shopPhone).length >= 6;

  useEffect(() => {
    if (!isLocked) return;
    const updateTimer = () => {
      const state = getPinLockoutState();
      if (state.lockedUntil > Date.now()) {
        setLockoutRemainingSec(Math.ceil((state.lockedUntil - Date.now()) / 1000));
      } else {
        setLockoutRemainingSec(0);
      }
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  if (!isLocked) return null;

  const handleKeyPress = async (num: string) => {
    if (lockoutRemainingSec > 0) {
      setErrorMsg(`অনেকবার ভুল পিন দেওয়া হয়েছে। ${lockoutRemainingSec} সেকেন্ড পর চেষ্টা করুন।`);
      return;
    }
    if (enteredPin.length >= 4) return;
    tallySounds.playClickSound();
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      const ok = await verifyTallyPin(nextPin);
      if (ok) {
        resetPinLockout();
        tallySounds.playSuccessChime();
        setEnteredPin('');
        onUnlock();
      } else {
        const nextLock = recordFailedPinAttempt();
        setTimeout(() => {
          if (nextLock.lockedUntil > Date.now()) {
            setLockoutRemainingSec(Math.ceil((nextLock.lockedUntil - Date.now()) / 1000));
            setErrorMsg('৫ বার ভুল পিন! ৩০ সেকেন্ডের জন্য লক করা হয়েছে।');
          } else {
            setErrorMsg(`ভুল পিন কোড! (${nextLock.failedAttempts}/5)`);
          }
          setEnteredPin('');
        }, 250);
      }
    }
  };

  const handleDelete = () => {
    tallySounds.playClickSound();
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    tallySounds.playClickSound();
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleVerifiedPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!/^\d{4}$/.test(newRecoveryPin)) {
      setRecoveryError('অনুগ্রহ করে নতুন ৪-ডিজিট সংখ্যা পিন লিখুন।');
      return;
    }

    setIsRecovering(true);
    try {
      let verified = false;
      if (cloudAccount) {
        if (!cloudPasscode.trim()) {
          setRecoveryError('আপনার ক্লাউড অ্যাকাউন্টের পাসকোড দিন।');
          return;
        }
        const res = await loginTallyCloudAccount(cloudAccount.accountId, cloudPasscode.trim());
        if (!res.success) {
          setRecoveryError(res.error || 'ক্লাউড পাসকোড সঠিক নয়।');
          return;
        }
        verified = true;
      } else if (isCustomPhone) {
        const expectedLast4 = normalizeDigits(shopPhone).slice(-4);
        const providedLast4 = normalizeDigits(verifyPhoneLast4);
        if (providedLast4.length !== 4 || providedLast4 !== expectedLast4) {
          setRecoveryError('দোকানের নিবন্ধিত মোবাইল নম্বরের শেষ ৪ ডিজিট মেলেনি।');
          return;
        }
        verified = true;
      }

      if (!verified) {
        setRecoveryError('পিন রিকভারি করার জন্য দোকানের নিজস্ব মোবাইল নম্বর অথবা ক্লাউড অ্যাকাউন্ট সেট করা থাকতে হবে।');
        return;
      }

      const saved = await saveHashedTallyPin(newRecoveryPin);
      if (!saved) {
        setRecoveryError('নতুন পিন সংরক্ষণ করা যায়নি।');
        return;
      }

      resetPinLockout();
      setVerifyPhoneLast4('');
      setCloudPasscode('');
      setNewRecoveryPin('');
      setShowForgotModal(false);
      tallySounds.playSuccessChime();
      onUnlock();
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Lock Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-base font-black text-slate-900 dark:text-white">টালি খাতা লক করা আছে</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {shopName} এর হিসাব খুলতে ৪-ডিজিট পিন কোড লিখুন
        </p>

        {/* PIN Dots Display */}
        <div className="flex items-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-500 scale-110 shadow-sm'
                    : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <span className="text-xs font-bold text-rose-500 mb-2 animate-shake flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
          </span>
        )}

        {lockoutRemainingSec > 0 && !errorMsg && (
          <span className="text-xs font-bold text-amber-500 mb-2">
            অপেক্ষা করুন: {lockoutRemainingSec} সেকেন্ড
          </span>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              disabled={lockoutRemainingSec > 0}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-black transition active:scale-95 cursor-pointer shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            disabled={lockoutRemainingSec > 0}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-black transition active:scale-95 cursor-pointer shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            ⌫
          </button>
        </div>

        {/* Forgot PIN / Unlock Help */}
        <button
          type="button"
          onClick={() => {
            setRecoveryError(null);
            setShowForgotModal(true);
          }}
          className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>পিন মনে নেই?</span>
        </button>
      </div>

      {/* Verified Forgot PIN Recovery Modal (no hardcoded 1234 bypass) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleVerifiedPinReset}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                পিন রিকভারি যাচাইকরণ
              </h4>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cloudAccount ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  নতুন পিন সেট করতে আপনার নিবন্ধিত ক্লাউড অ্যাকাউন্ট (<strong>{cloudAccount.accountId}</strong>) এর পাসকোড যাচাই করুন।
                </p>
                <input
                  type="password"
                  value={cloudPasscode}
                  onChange={(e) => setCloudPasscode(e.target.value)}
                  placeholder="ক্লাউড অ্যাকাউন্ট পাসকোড"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold"
                />
              </>
            ) : isCustomPhone ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  নতুন পিন সেট করতে আপনার দোকানের নিবন্ধিত মোবাইল নম্বরের শেষ ৪টি ডিজিট লিখুন।
                </p>
                <input
                  type="text"
                  maxLength={4}
                  value={verifyPhoneLast4}
                  onChange={(e) => setVerifyPhoneLast4(e.target.value.replace(/[^\d০-৯]/g, ''))}
                  placeholder="মোবাইলের শেষ ৪ ডিজিট"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold tracking-widest"
                />
              </>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
                অননুমোদিত রিসেট প্রতিরোধে ডিফল্ট ডেমো নম্বর দিয়ে রিকভারি বন্ধ রাখা হয়েছে। আপনার পূর্বে সেট করা ৪-ডিজিট পিন দিন।
              </p>
            )}

            {(cloudAccount || isCustomPhone) && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  নতুন ৪-ডিজিট পিন:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newRecoveryPin}
                  onChange={(e) => setNewRecoveryPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-black tracking-widest"
                />
              </div>
            )}

            {recoveryError && (
              <p className="text-xs font-bold text-rose-500">{recoveryError}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              {(cloudAccount || isCustomPhone) && (
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isRecovering ? 'যাচাই হচ্ছে...' : 'যাচাই করে নতুন পিন সেট করুন'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
