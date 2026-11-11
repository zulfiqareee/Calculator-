import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Clock,
  Sparkles,
  Bell,
  Copy,
  Check,
  Volume2,
  Calendar,
  Printer,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import { addOrUpdateAlarm, getStoredAlarms, AlarmItem } from '../../utils/alarmEngine';
import { tallySounds, speakBengali } from '../../utils/tallyAudioVoice';

interface Props {
  lang: Language;
  timings: Record<string, string> | null;
  locationTitle: string;
}

export const RamadanHubView: React.FC<Props> = ({ lang, timings, locationTitle }) => {
  const isBn = lang === 'bn';
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [copiedDua, setCopiedDua] = useState<string | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState<boolean>(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => getStoredAlarms());
  const [alarmToast, setAlarmToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sehriTimeStr = timings?.Imsak || timings?.Fajr || '04:52';
  const iftarTimeStr = timings?.Maghrib || '17:35';

  // Compute countdown to Sehri or Iftar
  const getFastingCountdown = () => {
    const now = currentTime;
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const [sH, sM] = sehriTimeStr.split(':').map(Number);
    const sehriMinutes = sH * 60 + sM;

    const [iH, iM] = iftarTimeStr.split(':').map(Number);
    const iftarMinutes = iH * 60 + iM;

    if (nowMinutes < sehriMinutes) {
      // Countdown to Sehri
      const diffM = sehriMinutes - nowMinutes;
      const h = Math.floor(diffM / 60);
      const m = Math.floor(diffM % 60);
      const s = Math.floor(60 - now.getSeconds()) % 60;
      return {
        stage: 'sehri',
        titleBn: 'সেহরি শেষ হতে বাকি',
        titleEn: 'Time Left for Sehri End',
        countdown: `${h > 0 ? `${formatNumber(h, lang)} ঘণ্টা ` : ''}${formatNumber(m, lang)} মিনিট ${formatNumber(s, lang)} সেকেন্ড`,
        targetTime: sehriTimeStr,
      };
    } else if (nowMinutes < iftarMinutes) {
      // Countdown to Iftar
      const diffM = iftarMinutes - nowMinutes;
      const h = Math.floor(diffM / 60);
      const m = Math.floor(diffM % 60);
      const s = Math.floor(60 - now.getSeconds()) % 60;
      return {
        stage: 'iftar',
        titleBn: 'ইফতার হতে বাকি',
        titleEn: 'Time Left for Iftar',
        countdown: `${h > 0 ? `${formatNumber(h, lang)} ঘণ্টা ` : ''}${formatNumber(m, lang)} মিনিট ${formatNumber(s, lang)} সেকেন্ড`,
        targetTime: iftarTimeStr,
      };
    } else {
      // After Iftar -> Countdown to Tomorrow's Sehri
      const tomorrowSehriMinutes = 24 * 60 + sehriMinutes;
      const diffM = tomorrowSehriMinutes - nowMinutes;
      const h = Math.floor(diffM / 60);
      const m = Math.floor(diffM % 60);
      return {
        stage: 'tomorrow_sehri',
        titleBn: 'আগামীকালের সেহরির বাকি',
        titleEn: 'Time Left for Tomorrow Sehri',
        countdown: `${formatNumber(h, lang)} ঘণ্টা ${formatNumber(m, lang)} মিনিট`,
        targetTime: sehriTimeStr,
      };
    }
  };

  const status = getFastingCountdown();

  // Check if Sehri / Iftar alarm is already set
  const isSehriAlarmSet = alarms.some((a) => a.id === 'alarm_ramadan_sehri' && a.enabled);
  const isIftarAlarmSet = alarms.some((a) => a.id === 'alarm_ramadan_iftar' && a.enabled);

  const toggleSehriAlarm = () => {
    tallySounds.playClickSound();
    // Calculate 30 minutes before sehri
    const [h, m] = sehriTimeStr.split(':').map(Number);
    let totalM = h * 60 + m - 35; // 35 minutes before
    if (totalM < 0) totalM += 24 * 60;
    const alarmH = Math.floor(totalM / 60).toString().padStart(2, '0');
    const alarmM = (totalM % 60).toString().padStart(2, '0');
    const alarmTime = `${alarmH}:${alarmM}`;

    const existing = alarms.find((a) => a.id === 'alarm_ramadan_sehri');
    if (existing && existing.enabled) {
      const updated = addOrUpdateAlarm({ ...existing, enabled: false });
      setAlarms(updated);
      setAlarmToast('সেহরি অ্যালার্ম বন্ধ করা হয়েছে');
    } else {
      const updated = addOrUpdateAlarm({
        id: 'alarm_ramadan_sehri',
        time: alarmTime,
        labelBn: 'সেহরি ও তাহাজ্জুদ অ্যালার্ম (রোজার প্রস্তুতি)',
        labelEn: 'Sehri & Tahajjud Alarm',
        enabled: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        soundTone: 'azan',
        vibrate: true,
        snoozeEnabled: true,
        snoozeDuration: 5,
        createdAt: Date.now(),
      });
      setAlarms(updated);
      setAlarmToast(`সেহরি অ্যালার্ম সেট করা হয়েছে: ভোর ${formatNumber(alarmTime, lang)}`);
      speakBengali(`ভোর ${alarmH}টা ${alarmM} মিনিটে সেহরির অ্যালার্ম সেট হয়েছে`);
    }
    setTimeout(() => setAlarmToast(null), 3500);
  };

  const toggleIftarAlarm = () => {
    tallySounds.playClickSound();
    const existing = alarms.find((a) => a.id === 'alarm_ramadan_iftar');
    if (existing && existing.enabled) {
      const updated = addOrUpdateAlarm({ ...existing, enabled: false });
      setAlarms(updated);
      setAlarmToast('ইফতার অ্যালার্ম বন্ধ করা হয়েছে');
    } else {
      const updated = addOrUpdateAlarm({
        id: 'alarm_ramadan_iftar',
        time: iftarTimeStr,
        labelBn: 'ইফতারের সময় ও মাগরিবের আজান',
        labelEn: 'Iftar Time Alarm',
        enabled: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        soundTone: 'azan',
        vibrate: true,
        snoozeEnabled: true,
        snoozeDuration: 5,
        createdAt: Date.now(),
      });
      setAlarms(updated);
      setAlarmToast(`ইফতার অ্যালার্ম সেট করা হয়েছে: সন্ধ্যা ${formatNumber(iftarTimeStr, lang)}`);
      speakBengali(`ইফতার ও মাগরিবের আজান অ্যালার্ম সেট হয়েছে`);
    }
    setTimeout(() => setAlarmToast(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    tallySounds.playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedDua(id);
    setTimeout(() => setCopiedDua(null), 2500);
  };

  // Generate 30 Days schedule table based on base timings
  const [baseH, baseM] = sehriTimeStr.split(':').map(Number);
  const [baseIH, baseIM] = iftarTimeStr.split(':').map(Number);

  const ramadanDays = Array.from({ length: 30 }, (_, idx) => {
    // Ramadan progression: Sehri typically decreases slightly, Iftar increases slightly
    const day = idx + 1;
    const sehriDelta = Math.floor(day / 6); // slightly earlier
    const iftarDelta = Math.floor(day / 5); // slightly later

    const sMinutes = baseH * 60 + baseM - sehriDelta;
    const sTime = `${String(Math.floor(sMinutes / 60)).padStart(2, '0')}:${String(sMinutes % 60).padStart(2, '0')}`;

    const iMinutes = baseIH * 60 + baseIM + iftarDelta;
    const iTime = `${String(Math.floor(iMinutes / 60)).padStart(2, '0')}:${String(iMinutes % 60).padStart(2, '0')}`;

    return {
      ramadanDay: day,
      sehri: sTime,
      iftar: iTime,
    };
  });

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none animate-fadeIn">
      {/* Toast Notification */}
      {alarmToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-md animate-fadeIn">
          {alarmToast}
        </div>
      )}

      {/* Hero Ramadan Fasting Status Card */}
      <div
        className="p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col gap-4"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0f172a 100%)',
        }}
      >
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-max">
              <Moon className="w-3 h-3 text-amber-300" />
              মাহে রমজান হাব
            </span>
            <h2 className="text-base font-black mt-1 text-white flex items-center gap-1.5">
              <span>{locationTitle}</span>
            </h2>
          </div>
          <span className="text-3xl">🌙</span>
        </div>

        {/* Big Live Countdown Display */}
        <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center flex flex-col items-center justify-center relative z-10">
          <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{isBn ? status.titleBn : status.titleEn}</span>
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1 drop-shadow-sm">
            {status.countdown}
          </span>
        </div>

        {/* Sehri & Iftar Times Grid with 1-Click Alarm Button */}
        <div className="grid grid-cols-2 gap-2.5 text-xs relative z-10">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] text-emerald-200 block">সেহরির শেষ সময়:</span>
              <span className="text-base font-black font-mono text-white">ভোর {formatNumber(sehriTimeStr, lang)}</span>
            </div>
            <button
              type="button"
              onClick={toggleSehriAlarm}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                isSehriAlarmSet
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isSehriAlarmSet ? 'সেহরি অ্যালার্ম সক্রিয়' : 'অ্যালার্ম সেট করুন'}</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between gap-2">
            <div>
              <span className="text-[10px] text-emerald-200 block">ইফতারের সময়:</span>
              <span className="text-base font-black font-mono text-white">সন্ধ্যা {formatNumber(iftarTimeStr, lang)}</span>
            </div>
            <button
              type="button"
              onClick={toggleIftarAlarm}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                isIftarAlarmSet
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isIftarAlarmSet ? 'ইফতার অ্যালার্ম সক্রিয়' : 'অ্যালার্ম সেট করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authentic Ramadan Duas Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500" />
          রোজার নিয়ত ও ইফতারের মাসনূন দোয়া
        </h3>

        {/* 1. Sehri Niyyah */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
              ১. রোজার নিয়ত (Sehri Niyyah)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  speakBengali(
                    'নাওয়াইতু আন আসুমা গাদাম মিন শাহরি রমাদানাল মুবারাকি ফারদাল্লাকা ইয়া আল্লাহু, ফাতাকাব্বাল মিন্নি ইন্নাকা আনতাস সামিউল আলিম।'
                  )
                }
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-200/50 cursor-pointer"
                title="উচ্চারণ শুনুন"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'نَوَيْتُ اَنْ اُصُوْمَ غَدًا مِّنْ شَهْرِ رَمَضَانَ الْمُبَارَكِ فَرْضًا لَكَ يَا اللهُ فَتَقَبَّل مِنِّى اِنَّكَ اَنْتَ السَّمِيْعُ الْعَلِيْم\nউচ্চারণ: নাওয়াইতু আন আসুমা গাদাম মিন শাহরি রমাদানাল মুবারাকি ফারদাল্লাকা ইয়া আল্লাহু, ফাতাকাব্বাল মিন্নি ইন্নাকা আনতাস সামিউল আলিম।\nঅর্থ: হে আল্লাহ! আমি আগামীকাল পবিত্র রমজান মাসে তোমার সন্তুষ্টির উদ্দেশ্যে ফরজ রোজা রাখার নিয়ত করলাম। অতএব তুমি আমার রোজা কবুল কর। নিশ্চয়ই তুমি সর্বশ্রোতা ও সর্বজ্ঞ।',
                    'sehri'
                  )
                }
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-200/50 cursor-pointer text-xs flex items-center gap-1"
                title="কপি করুন"
              >
                {copiedDua === 'sehri' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-base sm:text-lg font-serif font-black text-right text-emerald-950 dark:text-emerald-200 py-1 leading-relaxed">
            نَوَيْتُ اَنْ اُصُوْمَ غَدًا مِّنْ شَهْرِ رَمَضَانَ الْمُبَارَكِ فَرْضًا لَكَ يَا اللهُ فَتَقَبَّل مِنِّى اِنَّكَ اَنْتَ السَّمِيْعُ الْعَلِيْم
          </p>
          <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              <strong>উচ্চারণ:</strong> নাওয়াইতু আন আসুমা গাদাম মিন শাহরি রমাদানাল মুবারাকি ফারদাল্লাকা ইয়া আল্লাহু, ফাতাকাব্বাল মিন্নি ইন্নাকা আনতাস সামিউল আলিম।
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>অর্থ:</strong> হে আল্লাহ! আমি আগামীকাল পবিত্র রমজান মাসে তোমার সন্তুষ্টির উদ্দেশ্যে ফরজ রোজা রাখার নিয়ত করলাম। অতএব তুমি আমার রোজা কবুল কর। নিশ্চয়ই তুমি সর্বশ্রোতা ও সর্বজ্ঞ।
            </p>
          </div>
        </div>

        {/* 2. Iftar Dua */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300">
              ২. ইফতারের দোয়া (Iftar Dua)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => speakBengali('আল্লাহুম্মা লাকা সুমতু ওয়া আলা রিযক্বিকা আফতারতু।')}
                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-200/50 cursor-pointer"
                title="উচ্চারণ শুনুন"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'اَللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ اَفْطَرْتُ\nউচ্চারণ: আল্লাহুম্মা লাকা সুমতু ওয়া আলা রিযক্বিকা আফতারতু।\nঅর্থ: হে আল্লাহ! আমি তোমার সন্তুষ্টির জন্যই রোজা রেখেছি এবং তোমার দেয়া রিজিক দ্বারাই ইফতার করছি।',
                    'iftar'
                  )
                }
                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-200/50 cursor-pointer text-xs flex items-center gap-1"
                title="কপি করুন"
              >
                {copiedDua === 'iftar' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-base sm:text-lg font-serif font-black text-right text-amber-950 dark:text-amber-200 py-1 leading-relaxed">
            اَللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ اَفْطَرْتُ
          </p>
          <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              <strong>উচ্চারণ:</strong> আল্লাহুম্মা লাকা সুমতু ওয়া আলা রিযক্বিকা আফতারতু।
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>অর্থ:</strong> হে আল্লাহ! আমি তোমার সন্তুষ্টির জন্যই রোজা রেখেছি এবং তোমার দেয়া রিজিক দ্বারাই ইফতার করছি।
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Ramadan Schedule Accordion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowFullSchedule(!showFullSchedule)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                ৩০ দিনের পূর্ণাঙ্গ রমজান সেহরি ও ইফতার ক্যালেন্ডার
              </h4>
              <p className="text-[10px] text-slate-500">
                {locationTitle} অনুযায়ী ১ থেকে ৩০ রমজানের সময়সূচী
              </p>
            </div>
          </div>
          {showFullSchedule ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showFullSchedule && (
          <div className="pt-2 flex flex-col gap-3 animate-fadeIn">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="p-2.5">রমজান</th>
                    <th className="p-2.5 text-center">সেহরির শেষ সময়</th>
                    <th className="p-2.5 text-right">ইফতারের সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ramadanDays.map((row) => (
                    <tr key={row.ramadanDay} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {formatNumber(row.ramadanDay, lang)} রমজান
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(row.sehri, lang)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatNumber(row.iftar, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
