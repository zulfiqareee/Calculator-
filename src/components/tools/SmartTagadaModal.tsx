import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Phone,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Gift,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Customer, ShopProfile, toBn, formatMoney } from './TallyKhataView';
import {
  getTagadaTemplates,
  formatWhatsAppUrl,
  formatSmsUrl,
  calculateCustomerCreditScore,
} from '../../utils/tallyCreditScorer';
import { tallySounds } from '../../utils/tallyAudioVoice';

interface SmartTagadaModalProps {
  customer: Customer;
  shop: ShopProfile;
  onClose: () => void;
}

export const SmartTagadaModal: React.FC<SmartTagadaModalProps> = ({
  customer,
  shop,
  onClose,
}) => {
  const templates = getTagadaTemplates(customer, shop);
  const [selectedType, setSelectedType] = useState<'polite' | 'urgent' | 'offer' | 'festive'>('polite');
  const [customMessage, setCustomMessage] = useState<string>(templates.polite);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (type: 'polite' | 'urgent' | 'offer' | 'festive') => {
    tallySounds.playClickSound();
    setSelectedType(type);
    setCustomMessage(templates[type]);
  };

  const handleCopy = () => {
    tallySounds.playClickSound();
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsAppUrl = formatWhatsAppUrl(customer.phone, customMessage);
  const smsUrl = formatSmsUrl(customer.phone, customMessage);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <span>স্মার্ট তাগাদা বার্তা প্রেরক</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                হোয়াটসঅ্যাপ বা এসএমএসে ১-ক্লিকে বকেয়া আদায়ের তাগাদা পাঠান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Mini Summary Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
              {customer.name}
            </span>
            <span className="text-slate-500 text-[11px]">মোবাইল: {customer.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">মোট বকেয়া পাওনা</span>
            <span className="font-black text-base text-red-600 dark:text-red-400">
              {shop.currency} {formatMoney(customer.balance)}
            </span>
          </div>
        </div>

        {/* Template Selectors */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
            তাগাদার সুর ও ধরন নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectTemplate('polite')}
              className={`p-2.5 rounded-xl border font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedType === 'polite'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Heart className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="text-left">
                <span className="block text-[11px]">নম্র তাগাদা</span>
                <span className="text-[9px] text-slate-400 font-normal">সাধারণ বিনয়ী স্মরণিকা</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('urgent')}
              className={`p-2.5 rounded-xl border font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedType === 'urgent'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="text-left">
                <span className="block text-[11px]">জরুরি তাগাদা</span>
                <span className="text-[9px] text-slate-400 font-normal">২৪-৪৮ ঘণ্টার নোটিশ</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('offer')}
              className={`p-2.5 rounded-xl border font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedType === 'offer'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Gift className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-left">
                <span className="block text-[11px]">ছাড় অফার</span>
                <span className="text-[9px] text-slate-400 font-normal">দ্রুত আদায়ে উপহার</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTemplate('festive')}
              className={`p-2.5 rounded-xl border font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedType === 'festive'
                  ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="text-left">
                <span className="block text-[11px]">উৎসব শুভেচ্ছা</span>
                <span className="text-[9px] text-slate-400 font-normal">ঈদ/নববর্ষের বার্তা</span>
              </div>
            </button>
          </div>
        </div>

        {/* Message Editor Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              বার্তা প্রিভিউ (প্রয়োজনে এডিট করতে পারেন):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে!' : 'মেসেজ কপি'}</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed font-sans text-slate-800 dark:text-slate-200 resize-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Direct Send Buttons (WhatsApp, SMS, Copy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => tallySounds.playClickSound()}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>সরাসরি WhatsApp-এ পাঠান</span>
          </a>

          <a
            href={smsUrl}
            onClick={() => tallySounds.playClickSound()}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>সরাসরি SMS অ্যাপে খুলুন</span>
          </a>
        </div>
      </div>
    </div>
  );
};
