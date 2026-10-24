import React, { useState } from 'react';
import { Cpu, ShieldAlert, Copy, Check, RotateCcw, Info } from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type SolvedResult =
  | {
      status: 'success';
      v: number;
      i: number;
      r: number;
      p: number;
      formula: string;
    }
  | {
      status: 'need_more' | 'error';
      msg: string;
    };

export const ElectricalCalculator: React.FC<Props> = ({ lang }) => {
  const [voltage, setVoltage] = useState<string>('220');
  const [current, setCurrent] = useState<string>('5');
  const [resistance, setResistance] = useState<string>('');
  const [power, setPower] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[lang];

  // Helper to determine which 2 fields are filled
  const solveElectrical = (): SolvedResult => {
    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const r = parseFloat(resistance);
    const p = parseFloat(power);

    const hasV = !isNaN(v) && v > 0;
    const hasI = !isNaN(i) && i > 0;
    const hasR = !isNaN(r) && r > 0;
    const hasP = !isNaN(p) && p > 0;

    const count = [hasV, hasI, hasR, hasP].filter(Boolean).length;

    if (count < 2) {
      return { status: 'need_more', msg: lang === 'bn' ? 'যেকোনো দুটি ঘরে মান লিখুন' : 'Enter any two values to solve' };
    }

    let calcV = v, calcI = i, calcR = r, calcP = p;
    let formulaDesc = '';

    try {
      if (hasV && hasI) {
        calcR = calcV / calcI;
        calcP = calcV * calcI;
        formulaDesc = 'R = V / I, P = V × I';
      } else if (hasV && hasR) {
        calcI = calcV / calcR;
        calcP = (calcV * calcV) / calcR;
        formulaDesc = 'I = V / R, P = V² / R';
      } else if (hasV && hasP) {
        calcI = calcP / calcV;
        calcR = (calcV * calcV) / calcP;
        formulaDesc = 'I = P / V, R = V² / P';
      } else if (hasI && hasR) {
        calcV = calcI * calcR;
        calcP = calcI * calcI * calcR;
        formulaDesc = 'V = I × R, P = I² × R';
      } else if (hasI && hasP) {
        calcV = calcP / calcI;
        calcR = calcP / (calcI * calcI);
        formulaDesc = 'V = P / I, R = P / I²';
      } else if (hasR && hasP) {
        calcV = Math.sqrt(calcP * calcR);
        calcI = Math.sqrt(calcP / calcR);
        formulaDesc = 'V = √(P × R), I = √(P / R)';
      }

      return {
        status: 'success',
        v: calcV,
        i: calcI,
        r: calcR,
        p: calcP,
        formula: formulaDesc,
      };
    } catch {
      return { status: 'error', msg: 'Math error' };
    }
  };

  const solved = solveElectrical();

  const handleReset = () => {
    setVoltage('');
    setCurrent('');
    setResistance('');
    setPower('');
    setError(null);
  };

  const handleCopy = async () => {
    if (solved.status !== 'success') return;
    const summary = `Ohm's Law Calculation:
Voltage (V): ${solved.v.toFixed(2)} V
Current (I): ${solved.i.toFixed(2)} A
Resistance (R): ${solved.r.toFixed(2)} Ω
Power (P): ${solved.p.toFixed(2)} W
Formulas: ${solved.formula}`;

    const ok = await copyToClipboard(summary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'electrical',
      titleEn: "Ohm's Law",
      titleBn: 'ওহমস ল হিসাব',
      expression: solved.formula,
      result: `V=${solved.v.toFixed(1)}V, I=${solved.i.toFixed(1)}A, R=${solved.r.toFixed(1)}Ω, P=${solved.p.toFixed(1)}W`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Safety Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.disclaimers.electricalSafety}</p>
      </div>

      {/* Inputs Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{lang === 'bn' ? 'যেকোনো দুটি মান প্রদান করুন:' : 'Enter any two known values:'}</span>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.actions.reset}</span>
          </button>
        </div>

        {/* 4 Inputs Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Voltage */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'ভোল্টেজ (V)' : 'Voltage (V)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
                placeholder="Volts"
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                V
              </span>
            </div>
          </div>

          {/* Current */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'কারেন্ট (I)' : 'Current (I)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Amperes"
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                A
              </span>
            </div>
          </div>

          {/* Resistance */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'রোধ (R)' : 'Resistance (R)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={resistance}
                onChange={(e) => setResistance(e.target.value)}
                placeholder="Ohms"
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Ω
              </span>
            </div>
          </div>

          {/* Power */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'শক্তি / ওয়াট (P)' : 'Power (P)'}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                placeholder="Watts"
                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                W
              </span>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">{lang === 'bn' ? 'সাধারণ প্রিসেট:' : 'Quick Presets:'}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setVoltage('220');
                setCurrent('5');
                setResistance('');
                setPower('');
              }}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] rounded-lg font-medium"
            >
              220V 5A
            </button>
            <button
              onClick={() => {
                setVoltage('220');
                setPower('1000');
                setCurrent('');
                setResistance('');
              }}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] rounded-lg font-medium"
            >
              220V 1000W
            </button>
            <button
              onClick={() => {
                setVoltage('12');
                setCurrent('2');
                setResistance('');
                setPower('');
              }}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] rounded-lg font-medium"
            >
              12V 2A
            </button>
          </div>
        </div>
      </div>

      {/* Solved Results Grid */}
      {solved.status === 'success' ? (
        <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Cpu className="w-4 h-4" />
              {lang === 'bn' ? 'গণনাকৃত ফলাফল:' : 'Calculated Electrical Results:'}
            </span>
            <span className="font-mono text-[11px] text-slate-400">{solved.formula}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                {lang === 'bn' ? 'ভোল্টেজ (Voltage)' : 'Voltage'}
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                {formatNumber(solved.v.toFixed(2), lang)} <span className="text-sm">V</span>
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                {lang === 'bn' ? 'কারেন্ট (Current)' : 'Current'}
              </span>
              <span className="text-2xl font-black text-teal-400 font-mono mt-0.5">
                {formatNumber(solved.i.toFixed(2), lang)} <span className="text-sm">A</span>
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                {lang === 'bn' ? 'রোধ (Resistance)' : 'Resistance'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {formatNumber(solved.r.toFixed(2), lang)} <span className="text-sm">Ω</span>
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                {lang === 'bn' ? 'ক্ষমতা (Power)' : 'Power'}
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {formatNumber(solved.p.toFixed(2), lang)} <span className="text-sm">W</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : (lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy All Values')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
          {solved.msg}
        </div>
      )}
    </div>
  );
};
