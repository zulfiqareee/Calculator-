import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, Phone, X, ShieldCheck } from 'lucide-react';
import { tallySounds } from '../../utils/tallyAudioVoice';

export const PIN_ENABLED_KEY = 'smarthub_tally_pin_enabled';
export const PIN_STORAGE_KEY = 'smarthub_tally_pin_code';

interface PinSecurityLockProps {
  isLocked: boolean;
  onUnlock: () => void;
  shopName?: string;
  shopPhone?: string;
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

  if (!isLocked) return null;

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    tallySounds.playClickSound();
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      const savedPin = localStorage.getItem(PIN_STORAGE_KEY) || '1234';
      if (nextPin === savedPin) {
        tallySounds.playSuccessChime();
        setEnteredPin('');
        onUnlock();
      } else {
        setTimeout(() => {
          setErrorMsg('ভুল পিন কোড! আবার চেষ্টা করুন।');
          setEnteredPin('');
        }, 300);
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
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </span>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-black transition active:scale-95 cursor-pointer shadow-2xs"
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
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-black transition active:scale-95 cursor-pointer shadow-2xs"
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
          onClick={() => setShowForgotModal(true)}
          className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>পিন মনে নেই?</span>
        </button>
      </div>

      {/* Forgot PIN Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                পিন রিকভারি সহায়তা
              </h4>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ডিফল্ট পিন কোড হলো <span className="font-mono font-black text-emerald-600">1234</span>।
              যদি আপনি নতুন পিন সেট করে ভুলে গিয়ে থাকেন, তবে আপনার দোকানের মোবাইল নম্বরের শেষ ৪ ডিজিট দিয়ে যাচাই করতে পারেন অথবা সরাসরি রিসেট করতে পারেন।
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-500 block">দোকানের মোবাইল:</span>
              <span className="font-bold text-slate-900 dark:text-white">{shopPhone}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(PIN_STORAGE_KEY, '1234');
                  alert('পিন সফলভাবে রিসেট করে 1234 করা হয়েছে।');
                  setShowForgotModal(false);
                  onUnlock();
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                1234 এ রিসেট করুন
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
