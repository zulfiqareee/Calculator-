import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Trash2,
  Edit3,
  Play,
  Save,
  Download,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Language, CustomTool, CustomToolInput } from '../../types';
import { UI_TEXT } from '../../i18n/translations';
import {
  getStoredCustomTools,
  saveStoredCustomTools,
  addCustomTool,
  deleteCustomTool,
  getAdminPin,
  setAdminPin,
  evaluateCustomFormula,
  INITIAL_CUSTOM_TOOLS,
} from '../../utils/customToolsStorage';

interface Props {
  lang: Language;
  onOpenTool?: (toolId: string) => void;
  onRefreshTools?: () => void;
}

export const AdminPanel: React.FC<Props> = ({ lang, onOpenTool, onRefreshTools }) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tools state
  const [tools, setTools] = useState<CustomTool[]>(getStoredCustomTools());
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Form state for creating/editing
  const [formTitleEn, setFormTitleEn] = useState<string>('');
  const [formTitleBn, setFormTitleBn] = useState<string>('');
  const [formDescEn, setFormDescEn] = useState<string>('');
  const [formDescBn, setFormDescBn] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'electrical' | 'utility' | 'finance' | 'daily'>('electrical');
  const [formBadgeEn, setFormBadgeEn] = useState<string>('Custom');
  const [formBadgeBn, setFormBadgeBn] = useState<string>('কাস্টম');
  const [formIcon, setFormIcon] = useState<string>('Cpu');
  const [formFormula, setFormFormula] = useState<string>('');
  const [formOutputLabelEn, setFormOutputLabelEn] = useState<string>('Result');
  const [formOutputLabelBn, setFormOutputLabelBn] = useState<string>('ফলাফল');
  const [formOutputUnit, setFormOutputUnit] = useState<string>('');
  const [formInputs, setFormInputs] = useState<CustomToolInput[]>([
    { id: '1', labelEn: 'Input A', labelBn: 'প্রথম মান (A)', variable: 'a', defaultValue: 10, unit: '' },
    { id: '2', labelEn: 'Input B', labelBn: 'দ্বিতীয় মান (B)', variable: 'b', defaultValue: 2, unit: '' },
  ]);

  // Live Test State
  const [testValues, setTestValues] = useState<Record<string, number>>({ a: 10, b: 2 });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Backup / Import State
  const [importJson, setImportJson] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

  // Auth Submit
  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentPin = getAdminPin();
    if (pinInput.trim() === currentPin) {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError(lang === 'bn' ? 'ভুল পিন কোড! ডিফল্ট পিন: 1234' : 'Incorrect PIN! Default PIN: 1234');
    }
  };

  // Test Formula Live
  const runLiveTest = (formulaStr: string, currentInputs: CustomToolInput[], vals: Record<string, number>) => {
    const res = evaluateCustomFormula(formulaStr, vals);
    if (res.success) {
      setTestResult(res.result.toFixed(3));
      setTestError(null);
    } else {
      setTestError(res.error || 'Syntax Error');
      setTestResult(null);
    }
  };

  // Open Create Mode
  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingTool(null);
    setFormTitleEn('');
    setFormTitleBn('');
    setFormDescEn('');
    setFormDescBn('');
    setFormCategory('electrical');
    setFormBadgeEn('Electrical');
    setFormBadgeBn('ইলেকট্রিক্যাল');
    setFormFormula('v * i');
    setFormOutputLabelEn('Total Power');
    setFormOutputLabelBn('মোট শক্তি');
    setFormOutputUnit('Watts (W)');
    const initialInputs = [
      { id: '1', labelEn: 'Voltage (V)', labelBn: 'ভোল্টেজ (V)', variable: 'v', defaultValue: 220, unit: 'V' },
      { id: '2', labelEn: 'Current (A)', labelBn: 'কারেন্ট (A)', variable: 'i', defaultValue: 5, unit: 'A' },
    ];
    setFormInputs(initialInputs);
    setTestValues({ v: 220, i: 5 });
    runLiveTest('v * i', initialInputs, { v: 220, i: 5 });
  };

  // Open Edit Mode
  const handleStartEdit = (tool: CustomTool) => {
    setIsCreatingNew(false);
    setEditingTool(tool);
    setFormTitleEn(tool.titleEn);
    setFormTitleBn(tool.titleBn);
    setFormDescEn(tool.descEn);
    setFormDescBn(tool.descBn);
    setFormCategory(tool.category);
    setFormBadgeEn(tool.badgeEn);
    setFormBadgeBn(tool.badgeBn);
    setFormFormula(tool.formula);
    setFormOutputLabelEn(tool.outputLabelEn);
    setFormOutputLabelBn(tool.outputLabelBn);
    setFormOutputUnit(tool.outputUnit);
    setFormInputs(tool.inputs);

    const initVals: Record<string, number> = {};
    tool.inputs.forEach((inp) => {
      initVals[inp.variable] = inp.defaultValue;
    });
    setTestValues(initVals);
    runLiveTest(tool.formula, tool.inputs, initVals);
  };

  // Add variable input
  const handleAddVariable = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const usedVars = formInputs.map((i) => i.variable);
    const nextVar = letters.split('').find((l) => !usedVars.includes(l)) || `var${formInputs.length + 1}`;

    const newInp: CustomToolInput = {
      id: String(Date.now()),
      labelEn: `Parameter ${nextVar.toUpperCase()}`,
      labelBn: `প্যারামিটার ${nextVar.toUpperCase()}`,
      variable: nextVar,
      defaultValue: 1,
      unit: '',
    };
    const updated = [...formInputs, newInp];
    setFormInputs(updated);
    setTestValues({ ...testValues, [nextVar]: 1 });
  };

  // Remove variable input
  const handleRemoveVariable = (idx: number) => {
    const updated = formInputs.filter((_, i) => i !== idx);
    setFormInputs(updated);
  };

  // Save tool
  const handleSaveTool = () => {
    if (!formTitleEn.trim() && !formTitleBn.trim()) {
      alert(lang === 'bn' ? 'টুলের একটি শিরোনাম দিন।' : 'Please enter a tool title.');
      return;
    }
    if (!formFormula.trim()) {
      alert(lang === 'bn' ? 'একটি ফর্মুলা সূত্র লিখুন।' : 'Please enter a formula.');
      return;
    }

    const toolObj: CustomTool = {
      id: editingTool ? editingTool.id : `custom-${Date.now()}`,
      titleEn: formTitleEn.trim() || formTitleBn.trim(),
      titleBn: formTitleBn.trim() || formTitleEn.trim(),
      descEn: formDescEn.trim() || 'Custom calculation tool.',
      descBn: formDescBn.trim() || 'কাস্টম হিসাবের টুল।',
      category: formCategory,
      badgeEn: formBadgeEn.trim() || 'Custom',
      badgeBn: formBadgeBn.trim() || 'কাস্টম',
      iconName: formIcon,
      gradient: formCategory === 'electrical' ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-700',
      inputs: formInputs,
      formula: formFormula.trim(),
      outputLabelEn: formOutputLabelEn.trim() || 'Result',
      outputLabelBn: formOutputLabelBn.trim() || 'ফলাফল',
      outputUnit: formOutputUnit.trim(),
      createdAt: editingTool ? editingTool.createdAt : Date.now(),
    };

    addCustomTool(toolObj);
    setTools(getStoredCustomTools());
    setIsCreatingNew(false);
    setEditingTool(null);
    if (onRefreshTools) onRefreshTools();
  };

  // Delete tool
  const handleDeleteTool = (id: string) => {
    if (confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই কাস্টম টুলটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this custom tool?')) {
      deleteCustomTool(id);
      setTools(getStoredCustomTools());
      if (onRefreshTools) onRefreshTools();
    }
  };

  // Export JSON
  const handleExportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tools, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Import JSON
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        saveStoredCustomTools(parsed);
        setTools(parsed);
        setImportJson('');
        alert(lang === 'bn' ? 'সফলভাবে কাস্টম টুলস ইমপোর্ট হয়েছে!' : 'Custom tools successfully imported!');
        if (onRefreshTools) onRefreshTools();
      } else {
        alert('Invalid JSON format: Expected an array of tools.');
      }
    } catch {
      alert('Error parsing JSON string.');
    }
  };

  // Change PIN
  const handleChangePin = () => {
    if (newPin.trim().length >= 4) {
      setAdminPin(newPin.trim());
      setPinSuccess(true);
      setNewPin('');
      setTimeout(() => setPinSuccess(false), 2000);
    } else {
      alert(lang === 'bn' ? 'পিন কমপক্ষে ৪ সংখ্যার হতে হবে।' : 'PIN must be at least 4 digits.');
    }
  };

  // Quick Clone Preset
  const handleQuickAddTemplate = (preset: CustomTool) => {
    const clone = { ...preset, id: `custom-${Date.now()}` };
    addCustomTool(clone);
    setTools(getStoredCustomTools());
    if (onRefreshTools) onRefreshTools();
  };

  // ==========================================
  // VIEW: PIN AUTHENTICATION SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-10 max-w-sm mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md w-full flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'অ্যাডমিন প্যানেল প্রবেশ' : 'Admin Panel Access'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {lang === 'bn'
              ? 'অ্যাপে নতুন ফর্মুলা বা নিজস্ব ইলেকট্রিক্যাল ক্যালকুলেটর যুক্ত করতে সিকিউরিটি পিন দিন।'
              : 'Enter admin security PIN to create and manage custom calculation tools.'}
          </p>

          <form onSubmit={handleAuth} className="w-full mt-6 flex flex-col gap-3">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={lang === 'bn' ? 'পিন লিখুন (ডিফল্ট: 1234)' : 'Enter PIN (Default: 1234)'}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 text-center text-base font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>

            {authError && (
              <span className="text-xs text-rose-500 font-semibold">{authError}</span>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition active:scale-98 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm mt-1"
            >
              <Unlock className="w-4 h-4" />
              <span>{lang === 'bn' ? 'লগইন করুন' : 'Unlock Admin Panel'}</span>
            </button>
          </form>

          <div className="mt-5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 w-full text-left flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              {lang === 'bn'
                ? 'প্রথমবার ব্যবহার করছেন? ডিফল্ট পিন হলো 1234। ভেতরে প্রবেশ করে পিন পরিবর্তন করতে পারবেন।'
                : 'First time? Default PIN is 1234. You can customize the PIN once unlocked.'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATED ADMIN PANEL
  // ==========================================
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-extrabold tracking-wider">
              Admin Mode Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            {lang === 'bn' ? 'কাস্টম টুল ও ফর্মুলা স্টুডিও' : 'Custom Calculator & Formula Studio'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn'
              ? 'এখানে আপনি যেকোনো ইলেকট্রিক্যাল বা গাণিতিক সূত্রের নতুন ক্যালকুলেটর তৈরি করতে পারবেন।'
              : 'Create, edit, and expand this app with unlimited custom electrical & math calculators.'}
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 flex items-center gap-1.5 shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'লক করুন' : 'Lock'}</span>
        </button>
      </div>

      {/* Action Bar: Create New Button */}
      {!isCreatingNew && !editingTool && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <button
            onClick={handleStartCreate}
            className="h-12 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? '+ নতুন ক্যালকুলেটর তৈরি করুন' : '+ Create New Calculator'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'Copied JSON!' : (lang === 'bn' ? 'ব্যাকআপ JSON কপি' : 'Export Backup JSON')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE / EDIT FORM MODAL CARD
         ======================================================== */}
      {(isCreatingNew || editingTool) && (
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTool
                  ? (lang === 'bn' ? 'ক্যালকুলেটর সম্পাদনা করুন' : 'Edit Custom Calculator')
                  : (lang === 'bn' ? 'নতুন ক্যালকুলেটর কনফিগারেশন' : 'New Custom Calculator')}
              </h2>
            </div>
            <button
              onClick={() => { setIsCreatingNew(false); setEditingTool(null); }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Title in Bengali (বাংলা নাম)
              </label>
              <input
                type="text"
                value={formTitleBn}
                onChange={(e) => setFormTitleBn(e.target.value)}
                placeholder="যেমন: জেনারেটর ডিজেল খরচ"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Title in English (ইংরেজি নাম)
              </label>
              <input
                type="text"
                value={formTitleEn}
                onChange={(e) => setFormTitleEn(e.target.value)}
                placeholder="e.g. Generator Fuel Consumption"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Description (বিবরণ)
              </label>
              <input
                type="text"
                value={formDescBn}
                onChange={(e) => setFormDescBn(e.target.value)}
                placeholder="টুলটি কী হিসাব করবে সংক্ষেপে লিখুন..."
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category (ক্যাটাগরি)
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold"
              >
                <option value="electrical">Electrical (ইলেকট্রিক্যাল)</option>
                <option value="utility">Utility (ইউটিলিটি ও শক্তি)</option>
                <option value="finance">Finance (হিসাব ও অর্থ)</option>
                <option value="daily">Daily Life (দৈনন্দিন)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Badge / Tag
              </label>
              <input
                type="text"
                value={formBadgeBn}
                onChange={(e) => setFormBadgeBn(e.target.value)}
                placeholder="e.g. ডিজেল / সোলার"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
              />
            </div>
          </div>

          {/* DYNAMIC VARIABLES BUILDER */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Input Variables (ব্যবহারকারী যে মানগুলো ইনপুট দেবে):
              </label>
              <button
                type="button"
                onClick={handleAddVariable}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Variable</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {formInputs.map((inp, idx) => (
                <div
                  key={inp.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block">Variable</span>
                    <input
                      type="text"
                      value={inp.variable}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        const updated = [...formInputs];
                        updated[idx].variable = val;
                        setFormInputs(updated);
                      }}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-mono font-bold text-center"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <span className="text-[10px] text-slate-400 block">Label (নাম)</span>
                    <input
                      type="text"
                      value={inp.labelBn}
                      onChange={(e) => {
                        const updated = [...formInputs];
                        updated[idx].labelBn = e.target.value;
                        setFormInputs(updated);
                      }}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block">Default</span>
                    <input
                      type="number"
                      value={inp.defaultValue}
                      onChange={(e) => {
                        const updated = [...formInputs];
                        updated[idx].defaultValue = parseFloat(e.target.value) || 0;
                        setFormInputs(updated);
                      }}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-bold text-center"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <span className="text-[10px] text-slate-400 block">Unit (একক)</span>
                    <input
                      type="text"
                      value={inp.unit}
                      placeholder="e.g. V, A, Watts"
                      onChange={(e) => {
                        const updated = [...formInputs];
                        updated[idx].unit = e.target.value;
                        setFormInputs(updated);
                      }}
                      className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-medium"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center">
                    {formInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULA EDITOR */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Formula Expression (হিসাবের সূত্র):
              </label>
              <div className="flex gap-1 text-[11px] text-slate-400">
                <span>Available vars:</span>
                <span className="font-mono text-emerald-500 font-bold">
                  {formInputs.map((i) => i.variable).join(', ')}
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formFormula}
                onChange={(e) => {
                  setFormFormula(e.target.value);
                  runLiveTest(e.target.value, formInputs, testValues);
                }}
                placeholder="e.g. v * i * 0.8  or  (a + b) / 2"
                className="w-full h-11 bg-slate-950 font-mono text-emerald-400 border border-slate-700 rounded-xl px-3 text-sm font-bold tracking-wide"
              />
            </div>

            {/* Helper buttons */}
            <div className="flex flex-wrap gap-1 mt-2">
              {['+', '-', '*', '/', '(', ')', 'sqrt()', 'pow(x, 2)', 'PI'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    const next = `${formFormula} ${sym}`;
                    setFormFormula(next);
                    runLiveTest(next, formInputs, testValues);
                  }}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-mono text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* OUTPUT LABELS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Output Label (ফলাফলের নাম)
              </label>
              <input
                type="text"
                value={formOutputLabelBn}
                onChange={(e) => setFormOutputLabelBn(e.target.value)}
                placeholder="e.g. প্রয়োজনীয় মোট শক্তি"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Output Unit (ফলাফলের একক)
              </label>
              <input
                type="text"
                value={formOutputUnit}
                onChange={(e) => setFormOutputUnit(e.target.value)}
                placeholder="e.g. Litres/hr, Watts, kVA"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs"
              />
            </div>
          </div>

          {/* LIVE TESTER RUNNER */}
          <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Live Formula Test Preview:
              </span>
              {testError ? (
                <span className="text-rose-400 font-mono text-[11px]">{testError}</span>
              ) : (
                <span className="text-emerald-400 font-mono text-[11px]">Valid Formula ✓</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {formInputs.map((inp) => (
                <div key={`test-${inp.variable}`} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg">
                  <span className="text-xs text-slate-400 font-mono">{inp.variable}:</span>
                  <input
                    type="number"
                    value={testValues[inp.variable] ?? inp.defaultValue}
                    onChange={(e) => {
                      const updated = { ...testValues, [inp.variable]: parseFloat(e.target.value) || 0 };
                      setTestValues(updated);
                      runLiveTest(formFormula, formInputs, updated);
                    }}
                    className="w-14 bg-transparent text-xs font-bold text-cyan-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">{inp.unit}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">{formOutputLabelBn || 'Result'}:</span>
              <span className="text-lg font-mono font-black text-emerald-400">
                {testResult !== null ? `${testResult} ${formOutputUnit}` : '---'}
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setIsCreatingNew(false); setEditingTool(null); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTool}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ক্যালকুলেটরটি সংরক্ষণ করুন' : 'Save Calculator'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          LIST OF INSTALLED CUSTOM CALCULATORS
         ======================================================== */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {lang === 'bn' ? 'আপনার সক্রিয় কাস্টম ক্যালকুলেটরসমূহ' : 'Your Custom Built Calculators'} ({tools.length})
        </h2>

        {tools.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-500">
            {lang === 'bn' ? 'এখনো কোনো কাস্টম টুল তৈরি করা হয়নি। উপরে বাটনে চাপ দিয়ে তৈরি করুন!' : 'No custom calculators created yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {tool.badgeBn || tool.badgeEn}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(tool)}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTool(tool.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {lang === 'bn' ? tool.titleBn : tool.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {lang === 'bn' ? tool.descBn : tool.descEn}
                  </p>

                  <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    Formula: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tool.formula}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {tool.inputs.length} parameters
                  </span>
                  {onOpenTool && (
                    <button
                      onClick={() => onOpenTool(tool.id)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>{lang === 'bn' ? 'ব্যবহার করুন' : 'Test Run'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          QUICK ADD TEMPLATES
         ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {lang === 'bn' ? '১-ক্লিকে রেডিমেড ইলেকট্রিক্যাল টেমপ্লেট যুক্ত করুন:' : '1-Click Quick Add Electrical Templates:'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() =>
              handleQuickAddTemplate({
                id: `tmpl-${Date.now()}-gen`,
                titleEn: 'Generator Diesel Fuel Consumption',
                titleBn: 'জেনারেটর ডিজেল জ্বালানি খরচ',
                descEn: 'Approximate diesel consumption per hour based on generator rating (kVA) and load percentage.',
                descBn: 'জেনারেটর kVA এবং লোড শতকরা অনুযায়ী প্রতি ঘণ্টায় আনুমানিক ডিজেল খরচ (লিটার)।',
                category: 'electrical',
                badgeEn: 'Generator',
                badgeBn: 'জেনারেটর',
                iconName: 'Zap',
                gradient: 'from-amber-500 to-red-600',
                inputs: [
                  { id: 'kva', labelEn: 'Generator Rating (kVA)', labelBn: 'জেনারেটর ক্ষমতা (kVA)', variable: 'kva', defaultValue: 50, unit: 'kVA' },
                  { id: 'load', labelEn: 'Load Percentage (%)', labelBn: 'চলমান লোড (%)', variable: 'load', defaultValue: 75, unit: '%' },
                ],
                formula: 'kva * (load / 100) * 0.28',
                outputLabelEn: 'Hourly Fuel Consumption',
                outputLabelBn: 'ঘণ্টায় আনুমানিক ডিজেল খরচ',
                outputUnit: 'Litre / hour',
                createdAt: Date.now(),
              })
            }
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-left transition active:scale-98"
          >
            <span className="font-bold text-xs text-slate-900 dark:text-white block">+ জেনারেটর ডিজেল খরচ (L/hr)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">kVA × Load % × 0.28 L/hr</span>
          </button>

          <button
            onClick={() =>
              handleQuickAddTemplate({
                id: `tmpl-${Date.now()}-chg`,
                titleEn: 'Battery Charging Time',
                titleBn: 'ব্যাটারি চার্জিং সময় ক্যালকুলেটর',
                descEn: 'Estimate hours required to fully charge a lead-acid/tubular battery with 1.2 loss factor.',
                descBn: 'ব্যাটারি Ah ও চার্জার অ্যাম্পিয়ার অনুযায়ী সম্পূর্ণ চার্জ হতে প্রয়োজনীয় সময়।',
                category: 'electrical',
                badgeEn: 'Battery',
                badgeBn: 'ব্যাটারি',
                iconName: 'BatteryCharging',
                gradient: 'from-emerald-500 to-teal-700',
                inputs: [
                  { id: 'ah', labelEn: 'Battery Capacity (Ah)', labelBn: 'ব্যাটারি ক্ষমতা (Ah)', variable: 'ah', defaultValue: 100, unit: 'Ah' },
                  { id: 'amps', labelEn: 'Charging Current (A)', labelBn: 'চার্জার অ্যাম্পিয়ার (A)', variable: 'amps', defaultValue: 10, unit: 'A' },
                ],
                formula: '(ah / amps) * 1.2',
                outputLabelEn: 'Charging Time Required',
                outputLabelBn: 'মোট চার্জিং সময়',
                outputUnit: 'ঘণ্টা (Hours)',
                createdAt: Date.now(),
              })
            }
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-left transition active:scale-98"
          >
            <span className="font-bold text-xs text-slate-900 dark:text-white block">+ ব্যাটারি চার্জিং সময় (Hours)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">(Ah / Charger Amps) × 1.2</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SETTINGS & PIN MANAGEMENT
         ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {lang === 'bn' ? 'অ্যাডমিন সিকিউরিটি পিন পরিবর্তন:' : 'Change Admin Security PIN:'}
        </h3>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={8}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder={lang === 'bn' ? 'নতুন ৪ সংখ্যার পিন লিখুন' : 'Enter new 4-digit PIN'}
            className="w-48 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
          />
          <button
            onClick={handleChangePin}
            className="px-4 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            {pinSuccess ? 'Saved!' : (lang === 'bn' ? 'পিন সংরক্ষণ করুন' : 'Update PIN')}
          </button>
        </div>
      </div>
    </div>
  );
};
