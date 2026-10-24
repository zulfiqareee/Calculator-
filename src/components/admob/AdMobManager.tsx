import React, { useState } from 'react';
import {
  DollarSign,
  ShieldCheck,
  Code2,
  FileText,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Language, AdMobConfig } from '../../types';
import { UI_TEXT } from '../../i18n/translations';
import { getStoredAdMobConfig, setStoredAdMobConfig, DEFAULT_ADMOB_CONFIG } from '../../utils/storage';

interface Props {
  lang: Language;
}

export const AdMobManager: React.FC<Props> = ({ lang }) => {
  const [config, setConfig] = useState<AdMobConfig>(getStoredAdMobConfig());
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const t = UI_TEXT[lang];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredAdMobConfig(config);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetToTest = () => {
    setConfig(DEFAULT_ADMOB_CONFIG);
    setStoredAdMobConfig(DEFAULT_ADMOB_CONFIG);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t.admob.title}</h2>
            <p className="text-xs text-emerald-100 mt-0.5">{t.admob.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                config.isTestMode ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {config.isTestMode
              ? (lang === 'bn' ? 'টেস্ট মোড সক্রিয়' : 'Test Mode Active')
              : (lang === 'bn' ? 'প্রোডাকশন মোড' : 'Production Mode')}
          </span>
          <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-full font-mono">
            v1.0.0 Ready
          </span>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <Code2 className="w-4 h-4 text-emerald-600" />
          <span>{t.admob.guideHeading}</span>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Step 1 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {t.admob.step1Title}
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.admob.step1Desc}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {t.admob.step2Title}
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.admob.step2Desc}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {t.admob.step3Title}
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.admob.step3Desc}
            </p>
            {/* Code Snippet for AndroidManifest.xml */}
            <div className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
              <span className="text-slate-500">{`<!-- In android/app/src/main/AndroidManifest.xml inside <application> -->`}</span>
              <br />
              <span className="text-emerald-400">{`<meta-data`}</span>
              <br />
              &nbsp;&nbsp;
              <span className="text-cyan-300">{`android:name="com.google.android.gms.ads.APPLICATION_ID"`}</span>
              <br />
              &nbsp;&nbsp;
              <span className="text-amber-300">{`android:value="${config.appId}" />`}</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              {t.admob.step4Title}
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.admob.step4Desc}
            </p>
          </div>
        </div>
      </div>

      {/* Critical AdMob Policy Compliance Box */}
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 rounded-3xl p-5 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{lang === 'bn' ? 'গুগল অ্যাডমব নীতি ও নিষেধাজ্ঞা (সতর্কতা)' : 'Google AdMob Policy Warnings'}</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          <li>
            {lang === 'bn'
              ? 'কখনোই নিজের বিজ্ঞাপনে নিজে ক্লিক করবেন না (এমনকি ভুলবশতও নয়)। এতে অ্যাডমব অ্যাকাউন্ট চিরতরে বন্ধ হয়ে যেতে পারে।'
              : 'Never click on your own live advertisements. Invalid click activity results in permanent AdMob account termination.'}
          </li>
          <li>
            {lang === 'bn'
              ? 'ব্যবহারকারীদের বিজ্ঞাপনে ক্লিক করতে উৎসাহিত করবেন না বা জোরপূর্বক বোতামের ওপর বিজ্ঞাপন রাখবেন না।'
              : 'Never incentivize or encourage users to click ads, and never place ads covering buttons.'}
          </li>
          <li>
            {lang === 'bn'
              ? 'প্লে স্টোরে অ্যাপ ছাড়ার আগে অবশ্যই টেস্ট আইডি পরিবর্তন করে আপনার আসল অ্যাডমব আইডি বসাবেন।'
              : 'Always swap test IDs with your real registered AdMob IDs before Google Play production release.'}
          </li>
        </ul>
      </div>

      {/* Configuration Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t.admob.customConfig}
          </h3>
          <button
            type="button"
            onClick={handleResetToTest}
            className="text-[11px] text-emerald-600 hover:underline font-semibold"
          >
            {lang === 'bn' ? 'টেস্ট আইডিতে ফিরুন' : 'Reset to Official Test IDs'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {t.admob.appIdLabel}
          </label>
          <input
            type="text"
            value={config.appId}
            onChange={(e) => setConfig({ ...config, appId: e.target.value })}
            className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            {t.admob.bannerIdLabel}
          </label>
          <input
            type="text"
            value={config.bannerAdUnitId}
            onChange={(e) => setConfig({ ...config, bannerAdUnitId: e.target.value })}
            className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={config.isTestMode}
            onChange={(e) => setConfig({ ...config, isTestMode: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600"
          />
          <span className="font-medium">{t.admob.isTestLabel}</span>
        </label>

        {savedNotice && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'bn' ? 'কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!' : 'AdMob configuration saved locally!'}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-98"
        >
          {t.admob.saveAdmobBtn}
        </button>
      </form>
    </div>
  );
};
