import React, { useState, useEffect } from 'react';
import {
  Compass as CompassIcon,
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
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import { requestLocationPermission } from '../../utils/permissionManager';
import { calculateQiblaAngle } from './CompassTool';

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
  const [activeTab, setActiveTab] = useState<'timings' | 'qibla'>('timings');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption>(BANGLADESH_DISTRICTS[0]);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(() => !!localStorage.getItem('user_gps_coords'));

  const [currentLat, setCurrentLat] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).lat : BANGLADESH_DISTRICTS[0].lat;
    } catch {
      return BANGLADESH_DISTRICTS[0].lat;
    }
  });

  const [currentLon, setCurrentLon] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).lon : BANGLADESH_DISTRICTS[0].lon;
    } catch {
      return BANGLADESH_DISTRICTS[0].lon;
    }
  });

  const [locationTitle, setLocationTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).name || 'বর্তমান লাইভ অবস্থান (Live GPS)' : 'ঢাকা (Dhaka)';
    } catch {
      return 'ঢাকা (Dhaka)';
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, string> | null>(null);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Compass Heading State for Qibla
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualHeading, setIsManualHeading] = useState<boolean>(false);

  const isBn = lang === 'bn';
  const qiblaAngle = Math.round(calculateQiblaAngle(currentLat, currentLon));
  const activeHeading = isManualHeading ? manualHeading : deviceHeading;
  const qiblaDiff = Math.abs(activeHeading - qiblaAngle);
  const isFacingQibla = qiblaDiff <= 4 || qiblaDiff >= 356;

  // 12-hour format converter
  const format12Hour = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Fetch Prayer Times API
  const fetchPrayerTimes = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API Timeout');
      const data = await res.json();
      if (data.data && data.data.timings) {
        setTimings(data.data.timings);
        if (data.data.date && data.data.date.hijri) {
          const h = data.data.date.hijri;
          setHijriDate(`${h.day} ${h.month.en} ${h.year} AH`);
        }
      }
    } catch {
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

  // Listen to mobile compass orientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let h: number | null = null;
      if ((e as any).webkitCompassHeading !== undefined) {
        h = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        h = 360 - e.alpha;
      }

      if (h !== null && !isNaN(h)) {
        setHasCompassSensor(true);
        const norm = Math.round((h + 360) % 360);
        setDeviceHeading(norm);

        // Haptic feedback when facing Qibla
        const diff = Math.abs(norm - qiblaAngle);
        if ((diff <= 3 || diff >= 357) && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [qiblaAngle]);

  // Load prayer times on mount
  useEffect(() => {
    fetchPrayerTimes(currentLat, currentLon);
  }, []);

  const handleUseGps = async () => {
    setGpsLoading(true);
    setGpsToast(null);
    try {
      const coords = await requestLocationPermission();
      setIsUsingGps(true);
      setCurrentLat(coords.lat);
      setCurrentLon(coords.lon);
      const locLabel = coords.locationName || `GPS: ${coords.lat.toFixed(2)}° N, ${coords.lon.toFixed(2)}° E`;
      setLocationTitle(locLabel);

      localStorage.setItem(
        'user_gps_coords',
        JSON.stringify({ lat: coords.lat, lon: coords.lon, name: locLabel })
      );

      setGpsToast(isBn ? 'সঠিক জিপিএস অবস্থান অনুযায়ী সময়সূচী হালনাগাদ হয়েছে!' : 'Location updated via GPS!');
      fetchPrayerTimes(coords.lat, coords.lon);
    } catch (err: any) {
      setGpsToast(err.message || (isBn ? 'জিপিএস অনুমতি পাওয়া যায়নি।' : 'GPS permission not granted.'));
    } finally {
      setGpsLoading(false);
      setTimeout(() => setGpsToast(null), 4000);
    }
  };

  // Find next prayer & countdown
  const getNextPrayerCountdown = () => {
    if (!timings) return null;

    const prayerOrder = [
      { name: isBn ? 'ফজর (Fajr)' : 'Fajr', timeStr: timings.Fajr },
      { name: isBn ? 'যোহর (Dhuhr)' : 'Dhuhr', timeStr: timings.Dhuhr },
      { name: isBn ? 'আসর (Asr)' : 'Asr', timeStr: timings.Asr },
      { name: isBn ? 'মাগরিব (Maghrib)' : 'Maghrib', timeStr: timings.Maghrib },
      { name: isBn ? 'ইশা (Isha)' : 'Isha', timeStr: timings.Isha },
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
          countdown: `${diffH > 0 ? `${formatNumber(diffH, lang)} ঘণ্টা ` : ''}${formatNumber(remM, lang)} মিনিট ${formatNumber(remS, lang)} সেকেন্ড`,
        };
      }
    }

    // Tomorrow's Fajr
    const [h, m] = timings.Fajr.split(':').map(Number);
    const fajrMinutesTomorrow = 24 * 60 + h * 60 + m;
    const diffM = fajrMinutesTomorrow - nowMinutes;
    const diffH = Math.floor(diffM / 60);
    const remM = Math.floor(diffM % 60);
    return {
      nextPrayerName: isBn ? 'ফজর (Fajr)' : 'Fajr',
      countdown: `${formatNumber(diffH, lang)} ঘণ্টা ${formatNumber(remM, lang)} মিনিট`,
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
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-6">
      {/* Top Segmented Navigation Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
        <button
          onClick={() => setActiveTab('timings')}
          className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'timings'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isBn ? 'নামাজের সময়সূচী' : 'Prayer Times'}</span>
        </button>

        <button
          onClick={() => setActiveTab('qibla')}
          className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'qibla'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>🕋</span>
          <span>{isBn ? 'কেবলা কম্পাস (Qibla)' : 'Qibla Compass'}</span>
        </button>
      </div>

      {/* GPS Status Toast */}
      {gpsToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in shadow-xs">
          {gpsToast}
        </div>
      )}

      {/* Top Location Selection Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'আপনার অবস্থান:' : 'Location:'}</span>
          </div>
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs ${
              isUsingGps
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CompassIcon className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{isUsingGps ? (isBn ? 'জিপিএস সক্রিয় (GPS On)' : 'GPS Active') : (isBn ? 'জিপিএস অটো (GPS)' : 'Auto GPS')}</span>
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
          {isUsingGps && (
            <option value="gps">
              {locationTitle || (isBn ? 'আপনার বর্তমান লাইভ অবস্থান (Live GPS)' : 'Live GPS Location')}
            </option>
          )}
          {BANGLADESH_DISTRICTS.map((d) => (
            <option key={d.nameEn} value={d.nameEn}>
              {isBn ? d.nameBn : d.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* =========================================================
          VIEW 1: TIMINGS TAB
         ========================================================= */}
      {activeTab === 'timings' && (
        <>
          {/* Main Countdown & Hero Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <CompassIcon className="w-3.5 h-3.5" />
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
                  <span>{isBn ? 'পরবর্তী ওয়াক্ত:' : 'Next Prayer:'} <strong>{nextInfo.nextPrayerName}</strong></span>
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                  {nextInfo.countdown}
                </span>
              </div>
            )}

            {/* Sehri & Iftar Times */}
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 grid grid-cols-2 text-center text-xs divide-x divide-white/20 relative z-10">
              <div>
                <span className="text-[10px] text-emerald-100 block">{isBn ? 'সেহরির শেষ সময়:' : 'Sehri Ends:'}</span>
                <span className="font-bold font-mono text-sm">{timings ? format12Hour(timings.Imsak || timings.Fajr) : '--:--'}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-100 block">{isBn ? 'ইফতারের সময়:' : 'Iftar Time:'}</span>
                <span className="font-bold font-mono text-sm">{timings ? format12Hour(timings.Maghrib) : '--:--'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button to Open Qibla Compass */}
          <button
            onClick={() => setActiveTab('qibla')}
            className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-500/30 flex items-center justify-between text-left hover:border-emerald-500 transition active:scale-98 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                🕋
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {isBn ? 'কেবলা দিক নির্দেশনা ও কম্পাস' : 'Qibla Direction & Compass'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn
                    ? `আপনার অবস্থান থেকে কেবলা কোণ: ${formatNumber(qiblaAngle, lang)}° (কম্পাস দিয়ে দিক দেখুন)`
                    : `Bearing to Kaaba: ${qiblaAngle}° from true North (Open Compass)`}
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0">
              {isBn ? 'কম্পাস খুলুন' : 'Open'}
            </span>
          </button>

          {/* 5 Daily Prayers Time List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-2.5">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{isBn ? 'আজকের নামাজের সঠিক সময়সূচী:' : 'Daily Prayer Schedule:'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{isBn ? 'হানাফী ও ইসলামিক ফাউন্ডেশন' : 'Karachi Method'}</span>
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
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {isBn ? p.nameBn : p.nameEn}
                        </h4>
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
        </>
      )}

      {/* =========================================================
          VIEW 2: QIBLA COMPASS TAB (Requested specifically by user)
         ========================================================= */}
      {activeTab === 'qibla' && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#071B35] to-[#112B48] text-white border border-[#153D55] text-center shadow-lg relative overflow-hidden">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 uppercase tracking-wider mb-1">
              <span>🕋</span>
              <span>{isBn ? 'কাবা শরীফের সরাসরি কেবলা কোণ' : 'Exact Bearing to Holy Kaaba'}</span>
            </span>

            <h2 className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight my-1">
              {formatNumber(qiblaAngle, lang)}°
            </h2>

            <p className="text-xs text-emerald-200 font-semibold">
              {isBn
                ? `আপনার বর্তমান অবস্থান (${locationTitle}) থেকে কেবলা প্রায় ${formatNumber(qiblaAngle, lang)}° পশ্চিম-দক্ষিণে`
                : `Qibla angle from your location is ${qiblaAngle}° West`}
            </p>

            {/* Alignment alert */}
            <div
              className={`mt-3 p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                isFacingQibla
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 animate-pulse'
                  : 'bg-black/30 border-white/10 text-slate-300'
              }`}
            >
              {isFacingQibla ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'আলহামদুলিল্লাহ! আপনি সরাসরি কেবলার মুখোমুখি আছেন।' : 'Facing Qibla directly!'}</span>
                </>
              ) : (
                <span>
                  {isBn
                    ? `ফোনটিকে ডানে বা বামে ঘুরিয়ে সবুজ সূচক বরাবর রাখুন (${formatNumber(Math.min(qiblaDiff, 360 - qiblaDiff), lang)}° বাকি)`
                    : `Rotate phone until needle aligns with green Kaaba marker`}
                </span>
              )}
            </div>
          </div>

          {/* Rotating Qibla Compass Dial */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center my-2">
            {/* Outer Glow Indicator */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isFacingQibla
                  ? 'ring-4 ring-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.5)]'
                  : 'ring-1 ring-slate-300 dark:ring-slate-800 shadow-md'
              }`}
            />

            {/* Rotating Disc */}
            <div
              className="relative w-full h-full rounded-full bg-slate-900 border-4 border-slate-800 shadow-inner overflow-hidden transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${-activeHeading}deg)` }}
            >
              {/* Ticks */}
              {Array.from({ length: 36 }).map((_, i) => {
                const deg = i * 10;
                return (
                  <div
                    key={deg}
                    className="absolute inset-0 flex justify-center"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div
                      className={`w-0.5 rounded-full ${
                        deg % 90 === 0 ? 'h-4 bg-amber-400' : 'h-2 bg-slate-600'
                      }`}
                    />
                  </div>
                );
              })}

              {/* Cardinals */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-rose-500 font-black text-sm">
                {isBn ? 'উ (N)' : 'N'}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">
                {isBn ? 'পূ (E)' : 'E'}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-300 font-bold text-sm">
                {isBn ? 'দ (S)' : 'S'}
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">
                {isBn ? 'প (W)' : 'W'}
              </div>

              {/* Kaaba Target Marker on Disc */}
              <div
                className="absolute inset-0 flex justify-center pointer-events-none"
                style={{ transform: `rotate(${qiblaAngle}deg)` }}
              >
                <div className="flex flex-col items-center pt-2">
                  <span className="text-2xl filter drop-shadow animate-bounce">🕋</span>
                  <div className="w-1.5 h-16 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>
              </div>

              {/* Center Pivot */}
              <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Top Red Needle (Current Device Heading) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-emerald-500 filter drop-shadow" />
            </div>
          </div>

          {/* Compass Sensor Info & Calibration */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'কম্পাস হেডিং সেন্সর:' : 'Heading Sensor:'}</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  hasCompassSensor
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}
              >
                {hasCompassSensor
                  ? (isBn ? 'ম্যাগনেটিক সেন্সর সচল' : 'Magnetic Sensor Active')
                  : (isBn ? 'ম্যানুয়াল কন্ট্রোল' : 'Manual Mode')}
              </span>
            </div>

            {/* Manual Slider if testing without magnetic sensor */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>{isBn ? 'দিক ঘোরানোর স্লাইডার:' : 'Rotation Slider:'}</span>
                <span className="font-mono font-bold text-emerald-600">{activeHeading}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={manualHeading}
                onChange={(e) => {
                  setIsManualHeading(true);
                  setManualHeading(Number(e.target.value));
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isBn
                ? 'নির্দেশনা: ফোনটি অনুভূমিকভাবে সমান করে ধরুন। যখন উপরের তীর চিহ্নটি সবুজ কাবা মার্কারের সাথে মিলে যাবে, তখন আপনার মুখ সরাসরি কাবা শরীফের দিকে থাকবে।'
                : 'Instructions: Hold phone flat. When top arrow aligns with the green Kaaba marker, you are facing Qibla.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
