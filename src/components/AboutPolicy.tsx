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
        <img
          src="/logo.png"
          alt="SmartHub Logo"
          className="w-20 h-20 rounded-3xl object-cover shadow-lg border border-slate-200 dark:border-slate-700"
        />

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

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'গুগল প্লে কনসোল ডেটা নিরাপত্তা ডিক্লারেশন:' : 'Google Play Console Data Safety Disclosure:'}
          </p>
          <p>
            {lang === 'bn'
              ? '• অধিকাংশ টুল (ক্যালকুলেটর, টালি খাতা অফলাইন, জমি ও বিদ্যুৎ হিসাব, কুরআন পাঠ) সম্পূর্ণ অফলাইনে কাজ করে এবং ফোনের লোকাল স্টোরেজে (unencrypted localStorage) ডেটা রাখে।'
              : '• Core calculators, Quran reader, and offline Tally Khata store records locally on your device (unencrypted browser/WebView storage).'}
          </p>
          <p>
            {lang === 'bn'
              ? '• ঐচ্ছিক লাইভ আবহাওয়া (open-meteo.com) ও নামাজের সময়সূচী (aladhan.com) ফিচার ব্যবহার করলে শুধু আপনার অনুমোদিত জিপিএস লোকেশন ওই API-তে পাঠানো হয়।'
              : '• Optional Weather (open-meteo.com) and Prayer Times (aladhan.com) transmit approximate GPS coordinates only when you invoke those tools.'}
          </p>
          <p>
            {lang === 'bn'
              ? '• ঐচ্ছিক টালি খাতা ক্লাউড ব্যাকআপ, অ্যাডমিন CMS/Firebase সিঙ্ক এবং AI স্টুডিও কেবল সাইন-ইন করা ব্যবহারকারীর অনুরোধে সার্ভারে ডেটা পাঠায়। ডেটা মুছতে অ্যাপের স্টোরেজ ক্লিয়ার বা ক্লাউড লগআউট/ব্যাকআপ ডিলিট করুন।'
              : '• Optional Tally Cloud sync, Admin CMS/Firebase sync, and AI Studio send data only when explicitly signed in. You can clear local data anytime via device settings.'}
          </p>
          <p>
            {lang === 'bn'
              ? '• AdMob বর্তমানে কনফিগারেশন/প্রিভিউ মোডে রয়েছে; লাইভ অ্যাড চালু করতে নেটিভ AdMob SDK ও GDPR/UMP কনসেন্ট যুক্ত করতে হবে।'
              : '• Google AdMob is currently in configuration/preview mode; native AdMob SDK & UMP consent must be integrated before serving live ads.'}
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
          SmartHub – All-in-One Tools © {new Date().getFullYear()} · Made for Android
        </span>
      </div>
    </div>
  );
};
