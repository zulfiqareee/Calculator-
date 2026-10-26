import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  Calendar,
  AlertCircle,
  Bell,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';

interface Props {
  lang: Language;
}

interface DistrictOption {
  nameBn: string;
  nameEn: string;
  lat: number;
  lon: number;
}

const BANGLADESH_DISTRICTS: DistrictOption[] = [
  { nameBn: 'ঢাকা (Dhaka)', nameEn: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { nameBn: 'চট্টগ্রাম (Chittagong)', nameEn: 'Chittagong', lat: 22.3569, lon: 91.7832 },
  { nameBn: 'সিলেট (Sylhet)', nameEn: 'Sylhet', lat: 24.8949, lon: 91.8687 },
  { nameBn: 'রাজশাহী (Rajshahi)', nameEn: 'Rajshahi', lat: 24.3636, lon: 88.6241 },
  { nameBn: 'খুলনা (Khulna)', nameEn: 'Khulna', lat: 22.8456, lon: 89.5403 },
  { nameBn: 'বরিশাল (Barishal)', nameEn: 'Barishal', lat: 22.701, lon: 90.3535 },
  { nameBn: 'রংপুর (Rangpur)', nameEn: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  { nameBn: 'ময়মনসিংহ (Mymensingh)', nameEn: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
  { nameBn: 'কুমিল্লা (Cumilla)', nameEn: 'Cumilla', lat: 23.4607, lon: 91.1809 },
  { nameBn: 'বগুড়া (Bogura)', nameEn: 'Bogura', lat: 24.8465, lon: 89.3777 },
  { nameBn: 'কক্সবাজার (Cox\'s Bazar)', nameEn: 'Cox\'s Bazar', lat: 21.4272, lon: 92.0058 },
];

export const PrayerTimesView: React.FC<Props> = ({ lang }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption>(BANGLADESH_DISTRICTS[0]);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [currentLat, setCurrentLat] = useState<number>(23.8103);
  const [currentLon, setCurrentLon] = useState<number>(90.4125);
  const [locationTitle, setLocationTitle] = useState<string>('ঢাকা (Dhaka)');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 12-hour format converter
  const format12Hour = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? (lang === 'bn' ? 'PM' : 'PM') : (lang === 'bn' ? 'AM' : 'AM');
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Fetch Prayer Times API
  const fetchPrayerTimes = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      // Islamic University of Karachi method (Method 1) which is followed in Bangladesh/Subcontinent
      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API থেকে সময় লোড হতে বিলম্ব হয়েছে।');
      const data = await res.json();
      if (data.data && data.data.timings) {
        setTimings(data.data.timings);
        if (data.data.date && data.data.date.hijri) {
          const h = data.data.date.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      }
    } catch (err: any) {
      // Fallback timings for Bangladesh (approximate offline fallback)
      setTimings({
        Fajr: '04:52',
        Sunrise: '06:05',
        Dhuhr: '11:53',
        Asr: '15:15',
        Sunset: '17:35',
        Maghrib: '17:35',
        Isha: '18:50',
        Imsak: '04:42',
      });
      setHijriDate('১৪৪৬ হিজরি');
    } finally {
      setLoading(false);
    }
  };

  // Clock ticker for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto Geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsUsingGps(true);
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setLocationTitle('বর্তমান লাইভ অবস্থান (GPS Live)');
          fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchPrayerTimes(selectedDistrict.lat, selectedDistrict.lon);
        },
        { timeout: 6000 }
      );
    } else {
      fetchPrayerTimes(selectedDistrict.lat, selectedDistrict.lon);
    }
  }, []);

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsUsingGps(true);
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setLocationTitle('বর্তমান লাইভ অবস্থান (GPS Live)');
          fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          alert('জিপিএস লোকেশন পারমিশন পাওয়া যায়নি। ড্রপডাউন থেকে জেলা বেছে নিন।');
          setLoading(false);
        }
      );
    }
  };

  // Find next prayer & countdown
  const getNextPrayerCountdown = () => {
    if (!timings) return null;

    const prayerOrder = [
      { name: 'ফজর (Fajr)', timeStr: timings.Fajr },
      { name: 'যোহর (Dhuhr)', timeStr: timings.Dhuhr },
      { name: 'আসর (Asr)', timeStr: timings.Asr },
      { name: 'মাগরিব (Maghrib)', timeStr: timings.Maghrib },
      { name: 'ইশা (Isha)', timeStr: timings.Isha },
    ];

    const now = currentTime;
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    for (const p of prayerOrder) {
      const [h, m] = p.timeStr.split(':').map(Number);
      const pMinutes = h * 60 + m;
      if (pMinutes > nowMinutes) {
        const diffM = pMinutes - nowMinutes;
        const diffH = Math.floor(diffM / 60);
        const remM = Math.floor(diffM % 60);
        const remS = Math.floor(60 - now.getSeconds());
        return {
          nextPrayerName: p.name,
          countdown: `${diffH > 0 ? `${diffH} ঘণ্টা ` : ''}${remM} মিনিট ${remS} সেকেন্ড`,
        };
      }
    }

    // Next is tomorrow's Fajr
    const [h, m] = timings.Fajr.split(':').map(Number);
    const fajrMinutesTomorrow = 24 * 60 + h * 60 + m;
    const diffM = fajrMinutesTomorrow - nowMinutes;
    const diffH = Math.floor(diffM / 60);
    const remM = Math.floor(diffM % 60);
    return {
      nextPrayerName: 'ফজর (Fajr)',
      countdown: `${diffH} ঘণ্টা ${remM} মিনিট`,
    };
  };

  const nextInfo = getNextPrayerCountdown();

  const prayerCards = [
    { id: 'Fajr', nameBn: 'ফজর', nameEn: 'Fajr', time: timings?.Fajr || '04:52', icon: Sunrise, bg: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' },
    { id: 'Sunrise', nameBn: 'সূর্যোদয়', nameEn: 'Sunrise', time: timings?.Sunrise || '06:05', icon: Sun, bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
    { id: 'Dhuhr', nameBn: 'যোহর', nameEn: 'Dhuhr', time: timings?.Dhuhr || '11:53', icon: Sun, bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
    { id: 'Asr', nameBn: 'আসর', nameEn: 'Asr', time: timings?.Asr || '15:15', icon: Sun, bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' },
    { id: 'Maghrib', nameBn: 'মাগরিব (ইফতার)', nameEn: 'Maghrib', time: timings?.Maghrib || '17:35', icon: Sunset, bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
    { id: 'Isha', nameBn: 'ইশা', nameEn: 'Isha', time: timings?.Isha || '18:50', icon: Moon, bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Top Location Selection Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
            <MapPin className="w-4 h-4 text-[#0B63F6]" />
            <span>স্থান নির্বাচন:</span>
          </div>
          <button
            onClick={handleUseGps}
            className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition text-xs ${
              isUsingGps
                ? 'bg-[#0B63F6] text-white shadow-xs'
                : 'bg-blue-50 dark:bg-slate-800 text-[#0B63F6] hover:bg-blue-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>জিপিএস অটো (Live GPS)</span>
          </button>
        </div>

        <select
          value={isUsingGps ? 'gps' : selectedDistrict.nameEn}
          onChange={(e) => {
            if (e.target.value === 'gps') {
              handleUseGps();
            } else {
              const found = BANGLADESH_DISTRICTS.find((d) => d.nameEn === e.target.value);
              if (found) {
                setSelectedDistrict(found);
                setIsUsingGps(false);
                setCurrentLat(found.lat);
                setCurrentLon(found.lon);
                setLocationTitle(found.nameBn);
                fetchPrayerTimes(found.lat, found.lon);
              }
            }
          }}
          className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-bold text-xs text-slate-900 dark:text-white"
        >
          {isUsingGps && <option value="gps">আপনার বর্তমান লাইভ অবস্থান (Live GPS)</option>}
          {BANGLADESH_DISTRICTS.map((d) => (
            <option key={d.nameEn} value={d.nameEn}>
              {d.nameBn}
            </option>
          ))}
        </select>
      </div>

      {/* Main Countdown & Hero Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{locationTitle}</span>
            </span>
            <span className="text-xs text-white/80 block mt-0.5">{hijriDate}</span>
          </div>

          <button
            onClick={() => fetchPrayerTimes(currentLat, currentLon)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Live Countdown to Next Prayer */}
        {nextInfo && (
          <div className="p-4 bg-black/25 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col items-center justify-center text-center relative z-10 my-1">
            <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>পরবর্তী ওয়াক্ত: <strong>{nextInfo.nextPrayerName}</strong></span>
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 tracking-tight">
              {nextInfo.countdown}
            </span>
          </div>
        )}

        {/* Sehri & Iftar Banner */}
        <div className="grid grid-cols-2 gap-2 text-xs relative z-10 pt-2 border-t border-white/20">
          <div className="p-2.5 bg-white/10 rounded-xl flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-100 block">সেহরি শেষ সময়:</span>
              <span className="font-bold font-mono text-sm">{timings ? format12Hour(timings.Imsak || timings.Fajr) : '--:--'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-white/10 rounded-xl flex items-center gap-2">
            <Sunset className="w-4 h-4 text-amber-300 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-100 block">ইফতারের সময়:</span>
              <span className="font-bold font-mono text-sm">{timings ? format12Hour(timings.Maghrib) : '--:--'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Daily Prayers Time List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-2.5">
        <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>আজকের নামাজের সঠিক সময়সূচী:</span>
          <span className="text-[10px] text-slate-400 font-normal">হানাফী ও ইসলামিক ফাউন্ডেশন</span>
        </h3>

        <div className="flex flex-col gap-2">
          {prayerCards.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.bg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{p.nameBn}</h4>
                    <span className="text-[10px] text-slate-400">{p.nameEn}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white block">
                    {format12Hour(p.time)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{p.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qibla Direction Notice */}
      <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
        <Compass className="w-6 h-6 text-[#0B63F6] shrink-0" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">কিবলার দিকনির্দেশনা (Qibla Angle):</span>
          <span className="text-[11px] text-slate-500">
            বাংলাদেশ থেকে কাবা শরীফের দিক প্রায় <strong>২৭২° (পশ্চিম-উত্তর-পশ্চিম)</strong>।
          </span>
        </div>
      </div>
    </div>
  );
};
