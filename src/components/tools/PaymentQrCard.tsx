import React, { useState } from 'react';
import { QrCode, Copy, Check, Smartphone, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { ShopProfile, toBn, formatMoney } from './TallyKhataView';
import { tallySounds } from '../../utils/tallyAudioVoice';

interface PaymentQrCardProps {
  shop: ShopProfile;
  amount?: number;
  customerName?: string;
  onClose?: () => void;
  showInModal?: boolean;
}

export const PaymentQrCard: React.FC<PaymentQrCardProps> = ({
  shop,
  amount,
  customerName,
  onClose,
  showInModal = false,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const bkashNum = shop.bkashNumber || shop.phone;
  const nagadNum = shop.nagadNumber || shop.phone;
  const rocketNum = shop.rocketNumber;

  // Format QR Data (Bangla Payment payload / UPI or direct pay instructions)
  const qrData = encodeURIComponent(
    `বিকাশ/নগদ পেমেন্ট:\nদোকান: ${shop.name}\nবিকাশ: ${bkashNum} (${shop.bkashType === 'merchant' ? 'মার্চেন্ট' : 'পার্সোনাল'})\nনগদ: ${nagadNum}\n${amount ? `টাকা: ৳ ${amount}\n` : ''}${customerName ? `গ্রাহক: ${customerName}` : ''}`
  );

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}&margin=8`;

  const handleCopy = (num: string, type: string) => {
    tallySounds.playClickSound();
    navigator.clipboard.writeText(num);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const cardContent = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col items-center text-center max-w-sm w-full mx-auto animate-fadeIn">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              ডিজিটাল পেমেন্ট কিউআর
            </h4>
            <span className="text-[10px] text-slate-400">বিকাশ • নগদ • রকেট</span>
          </div>
        </div>

        {showInModal && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Amount if present */}
      {amount !== undefined && amount > 0 && (
        <div className="my-3 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 w-full">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
            পরিশোধযোগ্য টাকার পরিমাণ
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {shop.currency} {formatMoney(amount)}
          </span>
        </div>
      )}

      {/* QR Code Container */}
      <div className="my-2 p-3 bg-white rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center">
        <img
          src={qrImageUrl}
          alt="Payment QR Code"
          className="w-44 h-44 object-contain rounded-xl"
          loading="lazy"
        />
        <span className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-emerald-600" />
          যেকোনো ব্যাংকিং অ্যাপে স্ক্যান করুন
        </span>
      </div>

      {/* Payment Numbers with 1-Click Copy */}
      <div className="w-full flex flex-col gap-2 mt-2">
        {/* bKash */}
        <div className="p-2.5 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center">
              বিকাশ
            </span>
            <div className="text-left">
              <span className="font-bold text-slate-900 dark:text-white block font-mono">
                {bkashNum}
              </span>
              <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">
                {shop.bkashType === 'merchant' ? 'মার্চেন্ট পেমেন্ট' : 'পার্সোনাল (Send Money)'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(bkashNum, 'bkash')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-bold text-[11px] shadow-2xs hover:bg-pink-100 transition cursor-pointer"
          >
            {copiedType === 'bkash' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি</span>
              </>
            )}
          </button>
        </div>

        {/* Nagad */}
        <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center">
              নগদ
            </span>
            <div className="text-left">
              <span className="font-bold text-slate-900 dark:text-white block font-mono">
                {nagadNum}
              </span>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                পার্সোনাল (Send Money)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(nagadNum, 'nagad')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-bold text-[11px] shadow-2xs hover:bg-orange-100 transition cursor-pointer"
          >
            {copiedType === 'nagad' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>কপি</span>
              </>
            )}
          </button>
        </div>

        {/* Rocket if present */}
        {rocketNum && (
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                রকেট
              </span>
              <div className="text-left">
                <span className="font-bold text-slate-900 dark:text-white block font-mono">
                  {rocketNum}
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  পার্সোনাল
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(rocketNum, 'rocket')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-bold text-[11px] shadow-2xs hover:bg-purple-100 transition cursor-pointer"
            >
              {copiedType === 'rocket' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>কপি</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        {shop.paymentInstructions || 'টাকা পাঠানোর পর ট্রানজেকশন আইডি বা লাস্ট ৪ ডিজিট মেসেজ করুন।'}
      </p>
    </div>
  );

  if (showInModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
        {cardContent}
      </div>
    );
  }

  return cardContent;
};
