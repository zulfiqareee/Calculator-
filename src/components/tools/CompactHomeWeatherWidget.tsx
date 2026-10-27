import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  ChevronRight,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';

interface Props {
  lang: Language;
  onOpenDetails: () => void;
}

interface QuickWeatherData {
  temp: number;
  apparentTemp: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  locationName: string;
  isGps: boolean;
  timeStr: string;
}

export const CompactHomeWeatherWidget: React.FC<Props> = ({ lang, onOpenDetails }) => {
  const [data, setData] = useState<QuickWeatherData | null>(() => {
    try {
      const cached = localStorage.getItem('cached_home_weather');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(!data);

  // WMO Code interpretation
  const getWeatherInfo = (code: number) => {
    switch (code) {
      case 0:
        return {
          labelBn: 'পরিষ্কার আকাশ',
          labelEn: 'Clear Sky',
          icon: Sun,
          textColor: 'text-amber-500',
          bgGradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
          borderAccent: 'border-amber-300 dark:border-amber-700/60',
        };
      case 1:
      case 2:
      case 3:
        return {
          labelBn: 'আংশিক মেঘলা',
          labelEn: 'Partly Cloudy',
          icon: Cloud,
          textColor: 'text-sky-500',
          bgGradient: 'from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20',
          borderAccent: 'border-sky-300 dark:border-sky-700/60',
        };
      case 45:
      case 48:
        return {
          labelBn: 'কুয়াশাচ্ছন্ন',
          labelEn: 'Foggy',
          icon: Cloud,
          textColor: 'text-slate-400',
          bgGradient: 'from-slate-500/10 to-gray-500/10 dark:from-slate-500/20 dark:to-gray-500/20',
          borderAccent: 'border-slate-300 dark:border-slate-700/60',
        };
      case 51:
      case 53:
      case 55:
        return {
          labelBn: 'গুঁড়ি গুঁড়ি বৃষ্টি',
          labelEn: 'Light Drizzle',
          icon: CloudRain,
          textColor: 'text-cyan-500',
          bgGradient: 'from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20',
          borderAccent: 'border-cyan-300 dark:border-cyan-700/60',
        };
      case 61:
      case 63:
      case 65:
        return {
          labelBn: 'বৃষ্টিপাত হচ্ছে',
          labelEn: 'Rain Showers',
          icon: CloudRain,
          textColor: 'text-blue-500',
          bgGradient: 'from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20',
          borderAccent: 'border-blue-300 dark:border-blue-700/60',
        };
      case 80:
      case 81:
      case 82:
        return {
          labelBn: 'ভারী বৃষ্টিপাত',
          labelEn: 'Heavy Showers',
          icon: CloudRain,
          textColor: 'text-indigo-500',
          bgGradient: 'from-indigo-600/10 to-purple-600/10 dark:from-indigo-600/20 dark:to-purple-600/20',
          borderAccent: 'border-indigo-300 dark:border-indigo-700/60',
        };
      case 95:
      case 96:
      case 99:
        return {
          labelBn: 'বজ্রঝড় ও বৃষ্টি',
          labelEn: 'Thunderstorm',
          icon: CloudLightning,
          textColor: 'text-amber-500',
          bgGradient: 'from-purple-600/10 to-amber-600/10 dark:from-purple-600/20 dark:to-amber-600/20',
          borderAccent: 'border-amber-400 dark:border-amber-600/60',
        };
      default:
        return {
          labelBn: 'স্বাভাবিক আবহাওয়া',
          labelEn: 'Fair Weather',
          icon: Sun,
          textColor: 'text-amber-500',
          bgGradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
          borderAccent: 'border-blue-300 dark:border-blue-700/60',
        };
    }
  };

  const fetchWeather = async (lat: number, lon: number, locName: string, isGps: boolean) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const current = json.current;
      if (current) {
        const item: QuickWeatherData = {
          temp: Math.round(current.temperature_2m),
          apparentTemp: Math.round(current.apparent_temperature ?? current.temperature_2m),
          weatherCode: current.weather_code,
          humidity: Math.round(current.relative_humidity_2m ?? 0),
          windSpeed: Math.round(current.wind_speed_10m ?? 0),
          locationName: locName,
          isGps,
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setData(item);
        try {
          localStorage.setItem('cached_home_weather', JSON.stringify(item));
        } catch {}
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            lang === 'bn' ? 'বর্তমান জিপিএস অবস্থান' : 'Current GPS Location',
            true
          );
        },
        () => {
          // Default Dhaka
          fetchWeather(23.8103, 90.4125, lang === 'bn' ? 'ঢাকা (Dhaka)' : 'Dhaka, Bangladesh', false);
        },
        { timeout: 6000 }
      );
    } else {
      fetchWeather(23.8103, 90.4125, lang === 'bn' ? 'ঢাকা (Dhaka)' : 'Dhaka, Bangladesh', false);
    }
  }, [lang]);

  const info = getWeatherInfo(data?.weatherCode ?? 0);
  const IconComponent = info.icon;

  return (
    <div
      onClick={onOpenDetails}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${info.bgGradient} bg-white dark:bg-slate-900 ${info.borderAccent} p-3.5 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.99]`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Location & Weather info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60`}>
            {loading && !data ? (
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <IconComponent className={`w-7 h-7 ${info.textColor}`} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <MapPin className="w-3 h-3 text-[#0B63F6] shrink-0" />
              <span className="truncate">
                {data?.locationName || (lang === 'bn' ? 'লোকেশন লোড হচ্ছে...' : 'Locating...')}
              </span>
              {data?.isGps && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  GPS
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {data ? `${formatNumber(data.temp, lang)}°C` : '--°C'}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {lang === 'bn' ? info.labelBn : info.labelEn}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-500" />
                {lang === 'bn' ? 'আর্দ্রতা' : 'Hum'}: {data ? `${formatNumber(data.humidity, lang)}%` : '--'}
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-blue-400" />
                {lang === 'bn' ? 'বাতাস' : 'Wind'}: {data ? `${formatNumber(data.windSpeed, lang)} km/h` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Hint */}
        <div className="flex flex-col items-end shrink-0 pl-1">
          <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-[#0B63F6] group-hover:border-[#0B63F6]/50 shadow-xs transition">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-[10px] font-bold text-[#0B63F6] mt-1.5 hidden xs:inline-block">
            {lang === 'bn' ? 'বিস্তারিত' : 'Details'}
          </span>
        </div>
      </div>
    </div>
  );
};
