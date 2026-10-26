import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Language, CustomTool } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { evaluateCustomFormula } from '../../utils/customToolsStorage';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
  tool: CustomTool;
}

export const CustomToolRunner: React.FC<Props> = ({ lang, tool }) => {
  const t = UI_TEXT[lang];

  // Map of variable values
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    tool.inputs.forEach((inp) => {
      init[inp.variable] = inp.defaultValue;
    });
    return init;
  });

  const [copied, setCopied] = useState<boolean>(false);

  // Sync if tool changes
  useEffect(() => {
    const init: Record<string, number> = {};
    tool.inputs.forEach((inp) => {
      init[inp.variable] = inp.defaultValue;
    });
    setValues(init);
  }, [tool]);

  // Compute result
  const evalResult = evaluateCustomFormula(tool.formula, values);

  const handleReset = () => {
    const resetVals: Record<string, number> = {};
    tool.inputs.forEach((inp) => {
      resetVals[inp.variable] = inp.defaultValue;
    });
    setValues(resetVals);
  };

  const handleCopy = async () => {
    if (!evalResult.success) return;
    const summary = `${lang === 'bn' ? tool.titleBn : tool.titleEn}:
${tool.outputLabelBn || tool.outputLabelEn}: ${evalResult.result.toFixed(2)} ${tool.outputUnit}
Formula: ${tool.formula}`;

    const ok = await copyToClipboard(summary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: tool.id,
      titleEn: tool.titleEn,
      titleBn: tool.titleBn,
      expression: tool.formula,
      result: `${evalResult.result.toFixed(2)} ${tool.outputUnit}`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Inputs Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{lang === 'bn' ? 'মানসমূহ প্রদান করুন:' : 'Enter parameters:'}</span>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.actions.reset}</span>
          </button>
        </div>

        {/* Inputs List */}
        <div className="flex flex-col gap-3">
          {tool.inputs.map((inp) => {
            const currentVal = values[inp.variable] ?? inp.defaultValue;
            return (
              <div key={inp.id}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? inp.labelBn : inp.labelEn}
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({inp.variable})
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step={inp.step || 'any'}
                    value={isNaN(currentVal) ? '' : currentVal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setValues({ ...values, [inp.variable]: isNaN(val) ? 0 : val });
                    }}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  {inp.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {inp.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Formula reference */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{lang === 'bn' ? 'ব্যবহৃত সূত্র:' : 'Applied Formula:'}</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{tool.formula}</span>
        </div>
      </div>

      {/* Calculated Result Card */}
      {evalResult.success ? (
        <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {lang === 'bn' ? (tool.outputLabelBn || 'ফলাফল') : (tool.outputLabelEn || 'Calculated Result')}:
          </span>

          <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              {lang === 'bn' ? (tool.outputLabelBn || 'গণনাকৃত মান') : (tool.outputLabelEn || 'Result')}
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
              {formatNumber(evalResult.result.toFixed(2), lang)}{' '}
              <span className="text-sm font-bold text-slate-400">{tool.outputUnit}</span>
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-sm mt-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.actions.copied : (lang === 'bn' ? 'ফলাফল কপি করুন' : 'Copy Result')}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Calculation Error: {evalResult.error}</span>
        </div>
      )}
    </div>
  );
};
