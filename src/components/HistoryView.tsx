import React, { useState } from 'react';
import { History, Trash2, Copy, Check, Clock, ArrowRight } from 'lucide-react';
import { Language, CalculationRecord, ToolId } from '../types';
import { UI_TEXT, formatNumber } from '../i18n/translations';
import { getStoredHistory, clearStoredHistory } from '../utils/storage';

interface Props {
  lang: Language;
  onSelectTool: (toolId: ToolId) => void;
}

export const HistoryView: React.FC<Props> = ({ lang, onSelectTool }) => {
  const [history, setHistory] = useState<CalculationRecord[]>(getStoredHistory());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = UI_TEXT[lang];

  const handleClear = () => {
    if (confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে সকল হিসাবের ইতিহাস মুছে ফেলতে চান?' : 'Clear all calculation history?')) {
      clearStoredHistory();
      setHistory([]);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
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
