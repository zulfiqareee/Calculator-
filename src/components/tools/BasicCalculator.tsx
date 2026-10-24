import React, { useState } from 'react';
import { Delete, RotateCcw, Copy, Check, History } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

export const BasicCalculator: React.FC<Props> = ({ lang }) => {
  const [expression, setExpression] = useState<string>('0');
  const [lastResult, setLastResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[lang];

  // Helper to safely evaluate mathematical expressions
  const calculateResult = (expr: string): { success: boolean; value: string; error?: string } => {
    try {
      // Replace display operators with JS operators
      let clean = expr.replace(/×/g, '*').replace(/÷/g, '/');

      // Check for division by zero: / 0 or / 0.0 with no following nonzero digit
      if (/\/0(?!\.)|\/0\.0+(?![1-9])/.test(clean)) {
        return {
          success: false,
          value: '',
          error: lang === 'bn' ? 'শূন্য দিয়ে ভাগ করা সম্ভব নয়' : 'Cannot divide by zero',
        };
      }

      // Check if expression is incomplete or ends with operator
      if (/[\+\-\*\/]$/.test(clean.trim())) {
        return { success: false, value: '' };
      }

      // Safe evaluation without arbitrary code execution
      // Only allow digits, operators, parentheses, and decimals
      if (!/^[0-9+\-*/(). %]+$/.test(clean)) {
        return { success: false, value: '', error: 'Invalid expression' };
      }

      // Handle simple percent e.g. 50 + 10% or just 50%
      clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

      // eslint-disable-next-line no-eval
      const evaluated = Function(`'use strict'; return (${clean})`)();

      if (Number.isNaN(evaluated) || !Number.isFinite(evaluated)) {
        return {
          success: false,
          value: '',
          error: lang === 'bn' ? 'অকার্যকর ফলাফল' : 'Math error',
        };
      }

      // Format to maximum 8 decimals to prevent floating point noise like 0.30000000000000004
      const formatted = Math.round(evaluated * 1e8) / 1e8;
      return { success: true, value: String(formatted) };
    } catch {
      return { success: false, value: '' };
    }
  };

  const handleInput = (char: string) => {
    setError(null);
    if (expression === '0' && !['+', '×', '÷', '%', '.'].includes(char)) {
      setExpression(char);
      return;
    }

    // Prevent duplicate consecutive operators
    const lastChar = expression.slice(-1);
    if (['+', '-', '×', '÷', '.'].includes(lastChar) && ['+', '×', '÷', '.'].includes(char)) {
      setExpression(expression.slice(0, -1) + char);
      return;
    }

    setExpression((prev) => prev + char);
  };

  const handleClear = () => {
    setExpression('0');
    setLastResult('');
    setError(null);
  };

  const handleDelete = () => {
    setError(null);
    if (expression.length <= 1) {
      setExpression('0');
    } else {
      setExpression((prev) => prev.slice(0, -1));
    }
  };

  const handleNegate = () => {
    try {
      if (expression === '0') return;
      if (expression.startsWith('-')) {
        setExpression(expression.slice(1));
      } else {
        setExpression('-' + expression);
      }
    } catch {
      // ignore
    }
  };

  const handleEquals = () => {
    const res = calculateResult(expression);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.success && res.value !== '') {
      setLastResult(expression + ' = ' + res.value);
      // Save to offline calculation history
      addStoredHistory({
        toolId: 'calculator',
        titleEn: 'Basic Calculation',
        titleBn: 'সাধারণ হিসাব',
        expression: expression,
        result: res.value,
      });
      setExpression(res.value);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(expression);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Preview live evaluation if expression contains operators
  const livePreview = ['+', '-', '×', '÷', '%'].some((op) => expression.includes(op))
    ? calculateResult(expression)
    : null;

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
      {/* Calculator Display Screen */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between min-h-[160px] border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{lastResult ? formatNumber(lastResult, lang) : (lang === 'bn' ? 'নতুন হিসাব' : 'Ready')}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors px-2 py-1 rounded-md bg-slate-800/60 active:scale-95"
            title={t.actions.copy}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium">{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
          </button>
        </div>

        {/* Big Formula & Output Display */}
        <div className="flex flex-col items-end justify-end mt-2 overflow-hidden">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono break-all text-right select-text w-full">
            {formatNumber(expression, lang)}
          </div>

          {/* Error notice or live preview */}
          {error ? (
            <div className="text-rose-400 text-xs font-medium mt-1 animate-pulse">
              {error}
            </div>
          ) : livePreview && livePreview.success && livePreview.value !== expression ? (
            <div className="text-emerald-400/90 text-sm font-mono mt-1">
              ≈ {formatNumber(livePreview.value, lang)}
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </div>

      {/* Calculator Button Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold text-lg hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center shadow-xs"
        >
          <RotateCcw className="w-5 h-5 mr-1" />
          <span>C</span>
        </button>
        <button
          onClick={handleDelete}
          className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center shadow-xs"
          title="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleInput('%')}
          className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center shadow-xs"
        >
          %
        </button>
        <button
          onClick={() => handleInput('÷')}
          className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl active:scale-95 transition flex items-center justify-center shadow-md shadow-emerald-600/20"
        >
          ÷
        </button>

        {/* Row 2 */}
        {['7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleInput(digit)}
            className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
          >
            {formatNumber(digit, lang)}
          </button>
        ))}
        <button
          onClick={() => handleInput('×')}
          className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl active:scale-95 transition flex items-center justify-center shadow-md shadow-emerald-600/20"
        >
          ×
        </button>

        {/* Row 3 */}
        {['4', '5', '6'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleInput(digit)}
            className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
          >
            {formatNumber(digit, lang)}
          </button>
        ))}
        <button
          onClick={() => handleInput('-')}
          className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl active:scale-95 transition flex items-center justify-center shadow-md shadow-emerald-600/20"
        >
          -
        </button>

        {/* Row 4 */}
        {['1', '2', '3'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleInput(digit)}
            className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
          >
            {formatNumber(digit, lang)}
          </button>
        ))}
        <button
          onClick={() => handleInput('+')}
          className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl active:scale-95 transition flex items-center justify-center shadow-md shadow-emerald-600/20"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          onClick={handleNegate}
          className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
        >
          ±
        </button>
        <button
          onClick={() => handleInput('0')}
          className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
        >
          {formatNumber('0', lang)}
        </button>
        <button
          onClick={() => handleInput('.')}
          className="h-14 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-bold text-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-2xl active:scale-95 transition flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          =
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1">
        {lang === 'bn'
          ? 'পূর্ণ অফলাইন গাণিতিক হিসেব সংরক্ষিত থাকে'
          : '100% offline calculation with automatic history saving'}
      </div>
    </div>
  );
};
