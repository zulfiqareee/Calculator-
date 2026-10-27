import React, { useState, useEffect } from 'react';
import {
  Delete,
  RotateCcw,
  Copy,
  Check,
  History,
  Calculator,
  Binary,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language, CalculationRecord } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory, getStoredHistory, clearStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

// Factorial helper
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= Math.min(n, 170); i++) res *= i;
  return res;
}

export const BasicCalculator: React.FC<Props> = ({ lang }) => {
  const [mode, setMode] = useState<'basic' | 'scientific'>('basic');
  const [expression, setExpression] = useState<string>('0');
  const [lastResult, setLastResult] = useState<string>('');
  const [angleUnit, setAngleUnit] = useState<'deg' | 'rad'>('deg');
  const [is2nd, setIs2nd] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<CalculationRecord[]>(getStoredHistory());
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[lang];

  // Refresh history
  const refreshHistory = () => {
    setHistoryList(getStoredHistory());
  };

  // Safe Mathematical Evaluation Engine (Supporting Basic + Scientific)
  const calculateResult = (
    expr: string,
    angle: 'deg' | 'rad'
  ): { success: boolean; value: string; error?: string } => {
    try {
      if (!expr || expr === '0') return { success: false, value: '' };

      // Replace visual operators with JavaScript counterparts
      let clean = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, '(Math.PI)')
        .replace(/\be\b/g, '(Math.E)');

      // Check for division by zero: / 0 or / 0.0 with no following nonzero digit
      if (/\/0(?!\.)|\/0\.0+(?![1-9])/.test(clean)) {
        return {
          success: false,
          value: '',
          error: lang === 'bn' ? 'শূন্য দিয়ে ভাগ করা যায় না' : 'Cannot divide by zero',
        };
      }

      // Check if expression is incomplete
      if (/[\+\-\*\/(\^]$/.test(clean.trim())) {
        return { success: false, value: '' };
      }

      // Factorial: e.g. 5! or 10!
      clean = clean.replace(/(\d+)!/g, 'factorial($1)');

      // Power: x^y -> x**y
      clean = clean.replace(/\^/g, '**');

      // Trigonometric Functions
      if (angle === 'deg') {
        clean = clean.replace(/sin\(/g, 'Math.sin((Math.PI/180)*');
        clean = clean.replace(/cos\(/g, 'Math.cos((Math.PI/180)*');
        clean = clean.replace(/tan\(/g, 'Math.tan((Math.PI/180)*');
        clean = clean.replace(/asin\(/g, '((180/Math.PI)*Math.asin(');
        clean = clean.replace(/acos\(/g, '((180/Math.PI)*Math.acos(');
        clean = clean.replace(/atan\(/g, '((180/Math.PI)*Math.atan(');
      } else {
        clean = clean.replace(/sin\(/g, 'Math.sin(');
        clean = clean.replace(/cos\(/g, 'Math.cos(');
        clean = clean.replace(/tan\(/g, 'Math.tan(');
        clean = clean.replace(/asin\(/g, 'Math.asin(');
        clean = clean.replace(/acos\(/g, 'Math.acos(');
        clean = clean.replace(/atan\(/g, 'Math.atan(');
      }

      // Logarithmic & Roots
      clean = clean.replace(/log\(/g, 'Math.log10(');
      clean = clean.replace(/ln\(/g, 'Math.log(');
      clean = clean.replace(/√\(/g, 'Math.sqrt(');
      clean = clean.replace(/∛\(/g, 'Math.cbrt(');
      clean = clean.replace(/abs\(/g, 'Math.abs(');

      // Percentage: e.g. 50% -> (50/100)
      clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

      // Evaluate safely
      const evalFn = new Function('factorial', `"use strict"; return (${clean});`);
      const evaluated = evalFn(factorial);

      if (Number.isNaN(evaluated) || !Number.isFinite(evaluated)) {
        return {
          success: false,
          value: '',
          error: lang === 'bn' ? 'অকার্যকর গাণিতিক মান' : 'Math error',
        };
      }

      // Floating point cleanup to avoid 0.30000000000000004
      const formatted = Math.round(evaluated * 1e10) / 1e10;
      return { success: true, value: String(formatted) };
    } catch {
      return { success: false, value: '' };
    }
  };

  // Live preview evaluation
  const livePreview = calculateResult(expression, angleUnit);

  // Input Handler
  const handleInput = (char: string) => {
    setError(null);

    // Initial 0 replacement
    if (expression === '0' && !['+', '×', '÷', '%', '.', '^'].includes(char)) {
      setExpression(char);
      return;
    }

    // Prevent duplicate operators
    const lastChar = expression.slice(-1);
    if (['+', '-', '×', '÷', '.', '^'].includes(lastChar) && ['+', '×', '÷', '.', '^'].includes(char)) {
      setExpression(expression.slice(0, -1) + char);
      return;
    }

    setExpression((prev) => prev + char);
  };

  // Function Insertion Handler (e.g. sin(, cos(, √()
  const handleFunctionInput = (fnName: string) => {
    setError(null);
    if (expression === '0') {
      setExpression(`${fnName}(`);
    } else {
      setExpression((prev) => `${prev}${fnName}(`);
    }
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
    if (expression === '0') return;
    if (expression.startsWith('-(') && expression.endsWith(')')) {
      setExpression(expression.slice(2, -1));
    } else {
      setExpression(`-(${expression})`);
    }
  };

  // Equals / Calculate Execution
  const handleEquals = () => {
    const res = calculateResult(expression, angleUnit);
    if (res.success && res.value !== '') {
      setLastResult(res.value);
      setError(null);

      // Save to History Tape
      addStoredHistory({
        toolId: 'calculator',
        titleEn: 'Calculator',
        titleBn: 'ক্যালকুলেটর',
        expression: expression,
        result: res.value,
      });
      refreshHistory();

      setExpression(res.value);
    } else if (res.error) {
      setError(res.error);
    }
  };

  // Memory Operations
  const handleMemory = (action: 'MC' | 'MR' | 'M+' | 'M-') => {
    const currentVal = parseFloat(lastResult || expression) || 0;
    switch (action) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        if (memory !== 0) {
          handleInput(String(memory));
        }
        break;
      case 'M+':
        setMemory((prev) => prev + currentVal);
        break;
      case 'M-':
        setMemory((prev) => prev - currentVal);
        break;
    }
  };

  // Copy Result
  const handleCopy = async () => {
    const toCopy = lastResult || expression;
    const ok = await copyToClipboard(toCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Recall from History
  const handleRecallHistory = (item: CalculationRecord) => {
    setExpression(item.expression);
    setLastResult(item.result);
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col gap-3 max-w-md mx-auto w-full select-none">
      {/* Top Header Toolbar: Mode Selector & History Button */}
      <div className="flex items-center justify-between gap-2">
        {/* Basic vs Scientific Mode Pill */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl flex items-center shadow-2xs">
          <button
            onClick={() => setMode('basic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'basic'
                ? 'bg-[#0B63F6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সাধারণ' : 'Basic'}</span>
          </button>

          <button
            onClick={() => setMode('scientific')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'scientific'
                ? 'bg-[#0B63F6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সাইন্টিফিক' : 'Scientific'}</span>
          </button>
        </div>

        {/* Right Tools: Angle Toggle (in Sci Mode) & History Tape Toggle */}
        <div className="flex items-center gap-1.5">
          {mode === 'scientific' && (
            <button
              onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black tracking-wider text-[#0B63F6] dark:text-blue-400 shadow-2xs active:scale-95 transition uppercase"
              title="ডিগ্রি / রেডিয়ান পরিবর্তন"
            >
              {angleUnit}
            </button>
          )}

          <button
            onClick={() => {
              refreshHistory();
              setShowHistory(!showHistory);
            }}
            className={`p-2 rounded-xl border transition shadow-2xs ${
              showHistory
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="গণনার ইতিহাস"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Slide-down Drawer */}
      {showHistory && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col gap-2.5 animate-fade-in max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
            <span>{lang === 'bn' ? 'সাম্প্রতিক হিসেবসমূহ' : 'Calculation History'}</span>
            {historyList.length > 0 && (
              <button
                onClick={() => {
                  clearStoredHistory();
                  refreshHistory();
                }}
                className="text-rose-500 hover:underline text-[11px]"
              >
                {lang === 'bn' ? 'ক্লিয়ার করুন' : 'Clear All'}
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              {lang === 'bn' ? 'কোনো পূর্ববর্তী হিসেব নেই।' : 'No calculation history.'}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRecallHistory(item)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-750 cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                    {item.expression}
                  </span>
                  <span className="font-mono font-bold text-[#0B63F6] dark:text-blue-400">
                    = {item.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calculator Display Screen */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[120px] transition-all">
        {/* Top Indicators: Memory badge & Copy Button */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            {memory !== 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                M ({memory})
              </span>
            )}
            {mode === 'scientific' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {angleUnit}
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#0B63F6] transition px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="ফলাফল কপি করুন"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-bold">{t.actions.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{t.actions.copy}</span>
              </>
            )}
          </button>
        </div>

        {/* Expression Input Line */}
        <div className="overflow-x-auto text-right font-mono text-slate-500 dark:text-slate-400 text-sm sm:text-base tracking-wide no-scrollbar whitespace-nowrap mt-2">
          {expression}
        </div>

        {/* Big Calculated Result / Live Preview Display */}
        <div className="text-right mt-1">
          {error ? (
            <span className="text-sm font-bold text-rose-500 animate-pulse">{error}</span>
          ) : (
            <div className="flex items-baseline justify-end gap-1.5">
              {livePreview.success && livePreview.value !== '' && livePreview.value !== expression && (
                <span className="text-xs font-mono text-slate-400 mr-1">
                  ≈ {livePreview.value}
                </span>
              )}
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white truncate">
                {lastResult || (livePreview.success ? livePreview.value : expression)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SCIENTIFIC KEYPAD PANEL (Appears when Scientific Mode is active)
         ========================================================================= */}
      {mode === 'scientific' && (
        <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-2.5 shadow-xs flex flex-col gap-1.5 animate-fade-in">
          {/* Row 1: 2nd, DEG/RAD, Trig Functions */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => setIs2nd(!is2nd)}
              className={`h-9 rounded-xl text-xs font-black transition active:scale-95 ${
                is2nd
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              2nd
            </button>
            <button
              onClick={() => setAngleUnit(angleUnit === 'deg' ? 'rad' : 'deg')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95 uppercase"
            >
              {angleUnit}
            </button>
            <button
              onClick={() => handleFunctionInput(is2nd ? 'asin' : 'sin')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              {is2nd ? 'sin⁻¹' : 'sin'}
            </button>
            <button
              onClick={() => handleFunctionInput(is2nd ? 'acos' : 'cos')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              {is2nd ? 'cos⁻¹' : 'cos'}
            </button>
            <button
              onClick={() => handleFunctionInput(is2nd ? 'atan' : 'tan')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              {is2nd ? 'tan⁻¹' : 'tan'}
            </button>
          </div>

          {/* Row 2: Logs & Powers */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleFunctionInput('ln')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              ln
            </button>
            <button
              onClick={() => handleFunctionInput('log')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              log
            </button>
            <button
              onClick={() => handleInput('^2')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              x²
            </button>
            <button
              onClick={() => handleInput('^3')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              x³
            </button>
            <button
              onClick={() => handleInput('^')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              xʸ
            </button>
          </div>

          {/* Row 3: Roots, Factorial, Parentheses */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleFunctionInput('√')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              √x
            </button>
            <button
              onClick={() => handleFunctionInput('∛')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              ∛x
            </button>
            <button
              onClick={() => handleInput('!')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              x!
            </button>
            <button
              onClick={() => handleInput('(')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              (
            </button>
            <button
              onClick={() => handleInput(')')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95"
            >
              )
            </button>
          </div>

          {/* Row 4: Memory & Constants */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleMemory('MC')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold active:scale-95"
            >
              MC
            </button>
            <button
              onClick={() => handleMemory('MR')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold active:scale-95"
            >
              MR
            </button>
            <button
              onClick={() => handleMemory('M+')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold active:scale-95"
            >
              M+
            </button>
            <button
              onClick={() => handleInput('π')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black active:scale-95 font-serif"
            >
              π
            </button>
            <button
              onClick={() => handleInput('e')}
              className="h-9 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black active:scale-95 font-serif"
            >
              e
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STANDARD KEYPAD GRID (Numbers, Standard Operators, Clear & Equals)
         ========================================================================= */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Row 1: AC, DEL, %, ÷ */}
        <button
          onClick={handleClear}
          className="h-13 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm active:scale-95 border border-rose-200/60 dark:border-rose-900/40 shadow-2xs transition"
        >
          AC
        </button>
        <button
          onClick={handleDelete}
          className="h-13 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center active:scale-95 shadow-2xs transition"
          title="মুছুন"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleInput('%')}
          className="h-13 sm:h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#0B63F6] dark:text-blue-400 font-bold text-base active:scale-95 shadow-2xs transition"
        >
          %
        </button>
        <button
          onClick={() => handleInput('÷')}
          className="h-13 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B63F6] dark:text-blue-400 font-black text-xl active:scale-95 border border-blue-200/50 dark:border-blue-900/50 shadow-2xs transition"
        >
          ÷
        </button>

        {/* Row 2: 7, 8, 9, × */}
        <button
          onClick={() => handleInput('7')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          7
        </button>
        <button
          onClick={() => handleInput('8')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          8
        </button>
        <button
          onClick={() => handleInput('9')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          9
        </button>
        <button
          onClick={() => handleInput('×')}
          className="h-13 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B63F6] dark:text-blue-400 font-black text-xl active:scale-95 border border-blue-200/50 dark:border-blue-900/50 shadow-2xs transition"
        >
          ×
        </button>

        {/* Row 3: 4, 5, 6, - */}
        <button
          onClick={() => handleInput('4')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          4
        </button>
        <button
          onClick={() => handleInput('5')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          5
        </button>
        <button
          onClick={() => handleInput('6')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          6
        </button>
        <button
          onClick={() => handleInput('-')}
          className="h-13 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B63F6] dark:text-blue-400 font-black text-2xl active:scale-95 border border-blue-200/50 dark:border-blue-900/50 shadow-2xs transition"
        >
          −
        </button>

        {/* Row 4: 1, 2, 3, + */}
        <button
          onClick={() => handleInput('1')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          1
        </button>
        <button
          onClick={() => handleInput('2')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          2
        </button>
        <button
          onClick={() => handleInput('3')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          3
        </button>
        <button
          onClick={() => handleInput('+')}
          className="h-13 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B63F6] dark:text-blue-400 font-black text-2xl active:scale-95 border border-blue-200/50 dark:border-blue-900/50 shadow-2xs transition"
        >
          +
        </button>

        {/* Row 5: ±, 0, ., = */}
        <button
          onClick={handleNegate}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-base active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          ±
        </button>
        <button
          onClick={() => handleInput('0')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-lg active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          0
        </button>
        <button
          onClick={() => handleInput('.')}
          className="h-13 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xl active:scale-95 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-13 sm:h-14 rounded-2xl bg-[#0B63F6] hover:bg-blue-600 text-white font-black text-2xl active:scale-95 shadow-md shadow-blue-500/25 transition flex items-center justify-center"
        >
          =
        </button>
      </div>
    </div>
  );
};
