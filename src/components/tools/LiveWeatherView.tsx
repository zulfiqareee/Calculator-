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
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import { requestLocationPermission } from '../../utils/permissionManager';

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
  const [isUsingGps, setIsUsingGps] = useState<boolean>(() => {
    return !!localStorage.getItem('user_gps_coords');
  });
  const [gpsLocationName, setGpsLocationName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).name || 'বর্তমান লাইভ অবস্থান (Live GPS)' : '';
    } catch {
      return '';
    }
  });

  const [currentLat, setCurrentLat] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).lat : POPULAR_CITIES[0].lat;
    } catch {
      return POPULAR_CITIES[0].lat;
    }
  });

  const [currentLon, setCurrentLon] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_gps_coords');
      return saved ? JSON.parse(saved).lon : POPULAR_CITIES[0].lon;
    } catch {
      return POPULAR_CITIES[0].lon;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  const isBn = lang === 'bn';

  // WMO Code interpretation
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

  // Fetch Weather API from Open-Meteo
  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(isBn ? 'আবহাওয়া ডেটা লোড হতে সমস্যা হয়েছে।' : 'Failed to fetch weather.');
      const data = await res.json();
      setWeatherData(data);

      // Cache for home widget
      try {
        if (data.current) {
          const homePayload = {
            temp: Math.round(data.current.temperature_2m),
            apparentTemp: Math.round(data.current.apparent_temperature),
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            locationName: isUsingGps ? gpsLocationName || 'লাইভ জিপিএস অবস্থান' : selectedCity.nameBn,
            isGps: isUsingGps,
            timeStr: new Date().toLocaleTimeString(),
          };
          localStorage.setItem('cached_home_weather', JSON.stringify(homePayload));
        }
      } catch (e) {
        console.warn('Failed to cache weather:', e);
      }
    } catch (err: any) {
      setError(err?.message || (isBn ? 'নেটওয়ার্ক সংযোগ চেক করুন।' : 'Network error.'));
    } finally {
      setLoading(false);
    }
  };

  // Load weather on mount
  useEffect(() => {
    fetchWeather(currentLat, currentLon);
  }, []);

  const handleCityChange = (city: CityOption) => {
    setSelectedCity(city);
    setIsUsingGps(false);
    setCurrentLat(city.lat);
    setCurrentLon(city.lon);
    fetchWeather(city.lat, city.lon);
  };

  // Handle Explicit GPS Request
  const handleUseGps = async () => {
    setGpsLoading(true);
    setGpsNotice(null);
    try {
      const coords = await requestLocationPermission();
      setIsUsingGps(true);
      setCurrentLat(coords.lat);
      setCurrentLon(coords.lon);

      // Identify nearest city or formatted coords
      let locLabel = `GPS (${coords.lat.toFixed(2)}° N, ${coords.lon.toFixed(2)}° E)`;
      setGpsLocationName(locLabel);

      localStorage.setItem(
        'user_gps_coords',
        JSON.stringify({ lat: coords.lat, lon: coords.lon, name: locLabel })
      );

      setGpsNotice(isBn ? 'সঠিক জিপিএস অবস্থান শনাক্ত করা হয়েছে!' : 'Accurate GPS location detected!');
      fetchWeather(coords.lat, coords.lon);
    } catch (err: any) {
      setGpsNotice(err.message || (isBn ? 'লোকেশন পারমিশন পাওয়া যায়নি।' : 'Location permission not granted.'));
    } finally {
      setGpsLoading(false);
      setTimeout(() => setGpsNotice(null), 4000);
    }
  };

  const currentW = weatherData?.current;
  const dailyW = weatherData?.daily;
  const currentInfo = currentW ? getWeatherInfo(currentW.weather_code) : null;
  const CurrentIcon = currentInfo ? currentInfo.icon : Sun;

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-6">
      {/* GPS Location Prompt Banner if not using GPS */}
      {!isUsingGps && (
        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B63F6] text-white flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isBn ? 'সঠিক আবহাওয়ার জন্য জিপিএস পারমিশন' : 'GPS Permission for Accurate Weather'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'আপনার এলাকার লাইভ রিয়েল-টাইম আবহাওয়া দেখতে পারমিশন দিন।'
                  : 'Allow GPS location for your exact local neighborhood forecast.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="px-3 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shrink-0 transition disabled:opacity-50"
          >
            {gpsLoading ? (isBn ? 'যাচাই হচ্ছে...' : 'Locating...') : (isBn ? 'অনুমতি দিন' : 'Allow')}
          </button>
        </div>
      )}

      {/* GPS Status Toast */}
      {gpsNotice && (
        <div className="p-3 rounded-2xl bg-blue-600 text-white text-xs font-bold text-center animate-fade-in shadow-xs">
          {gpsNotice}
        </div>
      )}

      {/* Top Location Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
            <MapPin className="w-4 h-4 text-[#0B63F6]" />
            <span>{isBn ? 'স্থান নির্বাচন:' : 'Location:'}</span>
          </div>
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs ${
              isUsingGps
                ? 'bg-[#0B63F6] text-white shadow-xs'
                : 'bg-blue-50 dark:bg-slate-800 text-[#0B63F6] hover:bg-blue-100'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{isUsingGps ? (isBn ? 'জিপিএস সক্রিয় (GPS On)' : 'GPS Active') : (isBn ? 'জিপিএস অটো (GPS)' : 'Auto GPS')}</span>
          </button>
        </div>

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
          {isUsingGps && (
            <option value="gps">
              {gpsLocationName || (isBn ? 'আপনার বর্তমান লাইভ অবস্থান (Live GPS)' : 'Your Live GPS Location')}
            </option>
          )}
          {POPULAR_CITIES.map((city) => (
            <option key={city.nameEn} value={city.nameEn}>
              {isBn ? city.nameBn : city.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-sky-500 via-[#0B63F6] to-blue-700 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {isUsingGps
                  ? gpsLocationName || (isBn ? 'বর্তমান জিপিএস অবস্থান' : 'Live GPS')
                  : isBn
                  ? selectedCity.nameBn
                  : selectedCity.nameEn}
              </span>
            </span>
            <span className="text-xs text-blue-100/80 block mt-0.5">
              {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <button
            onClick={() => fetchWeather(currentLat, currentLon)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-white mb-2" />
            <span className="text-xs font-bold text-white/90">
              {isBn ? 'আবহাওয়া লোড হচ্ছে...' : 'Loading weather...'}
            </span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-white/90 bg-red-500/20 rounded-2xl p-4 border border-red-300/30">
            {error}
          </div>
        ) : currentW ? (
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black tracking-tight font-mono">
                  {formatNumber(Math.round(currentW.temperature_2m), lang)}°
                  <span className="text-2xl font-sans font-bold">C</span>
                </h2>
                <span className="text-xs text-blue-100 font-bold block mt-1">
                  {isBn ? 'অনুভূত হচ্ছে:' : 'Feels like:'} {formatNumber(Math.round(currentW.apparent_temperature), lang)}°C
                </span>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <CurrentIcon className="w-12 h-12 text-amber-300 drop-shadow-md" />
              </div>
            </div>

            <div className="p-3 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-white">{isBn ? currentInfo?.labelBn : currentInfo?.labelEn}</span>
              <span className="text-blue-200 text-[11px]">
                {currentW.is_day ? (isBn ? '☀️ দিবাভাগ' : 'Day') : (isBn ? '🌙 রাত্রিভাগ' : 'Night')}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-cyan-200" />
                <span className="text-[10px] text-blue-100 block">{isBn ? 'আর্দ্রতা' : 'Humidity'}</span>
                <span className="font-bold font-mono">{formatNumber(currentW.relative_humidity_2m, lang)}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Wind className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                <span className="text-[10px] text-blue-100 block">{isBn ? 'বাতাসের গতি' : 'Wind'}</span>
                <span className="font-bold font-mono">
                  {formatNumber(Math.round(currentW.wind_speed_10m), lang)} {isBn ? 'কিমি/ঘ' : 'km/h'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <CloudRain className="w-4 h-4 mx-auto mb-1 text-indigo-200" />
                <span className="text-[10px] text-blue-100 block">{isBn ? 'বৃষ্টিপাত' : 'Precip.'}</span>
                <span className="font-bold font-mono">{formatNumber(currentW.precipitation, lang)} {isBn ? 'মিমি' : 'mm'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 7-Day Forecast */}
      {dailyW && dailyW.time && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
          <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0B63F6]" />
            <span>{isBn ? 'আগামী ৭ দিনের আবহাওয়া পূর্বাভাস:' : '7-Day Forecast:'}</span>
          </h3>

          <div className="flex flex-col gap-2">
            {dailyW.time.map((dateStr: string, idx: number) => {
              const code = dailyW.weather_code[idx];
              const info = getWeatherInfo(code);
              const DayIcon = info.icon;
              const maxT = Math.round(dailyW.temperature_2m_max[idx]);
              const minT = Math.round(dailyW.temperature_2m_min[idx]);
              const dateObj = new Date(dateStr);
              const dayName =
                idx === 0
                  ? isBn ? 'আজ' : 'Today'
                  : dateObj.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' });

              return (
                <div
                  key={dateStr}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <DayIcon className={`w-5 h-5 ${info.color}`} />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">{dayName}</span>
                      <span className="text-[10px] text-slate-400">{isBn ? info.labelBn : info.labelEn}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold">
                    <span className="text-slate-800 dark:text-white">{formatNumber(maxT, lang)}°</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">/ {formatNumber(minT, lang)}°C</span>
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
