import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  RefreshCw,
  Compass,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';

interface Props {
  lang: Language;
}

interface CityOption {
  nameBn: string;
  nameEn: string;
  lat: number;
  lon: number;
}

const POPULAR_CITIES: CityOption[] = [
  { nameBn: 'ঢাকা (Dhaka)', nameEn: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { nameBn: 'চট্টগ্রাম (Chittagong)', nameEn: 'Chittagong', lat: 22.3569, lon: 91.7832 },
  { nameBn: 'সিলেট (Sylhet)', nameEn: 'Sylhet', lat: 24.8949, lon: 91.8687 },
  { nameBn: 'রাজশাহী (Rajshahi)', nameEn: 'Rajshahi', lat: 24.3636, lon: 88.6241 },
  { nameBn: 'খুলনা (Khulna)', nameEn: 'Khulna', lat: 22.8456, lon: 89.5403 },
  { nameBn: 'বরিশাল (Barishal)', nameEn: 'Barishal', lat: 22.701, lon: 90.3535 },
  { nameBn: 'রংপুর (Rangpur)', nameEn: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  { nameBn: 'ময়মনসিংহ (Mymensingh)', nameEn: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
  { nameBn: 'কক্সবাজার (Cox\'s Bazar)', nameEn: 'Cox\'s Bazar', lat: 21.4272, lon: 92.0058 },
  { nameBn: 'বগুড়া (Bogura)', nameEn: 'Bogura', lat: 24.8465, lon: 89.3777 },
  { nameBn: 'কুমিল্লা (Cumilla)', nameEn: 'Cumilla', lat: 23.4607, lon: 91.1809 },
];

export const LiveWeatherView: React.FC<Props> = ({ lang }) => {
  const [selectedCity, setSelectedCity] = useState<CityOption>(POPULAR_CITIES[0]);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [gpsLocationName, setGpsLocationName] = useState<string>('');
  const [currentLat, setCurrentLat] = useState<number>(23.8103);
  const [currentLon, setCurrentLon] = useState<number>(90.4125);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  // WMO Code interpretation in Bengali & English
  const getWeatherInfo = (code: number) => {
    switch (code) {
      case 0:
        return { labelBn: 'পরিষ্কার রৌদ্রোজ্জ্বল আকাশ', labelEn: 'Clear Sky', icon: Sun, color: 'text-amber-500' };
      case 1:
      case 2:
      case 3:
        return { labelBn: 'আংশিক মেঘলা আকাশ', labelEn: 'Partly Cloudy', icon: Cloud, color: 'text-blue-400' };
      case 45:
      case 48:
        return { labelBn: 'কুয়াশাচ্ছন্ন আবহাওয়া', labelEn: 'Foggy', icon: Cloud, color: 'text-slate-400' };
      case 51:
      case 53:
      case 55:
        return { labelBn: 'গুঁড়ি গুঁড়ি বৃষ্টি', labelEn: 'Light Drizzle', icon: CloudRain, color: 'text-cyan-400' };
      case 61:
      case 63:
      case 65:
        return { labelBn: 'মাঝারি থেকে ভারী বৃষ্টিপাত', labelEn: 'Rain Showers', icon: CloudRain, color: 'text-blue-500' };
      case 80:
      case 81:
      case 82:
        return { labelBn: 'দমকা হাওয়াসহ বৃষ্টি', labelEn: 'Heavy Showers', icon: CloudRain, color: 'text-indigo-500' };
      case 95:
      case 96:
      case 99:
        return { labelBn: 'বজ্রবৃষ্টি ও ঝড়ো হাওয়া', labelEn: 'Thunderstorm', icon: CloudLightning, color: 'text-amber-400' };
      default:
        return { labelBn: 'স্বাভাবিক আবহাওয়া', labelEn: 'Fair Weather', icon: Sun, color: 'text-amber-400' };
    }
  };

  // Fetch Weather API
  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('আবহাওয়া ডেটা লোড হতে সমস্যা হয়েছে।');
      const data = await res.json();
      setWeatherData(data);
    } catch (err: any) {
      setError(err?.message || 'নেটওয়ার্ক সংযোগ চেক করুন।');
    } finally {
      setLoading(false);
    }
  };

  // Auto Geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsUsingGps(true);
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setGpsLocationName('আপনার বর্তমান জিপিএস অবস্থান (Live GPS)');
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to default city
          fetchWeather(selectedCity.lat, selectedCity.lon);
        },
        { timeout: 7000 }
      );
    } else {
      fetchWeather(selectedCity.lat, selectedCity.lon);
    }
  }, []);

  const handleCityChange = (city: CityOption) => {
    setSelectedCity(city);
    setIsUsingGps(false);
    setCurrentLat(city.lat);
    setCurrentLon(city.lon);
    fetchWeather(city.lat, city.lon);
  };

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsUsingGps(true);
          setCurrentLat(pos.coords.latitude);
          setCurrentLon(pos.coords.longitude);
          setGpsLocationName('আপনার বর্তমান জিপিএস অবস্থান (Live GPS)');
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          alert('লোকেশন পারমিশন পাওয়া যায়নি। ড্রপডাউন থেকে শহর সিলেক্ট করুন।');
          setLoading(false);
        }
      );
    }
  };

  const currentW = weatherData?.current;
  const dailyW = weatherData?.daily;
  const currentInfo = currentW ? getWeatherInfo(currentW.weather_code) : null;
  const CurrentIcon = currentInfo ? currentInfo.icon : Sun;

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Top Location Bar */}
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
            <span>জিপিএস অটো (GPS)</span>
          </button>
        </div>

        {/* City Select Dropdown */}
        <select
          value={isUsingGps ? 'gps' : selectedCity.nameEn}
          onChange={(e) => {
            if (e.target.value === 'gps') {
              handleUseGps();
            } else {
              const found = POPULAR_CITIES.find((c) => c.nameEn === e.target.value);
              if (found) handleCityChange(found);
            }
          }}
          className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-bold text-xs text-slate-900 dark:text-white"
        >
          {isUsingGps && <option value="gps">{gpsLocationName}</option>}
          {POPULAR_CITIES.map((c) => (
            <option key={c.nameEn} value={c.nameEn}>
              {c.nameBn}
            </option>
          ))}
        </select>
      </div>

      {/* Main Weather Card */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-[#0B63F6] animate-spin" />
          <span className="text-xs font-bold text-slate-500">লাইভ আবহাওয়া তথ্য লোড হচ্ছে...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-rose-500 flex flex-col items-center text-center gap-2">
          <AlertCircle className="w-6 h-6" />
          <span className="text-xs font-bold">{error}</span>
          <button
            onClick={() => fetchWeather(currentLat, currentLon)}
            className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold mt-2"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : currentW && currentInfo ? (
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Location Title & Refresh */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{isUsingGps ? 'লাইভ জিপিএস লোকেশন' : selectedCity.nameBn}</span>
              </span>
              <h2 className="text-sm font-semibold text-white/90 mt-0.5">
                {currentInfo.labelBn}
              </h2>
            </div>
            <button
              onClick={() => fetchWeather(currentLat, currentLon)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Big Temp & Icon */}
          <div className="flex items-center justify-between my-1 relative z-10">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight">
                  {Math.round(currentW.temperature_2m)}
                </span>
                <span className="text-2xl font-bold font-sans text-blue-200">°C</span>
              </div>
              <span className="text-xs text-blue-100 font-medium mt-1 block">
                অনুভূত তাপমাত্রা: {Math.round(currentW.apparent_temperature)}°C
              </span>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <CurrentIcon className="w-12 h-12 text-amber-300 drop-shadow-md" />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs relative z-10 pt-2 border-t border-white/20">
            <div className="p-2.5 rounded-2xl bg-white/10 flex flex-col items-center text-center">
              <Droplets className="w-4 h-4 text-cyan-300 mb-1" />
              <span className="text-[10px] text-blue-100 font-semibold">আর্দ্রতা</span>
              <span className="text-sm font-bold font-mono mt-0.5">{currentW.relative_humidity_2m}%</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/10 flex flex-col items-center text-center">
              <Wind className="w-4 h-4 text-emerald-300 mb-1" />
              <span className="text-[10px] text-blue-100 font-semibold">বাতাস</span>
              <span className="text-sm font-bold font-mono mt-0.5">{Math.round(currentW.wind_speed_10m)} km/h</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/10 flex flex-col items-center text-center">
              <CloudRain className="w-4 h-4 text-blue-300 mb-1" />
              <span className="text-[10px] text-blue-100 font-semibold">বৃষ্টিপাত</span>
              <span className="text-sm font-bold font-mono mt-0.5">{currentW.precipitation} mm</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 7-Day Forecast */}
      {dailyW && dailyW.time && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-[#0B63F6]" />
            <span>পরবর্তী ৭ দিনের আবহাওয়া পূর্বাভাস (7-Day Forecast):</span>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {dailyW.time.slice(0, 7).map((dateStr: string, idx: number) => {
              const code = dailyW.weather_code[idx];
              const info = getWeatherInfo(code);
              const DayIcon = info.icon;
              const dateObj = new Date(dateStr);
              const dayName =
                idx === 0
                  ? 'আজ'
                  : dateObj.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                      weekday: 'short',
                    });

              return (
                <div key={dateStr} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="w-16 font-bold text-slate-800 dark:text-slate-200">{dayName}</span>

                  <div className="flex items-center gap-2">
                    <DayIcon className={`w-4 h-4 ${info.color}`} />
                    <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[120px]">
                      {info.labelBn}
                    </span>
                  </div>

                  <div className="text-right font-mono font-bold text-xs">
                    <span className="text-slate-900 dark:text-white">{Math.round(dailyW.temperature_2m_max[idx])}°</span>
                    <span className="text-slate-400 font-normal ml-1.5">{Math.round(dailyW.temperature_2m_min[idx])}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
