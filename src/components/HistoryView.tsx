import React, { useState } from 'react';
import { History, Trash2, Copy, Check, Clock, ArrowRight } from 'lucide-react';
import { Language, CalculationRecord, ToolId } from '../types';
import { UI_TEXT, formatNumber } from '../i18n/translations';
import { getStoredHistory, clearStoredHistory } from '../utils/storage';

import { copyToClipboard } from '../utils/clipboard';

interface Props {
  lang: Language;
  onSelectTool: (toolId: ToolId) => void;
}

export const HistoryView: React.FC<Props> = ({ lang, onSelectTool }) => {
  const [history, setHistory] = useState<CalculationRecord[]>(getStoredHistory());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  const handleClear = () => {
    clearStoredHistory();
    setHistory([]);
    setShowConfirmClear(false);
  };

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.history}
          </h2>
        </div>
        {history.length > 0 && !showConfirmClear && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        )}
        {showConfirmClear && (
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 px-1">
              {lang === 'bn' ? 'মুছবেন?' : 'Confirm?'}
            </span>
            <button
              onClick={handleClear}
              className="px-2 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-500 transition"
            >
              {lang === 'bn' ? 'হ্যাঁ' : 'Yes'}
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] transition"
            >
              {lang === 'bn' ? 'না' : 'Cancel'}
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {t.noHistory}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </span>
                <span>{formatTimestamp(item.timestamp)}</span>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-500 font-mono truncate">
                    {item.expression}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white truncate">
                    = {item.result}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(item.id, `${item.expression} = ${item.result}`)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition active:scale-95"
                    title={t.actions.copy}
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onSelectTool(item.toolId)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition active:scale-95"
                    title="Open Tool"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
