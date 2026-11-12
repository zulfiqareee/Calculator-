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
  Send,
  User,
  Tag,
  AlertCircle,
  HelpCircle,
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
  const [inputText, setInputText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedVoiceTx | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(selectedCustomer || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'sale_due' | 'due_collection' | 'expense' | 'sale_cash'>('sale_due');
  const [editableAmount, setEditableAmount] = useState<string>('');
  const [editableNote, setEditableNote] = useState<string>('');

  const voiceEngineRef = useRef<BengaliVoiceRecognition | null>(null);

  useEffect(() => {
    if (isOpen) {
      voiceEngineRef.current = new BengaliVoiceRecognition();
      setMatchedCustomer(selectedCustomer || null);
      setTranscript('');
      setInputText('');
      setParsed(null);
      setErrorMessage(null);
      setEditableAmount('');
      setEditableNote('');
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen, selectedCustomer]);

  const handleProcessText = (text: string) => {
    if (!text.trim()) return;
    const result = parseBengaliTransactionVoice(text);
    setParsed(result);
    setSelectedType(result.type);
    setEditableAmount(result.amount > 0 ? String(result.amount) : '');
    setEditableNote(result.note);

    // Try to match customer if none pre-selected
    if (!selectedCustomer) {
      if (result.customerNameHint) {
        const hint = result.customerNameHint.toLowerCase().trim();
        const match = customers.find(
          (c) =>
            c.name.toLowerCase().includes(hint) ||
            hint.includes(c.name.toLowerCase()) ||
            c.phone.includes(hint)
        );
        if (match) {
          setMatchedCustomer(match);
        }
      }
    }

    if (result.amount > 0) {
      tallySounds.playSuccessChime();
    }
  };

  const startListening = async () => {
    if (!voiceEngineRef.current) {
      voiceEngineRef.current = new BengaliVoiceRecognition();
    }

    setErrorMessage(null);
    tallySounds.playClickSound();

    try {
      setIsListening(true);
      await voiceEngineRef.current.start(
        (text: string, isFinal: boolean) => {
          setTranscript(text);
          setInputText(text);
          handleProcessText(text);
        },
        (err) => {
          setIsListening(false);
          if (err === 'not-allowed') {
            setErrorMessage('মাইক্রোফোন পারমিশন প্রয়োজন। ব্রাউজার সেটিংসে অনুমতি দিন অথবা নিচের বক্সে সরাসরি লিখে এন্ট্রি করুন।');
          } else if (err === 'not-supported') {
            setErrorMessage('এই ডিভাইসে ভয়েস রিকগনিশন সমর্থন করে না। নিচের বক্সে টাইপ করে এন্ট্রি করুন।');
          } else {
            setErrorMessage('স্পষ্টভাবে কথা শোনা যায়নি। আবার চেষ্টা করুন বা সরাসরি লিখে এন্ট্রি দিন।');
          }
        },
        () => {
          setIsListening(false);
        }
      );
    } catch (err: any) {
      console.warn('Speech start error:', err);
      setIsListening(false);
      setErrorMessage('মাইক্রোফোন চালু করা যায়নি। আপনি সরাসরি লিখে এন্ট্রি করতে পারেন।');
    }
  };

  const stopListening = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalAmount = parseFloat(editableAmount) || (parsed ? parsed.amount : 0);
    if (!finalAmount || finalAmount <= 0) {
      alert('টাকার পরিমাণ নির্ণয় করা যায়নি। অনুগ্রহ করে টাকার অঙ্ক লিখুন বা স্পষ্ট করে বলুন।');
      return;
    }

    const finalCustomerId = selectedCustomer?.id || matchedCustomer?.id;
    const typeLabel =
      selectedType === 'sale_due'
        ? 'বাকি বিক্রি'
        : selectedType === 'due_collection'
        ? 'জমা আদায়'
        : selectedType === 'expense'
        ? 'খরচ'
        : 'নগদ বিক্রি';

    tallySounds.playCashChime();
    speakBengali(`৳ ${toBn(finalAmount)} টাকা ${typeLabel} সফল হয়েছে`);

    onConfirmVoiceTx({
      type: selectedType,
      amount: finalAmount,
      note: editableNote || (parsed?.note || typeLabel),
      customerId: finalCustomerId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
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
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            মুখে বললেই অটো এন্ট্রি (Voice & Smart NLP)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          {selectedCustomer
            ? `${selectedCustomer.name}-এর জন্য মুখে বলুন (যেমন: '৫০০ টাকা বাকি দিলাম' বা '১০০০ টাকা পেলাম')`
            : "মুখে বলুন বা লিখুন: যেমন 'করিম ৫০০ টাকা বাকি' বা 'চা নাস্তা খরচ ১২০ টাকা'"}
        </p>

        {/* Animated Microphone Action Area */}
        <div className="my-5 relative flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-purple-500/20 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full bg-purple-500/30 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer relative z-10 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white shadow-purple-500/40 ring-4 ring-purple-400/30 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-lg'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 animate-bounce" />
            ) : (
              <Mic className="w-9 h-9" />
            )}
          </button>
        </div>

        <div className="mb-3">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              isListening
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 hover:bg-purple-200'
            }`}
          >
            {isListening ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>শুনছি... কথা বলা শেষ হলে ট্যাপ করুন</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>মাইকে চাপ দিয়ে বাংলায় কথা বলুন</span>
              </>
            )}
          </button>
        </div>

        {/* Natural Language Input Box (Voice & Type Hybrid) */}
        <div className="w-full space-y-2">
          <div className="flex gap-1.5 w-full">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setTranscript(e.target.value);
                handleProcessText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleProcessText(inputText);
                }
              }}
              placeholder="মুখে বলুন অথবা এখানে লিখুন (যেমন: সাকিব ৫০০ টাকা বাকি)"
              className="flex-1 h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => handleProcessText(inputText)}
              className="px-3.5 h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>শনাক্ত</span>
            </button>
          </div>

          {/* Quick Voice Prompt Examples */}
          <div className="flex flex-wrap items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold text-slate-400">উদাহরণ:</span>
            {[
              'করিম ৫০০ টাকা বাকি',
              'রহিম ১০০০ টাকা জমা দিছে',
              'নাস্তা খরচ ১৫০ টাকা',
              'নগদ বিক্রি ২০০০ টাকা',
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setInputText(sample);
                  setTranscript(sample);
                  handleProcessText(sample);
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 text-[10px] font-medium transition"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="w-full mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-medium text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Detected Parsed Result Card */}
        {parsed && parsed.amount > 0 && (
          <div className="w-full mt-4 p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-3 text-left animate-fade-in shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                স্বয়ংক্রিয়ভাবে শনাক্তকৃত লেনদেন
              </span>
            </div>

            {/* Transaction Type Selector Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'sale_due', label: 'বাকি বিক্রি' },
                { id: 'due_collection', label: 'জমা আদায়' },
                { id: 'expense', label: 'খরচ' },
                { id: 'sale_cash', label: 'নগদ বিক্রি' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id as any)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold text-center transition ${
                    selectedType === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Customer Picker */}
            {(selectedType === 'sale_due' || selectedType === 'due_collection') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  গ্রাহক নির্বাচন করুন:
                </label>
                <select
                  value={matchedCustomer?.id || ''}
                  onChange={(e) => {
                    const c = customers.find((item) => item.id === e.target.value);
                    setMatchedCustomer(c || null);
                  }}
                  className="w-full h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2.5 text-slate-900 dark:text-white"
                >
                  <option value="">-- গ্রাহক নির্বাচন করুন --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} - বাকি ৳ {formatMoney(c.balance)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Editable Amount & Note */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">টাকার পরিমাণ (৳):</label>
                <input
                  type="number"
                  value={editableAmount}
                  onChange={(e) => setEditableAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">বিবরণ / নোট:</label>
                <input
                  type="text"
                  value={editableNote}
                  onChange={(e) => setEditableNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="mt-1 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>নিশ্চিত করুন ও সেভ করুন (৳ {formatMoney(parseFloat(editableAmount) || parsed.amount)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
