import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Customer, toBn, formatMoney } from './TallyKhataView';
import {
  BengaliVoiceRecognition,
  parseBengaliTransactionVoice,
  ParsedVoiceTx,
  speakBengali,
  tallySounds,
} from '../../utils/tallyAudioVoice';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onConfirmVoiceTx: (data: {
    type: 'sale_due' | 'due_collection' | 'expense' | 'sale_cash';
    amount: number;
    note: string;
    customerId?: string;
  }) => void;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onConfirmVoiceTx,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedVoiceTx | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(selectedCustomer || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const voiceEngineRef = useRef<BengaliVoiceRecognition | null>(null);

  useEffect(() => {
    if (isOpen) {
      voiceEngineRef.current = new BengaliVoiceRecognition();
      startListening();
    } else {
      stopListening();
      setTranscript('');
      setParsed(null);
      setErrorMessage(null);
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    if (!voiceEngineRef.current) {
      voiceEngineRef.current = new BengaliVoiceRecognition();
    }
    if (!voiceEngineRef.current.isSupported) {
      setErrorMessage('আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন করে না। গুগল ক্রোম ব্যবহার করুন।');
      return;
    }

    setErrorMessage(null);
    setIsListening(true);
    setTranscript('');
    setParsed(null);
    tallySounds.playClickSound();

    voiceEngineRef.current.start(
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        const result = parseBengaliTransactionVoice(text);
        setParsed(result);

        // Try to match customer if none pre-selected
        if (!selectedCustomer && result.customerNameHint) {
          const hint = result.customerNameHint.toLowerCase();
          const match = customers.find(
            (c) =>
              c.name.toLowerCase().includes(hint) ||
              hint.includes(c.name.toLowerCase()) ||
              c.phone.includes(hint)
          );
          if (match) setMatchedCustomer(match);
        }

        if (isFinal && result.amount > 0) {
          tallySounds.playSuccessChime();
        }
      },
      (err) => {
        setIsListening(false);
        setErrorMessage('মাইক্রোফোনে কথা শুনতে পাওয়া যায়নি। আবার চেষ্টা করুন।');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const stopListening = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!parsed || parsed.amount <= 0) {
      alert('টাকার পরিমাণ নির্ণয় করা যায়নি। অনুগ্রহ করে স্পষ্ট করে টাকার সংখ্যা বলুন।');
      return;
    }

    const finalCustomerId = selectedCustomer?.id || matchedCustomer?.id;
    const typeLabel =
      parsed.type === 'sale_due'
        ? 'বাকি'
        : parsed.type === 'due_collection'
        ? 'জমা আদায়'
        : parsed.type === 'expense'
        ? 'খরচ'
        : 'নগদ বিক্রি';

    tallySounds.playCashChime();
    speakBengali(`৳ ${toBn(parsed.amount)} টাকা ${typeLabel} এন্ট্রি সম্পন্ন হয়েছে`);

    onConfirmVoiceTx({
      type: parsed.type,
      amount: parsed.amount,
      note: parsed.note,
      customerId: finalCustomerId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            বাংলা ভয়েস লেনদেন এন্ট্রি
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {selectedCustomer
            ? `${selectedCustomer.name}-এর জন্য মুখে বলুন (যেমন: '৫০০ টাকা দিলাম' বা '১০০০ টাকা পেলাম')`
            : "মুখে বলুন: যেমন 'করিম ৫০০ টাকা বাকি' বা 'চা নাস্তা খরচ ১২০ টাকা'"}
        </p>

        {/* Animated Microphone Area */}
        <div className="my-6 relative flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-purple-500/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-purple-500/30 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer relative z-10 ${
              isListening
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 animate-bounce" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </button>
        </div>

        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
          {isListening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              শুনছি... মুখে বাংলায় বলুন
            </>
          ) : (
            'মাইক্রোফোনে চাপ দিয়ে কথা বলুন'
          )}
        </span>

        {/* Live Spoken Transcript Box */}
        <div className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 min-h-[58px] flex items-center justify-center text-xs text-slate-800 dark:text-slate-200 font-medium text-center">
          {transcript ? (
            <span className="font-semibold text-slate-900 dark:text-white">
              "{transcript}"
            </span>
          ) : (
            <span className="text-slate-400 italic">
              উদাহরণ: "৫০০ টাকা বাকি দিলাম" অথবা "১০০০ টাকা পেলাম"
            </span>
          )}
        </div>

        {errorMessage && (
          <span className="text-xs text-rose-500 mt-2 font-semibold">
            {errorMessage}
          </span>
        )}

        {/* Parsed Result Card */}
        {parsed && parsed.amount > 0 && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2.5 text-left animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                স্বয়ংক্রিয়ভাবে শনাক্তকৃত
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                  parsed.type === 'sale_due'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : parsed.type === 'due_collection'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {parsed.type === 'sale_due'
                  ? 'বাকি (দিলাম)'
                  : parsed.type === 'due_collection'
                  ? 'আদায় (পেলাম)'
                  : parsed.type === 'expense'
                  ? 'খরচ'
                  : 'নগদ বিক্রি'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                টাকার পরিমাণ:
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                ৳ {formatMoney(parsed.amount)}
              </span>
            </div>

            {(selectedCustomer || matchedCustomer) && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>গ্রাহক:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(selectedCustomer || matchedCustomer)?.name}
                </span>
              </div>
            )}

            {parsed.note && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>বিবরণ:</span>
                <span className="font-medium truncate max-w-[200px]">
                  {parsed.note}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>নিশ্চিত করুন ও সেভ করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Voice Hints */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full text-[11px] text-slate-400 text-left flex flex-col gap-1">
          <span className="font-semibold text-slate-500">সহজ কিছু উদাহরণ:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                const sample = '৫০০ টাকা বাকি দিলাম চালের জন্য';
                setTranscript(sample);
                setParsed(parseBengaliTransactionVoice(sample));
              }}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300"
            >
              "৫০০ টাকা বাকি দিলাম"
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = '১০০০ টাকা পেলাম';
                setTranscript(sample);
                setParsed(parseBengaliTransactionVoice(sample));
              }}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300"
            >
              "১০০০ টাকা পেলাম"
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'চা নাস্তা খরচ ১৫০ টাকা';
                setTranscript(sample);
                setParsed(parseBengaliTransactionVoice(sample));
              }}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-600 dark:text-slate-300"
            >
              "চা নাস্তা খরচ ১৫০ টাকা"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
