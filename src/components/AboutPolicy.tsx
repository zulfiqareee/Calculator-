import React from 'react';
import { ShieldCheck, Info, Heart, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/translations';

interface Props {
  lang: Language;
}

export const AboutPolicy: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto w-full pb-8">
      {/* App Branding Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.about.title}
          </h2>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            {t.about.version} · {t.about.developer}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mt-1">
          {t.about.description}
        </p>

        <div className="w-full pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-left text-xs">
          {t.about.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Policy Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3>{t.about.privacyTitle}</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t.about.privacyContent}
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'গুগল প্লে কনসোল ডেটা নিরাপত্তা деклараশন:' : 'Google Play Console Data Safety:'}
          </p>
          <p>
            {lang === 'bn'
              ? '• কোনো ব্যক্তিগত তথ্য (নাম, ইমেল, ফোন) সংগ্রহ বা ক্লাউডে পাঠানো হয় না।'
              : '• No personal information (name, email, phone) is collected or sent to servers.'}
          </p>
          <p>
            {lang === 'bn'
              ? '• ইন্টারনেট সংযোগ শুধুমাত্র গুগল অ্যাডমব টেস্ট/লাইভ বিজ্ঞাপন প্রদর্শনের জন্য ব্যবহৃত হতে পারে।'
              : '• Network access is only utilized by Google Mobile Ads SDK for serving advertisements.'}
          </p>
        </div>
      </div>

      {/* Google Play Store Launch Checklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <h3>{lang === 'bn' ? 'গুগল প্লে স্টোর রিলিজ চেকলিস্ট' : 'Google Play Release Checklist'}</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <span className="font-mono text-emerald-600 font-bold">1.</span>
            <span>
              {lang === 'bn'
                ? 'গুগল প্লে ডেভেলপার অ্যাকাউন্ট ($25 ওয়ান-টাইম ফি) প্রস্তুত রাখা।'
                : 'Google Play Developer Account registered ($25 one-time registration fee).'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <span className="font-mono text-emerald-600 font-bold">2.</span>
            <span>
              {lang === 'bn'
                ? 'রিলিজ বান্ডল (.aab) তৈরি করা (আমাদের গিটহাব অ্যাকশন ওয়ার্কফ্লো দিয়ে সরাসরি তৈরি করা যায়)।'
                : 'Generate Android App Bundle (.aab) using our automated GitHub Actions workflow.'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <span className="font-mono text-emerald-600 font-bold">3.</span>
            <span>
              {lang === 'bn'
                ? 'অ্যাপের সাইনিং কি (KeyStore) সুরক্ষিত রাখা। প্লে স্টোর অ্যাপ সাইনিং সক্রিয় করা।'
                : 'Keep your release signing keystore secure. Enable Google Play App Signing.'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
            <span className="font-mono text-emerald-600 font-bold">4.</span>
            <span>
              {lang === 'bn'
                ? 'নতুন ব্যক্তিগত অ্যাকাউন্টের জন্য ১৪ দিনের ২০ জন টেস্টারের ক্লোজড টেস্টিং সম্পন্ন করা।'
                : 'Complete the mandatory 14-day closed testing with 20 testers for personal Play accounts.'}
            </span>
          </div>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center flex flex-col items-center gap-2 text-xs">
        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {t.about.supportTitle}
        </span>
        <p className="text-slate-500 max-w-xs leading-relaxed">
          {t.about.supportText}
        </p>
        <span className="text-[11px] text-slate-400 mt-1">
          Smart Utility Tools © {new Date().getFullYear()} · Made for Android
        </span>
      </div>
    </div>
  );
};
