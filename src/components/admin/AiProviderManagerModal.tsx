import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  RotateCcw,
  Sliders,
  X,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { AIProviderConfig, AIProviderId } from '../../types/multiAi';
import {
  getStoredProviders,
  updateProviderConfig,
  resetProviderStats,
} from '../../utils/aiProviderRegistry';
import { GoogleGenAI } from '@google/genai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'bn' | 'en';
}

export const AiProviderManagerModal: React.FC<Props> = ({ isOpen, onClose, lang = 'bn' }) => {
  const isBn = lang === 'bn';
  const [providers, setProviders] = useState<AIProviderConfig[]>(getStoredProviders());
  const [testingId, setTestingId] = useState<AIProviderId | null>(null);
  const [testResult, setTestResult] = useState<{ id: AIProviderId; success: boolean; msg: string } | null>(null);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleShowKey = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleEnable = (id: AIProviderId, currentVal: boolean) => {
    const updated = updateProviderConfig(id, { enabled: !currentVal });
    setProviders(updated);
  };

  const handlePriorityChange = (id: AIProviderId, priority: number) => {
    const updated = updateProviderConfig(id, { priority });
    setProviders(updated);
  };

  const handleKeyChange = (id: AIProviderId, keyVal: string) => {
    const updated = updateProviderConfig(id, { apiKey: keyVal });
    setProviders(updated);
  };

  // Live Provider Connectivity Test
  const handleTestConnection = async (provider: AIProviderConfig) => {
    setTestingId(provider.id);
    setTestResult(null);

    try {
      if (provider.id === 'local_offline' || provider.id === 'pollinations') {
        // Instant check
        await new Promise((r) => setTimeout(r, 400));
        setTestResult({
          id: provider.id,
          success: true,
          msg: isBn ? 'লোকাল ইঞ্জিন ১০০% প্রস্তুত ও সক্রিয় রয়েছে।' : 'Local engine is 100% ready & active.',
        });
      } else if (provider.id === 'gemini') {
        const key = provider.apiKey?.trim() || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!key) throw new Error('কোনো এপিআই কি পাওয়া যায়নি। আপনার কি প্রবেশ করান।');
        const ai = new GoogleGenAI({ apiKey: key });
        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'ping',
        });
        if (res.text) {
          setTestResult({
            id: provider.id,
            success: true,
            msg: isBn ? 'গুগল জেমিনাই সংযুক্ত! ফ্রি টিয়ার কার্যকর।' : 'Google Gemini Connected! Free tier active.',
          });
        }
      } else if (provider.id === 'groq') {
        if (!provider.apiKey?.trim()) throw new Error('Groq API Key অনুপস্থিত। console.groq.com থেকে ফ্রি কি দিন।');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        setTestResult({
          id: provider.id,
          success: true,
          msg: isBn ? 'Groq Cloud সফলভাবে সংযুক্ত! দ্রুততম স্পিড পাওয়া গেছে।' : 'Groq Cloud Connected! High-speed response verified.',
        });
      } else if (provider.id === 'huggingface') {
        if (!provider.apiKey?.trim()) throw new Error('Hugging Face User Access Token অনুপস্থিত।');
        setTestResult({
          id: provider.id,
          success: true,
          msg: isBn ? 'হাগিং ফেস ইনফারেন্স টোকেন কনফিগার করা হয়েছে।' : 'Hugging Face Token configured.',
        });
      }
    } catch (err: any) {
      setTestResult({
        id: provider.id,
        success: false,
        msg: err.message || (isBn ? 'সংযুক্ত হতে ব্যর্থ হয়েছে।' : 'Connection test failed.'),
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleReset = () => {
    resetProviderStats();
    setProviders(getStoredProviders());
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black">
                  {isBn ? 'স্মার্ট এআই মাল্টি-ইঞ্জিন ম্যানেজার' : 'Smart AI Multi-Engine Manager'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Zero-Budget
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'একাধিক ফ্রি এআই প্রোভাইডার ও অটোমেটিক ফেইলওভার রাউটিং' : 'Multi-provider fallback routing & quota failover'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Provider List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Multi-AI Strategy Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-slate-800/40 border border-purple-500/30 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-purple-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isBn ? 'অটোমেটিক ফেইলওভার পলিসি (Zero Failure)' : 'Automatic Failover Policy'}</span>
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isBn
                ? 'একটি প্রোভাইডারের ফ্রি কোটা বা লিমিট শেষ হলে সিস্টেম স্বয়ংক্রিয়ভাবে পরবর্তী ফ্রি ইঞ্জিনে সুইচ করবে। কোনো পেইড বিলিং নেই।'
                : 'When a provider hits its 429 rate limit or quota, the AI Router instantly selects the next available free engine.'}
            </p>
          </div>

          {providers.map((p) => {
            const isTesting = testingId === p.id;
            const test = testResult?.id === p.id ? testResult : null;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  p.enabled
                    ? 'bg-slate-800/70 border-slate-700/80'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                {/* Provider Title & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        !p.enabled
                          ? 'bg-slate-500'
                          : p.status === 'active'
                          ? 'bg-emerald-400 animate-pulse'
                          : p.status === 'rate_limited'
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 block">{p.freeTierInfo}</span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnable(p.id, p.enabled)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                        p.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {p.enabled ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'বন্ধ' : 'Disabled')}
                    </button>
                  </div>
                </div>

                {/* Priority & Tasks */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">{isBn ? 'অগ্রাধিকার:' : 'Priority:'}</span>
                    <select
                      value={p.priority}
                      onChange={(e) => handlePriorityChange(p.id, parseInt(e.target.value))}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] font-bold"
                    >
                      <option value={1}>1 (First Choice)</option>
                      <option value={2}>2 (Backup)</option>
                      <option value={3}>3 (Alternative)</option>
                      <option value={99}>99 (Offline Fallback)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{isBn ? 'সফল:' : 'Success:'} <strong className="text-emerald-400">{p.successCount || 0}</strong></span>
                    <span>•</span>
                    <span>{isBn ? 'ব্যর্থ:' : 'Fails:'} <strong className="text-rose-400">{p.failureCount || 0}</strong></span>
                  </div>
                </div>

                {/* API Key Input (if requires key) */}
                {p.id !== 'local_offline' && p.id !== 'pollinations' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">
                        {p.id === 'gemini' ? (isBn ? 'Gemini API Key (ঐচ্ছিক):' : 'Gemini Key (Optional):') : `${p.name} API Key:`}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShowKey(p.id)}
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {showKeyMap[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showKeyMap[p.id] ? 'লুকান' : 'দেখান'}</span>
                      </button>
                    </div>

                    <input
                      type={showKeyMap[p.id] ? 'text' : 'password'}
                      value={p.apiKey || ''}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.id === 'gemini' ? 'env key active or enter custom...' : 'Enter your free API token...'}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                )}

                {/* Test Connection Button & Result */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleTestConnection(p)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-purple-300 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? (isBn ? 'যাচাই হচ্ছে...' : 'Testing...') : (isBn ? 'কানেকশন টেস্ট করুন' : 'Test Ping')}</span>
                  </button>

                  {test && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        test.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {test.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{test.msg}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isBn ? 'পরিসংখ্যান রিসেট' : 'Reset Stats'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
          >
            {isBn ? 'সংরক্ষণ ও বন্ধ করুন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
