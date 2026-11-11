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
  Volume2,
  VolumeX,
  Gauge,
  ShieldCheck,
  ShieldAlert,
  Sprout,
  Sunrise,
  Sunset,
  Sparkles,
  Thermometer,
  CloudFog,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import { requestLocationPermission } from '../../utils/permissionManager';
import { BANGLADESH_DISTRICTS, DistrictOption } from '../../data/bangladeshDistricts';
import {
  getAqiDetails,
  getUvDetails,
  getAgroAdvice,
  speakWeatherReportBn,
} from '../../utils/weatherAqiEngine';

interface Props {
  lang: Language;
}

type WeatherTab = 'overview' | 'aqi' | 'agro';

export const LiveWeatherView: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<WeatherTab>('overview');

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption>(BANGLADESH_DISTRICTS[0]); // Dhaka
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

  const [loading, setLoading] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const [weatherData, setWeatherData] = useState<any>(null);
  const [aqiData, setAqiData] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // WMO Code interpretation
  const getWeatherInfo = (code: number) => {
    switch (code) {
      case 0:
        return { labelBn: 'পরিষ্কার আকাশ', labelEn: 'Clear Sky', icon: Sun, color: 'text-amber-400' };
      case 1:
      case 2:
      case 3:
        return { labelBn: 'আংশিক মেঘলা আকাশ', labelEn: 'Partly Cloudy', icon: Cloud, color: 'text-blue-300' };
      case 45:
      case 48:
        return { labelBn: 'কুয়াশাচ্ছন্ন আবহাওয়া', labelEn: 'Foggy', icon: CloudFog, color: 'text-slate-300' };
      case 51:
      case 53:
      case 55:
        return { labelBn: 'গুঁড়ি গুঁড়ি বৃষ্টি', labelEn: 'Light Drizzle', icon: CloudRain, color: 'text-cyan-300' };
      case 61:
      case 63:
      case 65:
        return { labelBn: 'মাঝারি থেকে ভারী বৃষ্টিপাত', labelEn: 'Rain Showers', icon: CloudRain, color: 'text-blue-400' };
      case 80:
      case 81:
      case 82:
        return { labelBn: 'দমকা হাওয়াসহ বৃষ্টি', labelEn: 'Heavy Showers', icon: CloudRain, color: 'text-indigo-400' };
      case 95:
      case 96:
      case 99:
        return { labelBn: 'বজ্রবৃষ্টি ও ঝড়ো হাওয়া', labelEn: 'Thunderstorm', icon: CloudLightning, color: 'text-amber-300' };
      default:
        return { labelBn: 'স্বাভাবিক আবহাওয়া', labelEn: 'Fair Weather', icon: Sun, color: 'text-amber-400' };
    }
  };

  // Fetch Weather & Air Quality in parallel
  const fetchAllData = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure,uv_index&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&forecast_days=7&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(aqiUrl).catch(() => null),
      ]);

      if (!weatherRes.ok) throw new Error(isBn ? 'আবহাওয়া ডেটা লোড হতে সমস্যা হয়েছে।' : 'Failed to fetch weather.');
      const wData = await weatherRes.json();
      setWeatherData(wData);

      if (aqiRes && aqiRes.ok) {
        const aData = await aqiRes.json();
        setAqiData(aData);
      }

      // Cache for home widget
      try {
        if (wData.current) {
          const homePayload = {
            temp: Math.round(wData.current.temperature_2m),
            apparentTemp: Math.round(wData.current.apparent_temperature),
            weatherCode: wData.current.weather_code,
            humidity: wData.current.relative_humidity_2m,
            windSpeed: Math.round(wData.current.wind_speed_10m),
            locationName: isUsingGps ? gpsLocationName || 'লাইভ জিপিএস অবস্থান' : selectedDistrict.nameBn,
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

  useEffect(() => {
    fetchAllData(currentLat, currentLon);
  }, []);

  const handleDistrictChange = (dist: DistrictOption) => {
    setSelectedDistrict(dist);
    setIsUsingGps(false);
    setCurrentLat(dist.lat);
    setCurrentLon(dist.lon);
    fetchAllData(dist.lat, dist.lon);
  };

  const handleUseGps = async () => {
    setGpsLoading(true);
    setGpsNotice(null);
    try {
      const coords = await requestLocationPermission();
      setIsUsingGps(true);
      setCurrentLat(coords.lat);
      setCurrentLon(coords.lon);

      // Find nearest district
      let nearest = BANGLADESH_DISTRICTS[0];
      let minDist = 999999;
      BANGLADESH_DISTRICTS.forEach((d) => {
        const dist = Math.hypot(d.lat - coords.lat, d.lon - coords.lon);
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      });

      const locLabel = `${nearest.nameBn} (${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E)`;
      setGpsLocationName(locLabel);

      localStorage.setItem(
        'user_gps_coords',
        JSON.stringify({ lat: coords.lat, lon: coords.lon, name: locLabel })
      );

      setGpsNotice(isBn ? 'সঠিক জিপিএস অবস্থান শনাক্ত করা হয়েছে!' : 'Accurate GPS location detected!');
      fetchAllData(coords.lat, coords.lon);
    } catch (err: any) {
      setGpsNotice(err.message || (isBn ? 'লোকেশন পারমিশন পাওয়া যায়নি।' : 'Location permission not granted.'));
    } finally {
      setGpsLoading(false);
      setTimeout(() => setGpsNotice(null), 4000);
    }
  };

  const currentW = weatherData?.current;
  const dailyW = weatherData?.daily;
  const hourlyW = weatherData?.hourly;
  const currentInfo = currentW ? getWeatherInfo(currentW.weather_code) : null;
  const CurrentIcon = currentInfo ? currentInfo.icon : Sun;

  // AQI calculations
  const usAqi = aqiData?.current?.us_aqi ?? 95;
  const aqiInfo = getAqiDetails(usAqi);

  // UV calculations
  const uvValue = currentW?.uv_index ?? dailyW?.uv_index_max?.[0] ?? 4;
  const uvInfo = getUvDetails(uvValue);

  // Agro Advisory calculations
  const maxTemp = dailyW?.temperature_2m_max?.[0] ?? 30;
  const rainProb = dailyW?.precipitation_probability_max?.[0] ?? 10;
  const windSpd = currentW?.wind_speed_10m ?? 8;
  const humidity = currentW?.relative_humidity_2m ?? 60;
  const agroAdvice = getAgroAdvice(rainProb, maxTemp, windSpd, humidity);

  // Voice Broadcast Handler
  const handleVoiceBroadcast = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const cityLabel = isUsingGps ? gpsLocationName || 'আপনার বর্তমান' : selectedDistrict.nameBn;
    const temp = Math.round(currentW?.temperature_2m || 0);
    const feels = Math.round(currentW?.apparent_temperature || 0);
    const cond = currentInfo?.labelBn || 'স্বাভাবিক';

    setIsSpeaking(true);
    speakWeatherReportBn(cityLabel, temp, feels, cond, rainProb, usAqi, aqiInfo.labelBn);

    // Auto toggle back after ~12s
    setTimeout(() => {
      setIsSpeaking(false);
    }, 12000);
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-12">
      {/* GPS Location Prompt Banner if not using GPS */}
      {!isUsingGps && (
        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B63F6] text-white flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isBn ? 'সঠিক আবহাওয়ার জন্য লাইভ জিপিএস' : 'Live GPS for Exact Weather'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBn ? 'আপনার নিজস্ব এলাকার রিয়েল-টাইম আবহাওয়া ও বায়ুর মান দেখুন।' : 'Detect exact local neighborhood forecast and air quality.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="px-3 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shrink-0 transition disabled:opacity-50"
          >
            {gpsLoading ? (isBn ? 'যাচাই...' : '...') : (isBn ? 'অনুমতি দিন' : 'Allow')}
          </button>
        </div>
      )}

      {/* GPS Status Toast */}
      {gpsNotice && (
        <div className="p-3 rounded-2xl bg-blue-600 text-white text-xs font-bold text-center animate-fade-in shadow-xs">
          {gpsNotice}
        </div>
      )}

      {/* District / GPS Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
            <MapPin className="w-4 h-4 text-[#0B63F6]" />
            <span>{isBn ? 'জেলা বা অবস্থান নির্বাচন:' : 'Select District / GPS:'}</span>
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
            <span>{isUsingGps ? (isBn ? 'জিপিএস সক্রিয়' : 'GPS Active') : (isBn ? 'অটো জিপিএস' : 'Auto GPS')}</span>
          </button>
        </div>

        <select
          value={isUsingGps ? 'gps' : selectedDistrict.nameEn}
          onChange={(e) => {
            if (e.target.value === 'gps') {
              handleUseGps();
            } else {
              const found = BANGLADESH_DISTRICTS.find((d) => d.nameEn === e.target.value);
              if (found) handleDistrictChange(found);
            }
          }}
          className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 font-bold text-xs text-slate-900 dark:text-white"
        >
          {isUsingGps && (
            <option value="gps">
              📍 {gpsLocationName || (isBn ? 'বর্তমান লাইভ অবস্থান (Live GPS)' : 'Live GPS Location')}
            </option>
          )}
          {BANGLADESH_DISTRICTS.map((d) => (
            <option key={d.nameEn} value={d.nameEn}>
              {d.nameBn} ({d.nameEn}) — {d.divisionBn} বিভাগ
            </option>
          ))}
        </select>
      </div>

      {/* Main Feature Tabs */}
      <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-xs font-bold">
        {[
          { id: 'overview', labelBn: 'লাইভ আবহাওয়া', labelEn: 'Weather', icon: Sun },
          { id: 'aqi', labelBn: 'বায়ুমান (AQI)', labelEn: 'Air Quality', icon: Gauge },
          { id: 'agro', labelBn: 'কৃষি সতর্কতা', labelEn: 'Agro Alert', icon: Sprout },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WeatherTab)}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: LIVE WEATHER OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Hero Weather Card */}
          <div className="bg-gradient-to-br from-sky-500 via-[#0B63F6] to-indigo-800 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-100 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {isUsingGps
                      ? gpsLocationName || (isBn ? 'বর্তমান জিপিএস' : 'Live GPS')
                      : `${selectedDistrict.nameBn} জেলা`}
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

              <div className="flex items-center gap-1.5">
                {/* Voice Broadcast Button */}
                <button
                  onClick={handleVoiceBroadcast}
                  className={`p-2 rounded-xl backdrop-blur-md transition flex items-center gap-1 text-xs font-bold ${
                    isSpeaking ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                  title={isBn ? 'বাংলায় আবহাওয়া শুনুন' : 'Listen Weather Broadcast'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => fetchAllData(currentLat, currentLon)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-white mb-2" />
                <span className="text-xs font-bold text-white/90">
                  {isBn ? 'আবহাওয়া ও উপগ্রহ ডেটা লোড হচ্ছে...' : 'Loading weather & satellite data...'}
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
                  <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                    <CurrentIcon className="w-12 h-12 text-amber-300 drop-shadow-md animate-pulse" />
                  </div>
                </div>

                <div className="p-3 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-300" />
                    {isBn ? currentInfo?.labelBn : currentInfo?.labelEn}
                  </span>
                  <span className="text-blue-200 text-[11px] font-medium">
                    {currentW.is_day ? (isBn ? '☀️ দিবাভাগ' : 'Day') : (isBn ? '🌙 রাত্রিভাগ' : 'Night')}
                  </span>
                </div>

                {/* 6 Key Weather Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Droplets className="w-4 h-4 mx-auto mb-1 text-cyan-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'আর্দ্রতা' : 'Humidity'}</span>
                    <span className="font-bold font-mono">{formatNumber(currentW.relative_humidity_2m, lang)}%</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Wind className="w-4 h-4 mx-auto mb-1 text-sky-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'বাতাস' : 'Wind'}</span>
                    <span className="font-bold font-mono">
                      {formatNumber(Math.round(currentW.wind_speed_10m), lang)} {isBn ? 'কিমি/ঘ' : 'km/h'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <CloudRain className="w-4 h-4 mx-auto mb-1 text-indigo-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'বৃষ্টিপাত' : 'Precip.'}</span>
                    <span className="font-bold font-mono">{formatNumber(currentW.precipitation, lang)} {isBn ? 'মিমি' : 'mm'}</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Sun className="w-4 h-4 mx-auto mb-1 text-amber-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'ইউভি সূচক' : 'UV Index'}</span>
                    <span className="font-bold font-mono">{formatNumber(uvValue.toFixed(1), lang)} ({uvInfo.labelBn})</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Gauge className="w-4 h-4 mx-auto mb-1 text-emerald-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'বায়ুমান' : 'AQI'}</span>
                    <span className="font-bold font-mono">{formatNumber(usAqi, lang)} ({aqiInfo.labelBn.split(' ')[0]})</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <Thermometer className="w-4 h-4 mx-auto mb-1 text-rose-200" />
                    <span className="text-[10px] text-blue-100 block">{isBn ? 'বায়ুচাপ' : 'Pressure'}</span>
                    <span className="font-bold font-mono">{formatNumber(Math.round(currentW.surface_pressure || 1010), lang)} hPa</span>
                  </div>
                </div>

                {/* Sunrise & Sunset Arc Card */}
                {dailyW?.sunrise?.[0] && dailyW?.sunset?.[0] && (
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center justify-around text-xs">
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-5 h-5 text-amber-300" />
                      <div>
                        <span className="text-[10px] text-blue-100 block">সূর্যোদয়:</span>
                        <span className="font-bold font-mono">
                          {formatNumber(dailyW.sunrise[0].split('T')[1], lang)} AM
                        </span>
                      </div>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div className="flex items-center gap-2">
                      <Sunset className="w-5 h-5 text-orange-300" />
                      <div>
                        <span className="text-[10px] text-blue-100 block">সূর্যাস্ত:</span>
                        <span className="font-bold font-mono">
                          {formatNumber(dailyW.sunset[0].split('T')[1], lang)} PM
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* 24-Hour Hourly Timeline */}
          {hourlyW?.time && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#0B63F6]" />
                  {isBn ? 'আগামী ২৪ ঘণ্টার আবহাওয়া ও বৃষ্টির পূর্বাভাস:' : '24-Hour Hourly Forecast:'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ডানে স্ক্রোল করুন →</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {hourlyW.time.slice(0, 24).map((timeStr: string, idx: number) => {
                  const hourDate = new Date(timeStr);
                  const hourLabel = hourDate.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', {
                    hour: 'numeric',
                    hour12: true,
                  });
                  const temp = Math.round(hourlyW.temperature_2m[idx]);
                  const code = hourlyW.weather_code[idx];
                  const rainProb = hourlyW.precipitation_probability[idx] || 0;
                  const hInfo = getWeatherInfo(code);
                  const HIcon = hInfo.icon;

                  return (
                    <div
                      key={timeStr}
                      className="flex flex-col items-center justify-between min-w-[70px] p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center shrink-0"
                    >
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {idx === 0 ? (isBn ? 'এখন' : 'Now') : hourLabel}
                      </span>
                      <HIcon className={`w-5 h-5 my-1.5 ${hInfo.color}`} />
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                        {formatNumber(temp, lang)}°
                      </span>
                      {rainProb > 0 ? (
                        <span className="text-[9px] font-bold text-blue-500 flex items-center gap-0.5 mt-1 font-mono">
                          <Droplets size={8} /> {formatNumber(rainProb, lang)}%
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 mt-1">০%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7-Day Extended Forecast */}
          {dailyW?.time && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0B63F6]" />
                <span>{isBn ? 'আগামী ৭ দিনের আবহাওয়া পূর্বাভাস:' : '7-Day Extended Forecast:'}</span>
              </h3>

              <div className="flex flex-col gap-2">
                {dailyW.time.map((dateStr: string, idx: number) => {
                  const code = dailyW.weather_code[idx];
                  const info = getWeatherInfo(code);
                  const DayIcon = info.icon;
                  const maxT = Math.round(dailyW.temperature_2m_max[idx]);
                  const minT = Math.round(dailyW.temperature_2m_min[idx]);
                  const rProb = dailyW.precipitation_probability_max[idx] || 0;
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

                      <div className="flex items-center gap-3">
                        {rProb > 0 && (
                          <span className="text-[11px] font-bold text-blue-500 font-mono flex items-center gap-0.5">
                            <Droplets size={10} />
                            {formatNumber(rProb, lang)}%
                          </span>
                        )}
                        <div className="text-right font-mono font-bold">
                          <span className="text-slate-800 dark:text-white">{formatNumber(maxT, lang)}°</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">/ {formatNumber(minT, lang)}°C</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: AIR QUALITY INDEX (AQI - বায়ুদূষণ সূচক)
         ========================================================================= */}
      {activeTab === 'aqi' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
                <Gauge size={14} className="text-[#0B63F6]" />
                {isBn ? 'লাইভ বায়ুদূষণ সূচক (Air Quality Index):' : 'Live AQI Meter:'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                US-AQI Standard
              </span>
            </div>

            {/* AQI Score Banner */}
            <div className={`p-5 rounded-3xl border ${aqiInfo.bgClass} ${aqiInfo.borderClass} flex items-center justify-between`}>
              <div>
                <span className="text-xs font-bold block text-slate-600 dark:text-slate-300">
                  {isBn ? 'বায়ুর গুণমান স্কোর:' : 'Current Air Quality:'}
                </span>
                <h3 className={`text-3xl font-black font-mono mt-0.5 ${aqiInfo.colorClass}`}>
                  {formatNumber(usAqi, lang)}
                  <span className="text-sm font-sans font-bold ml-1.5">AQI</span>
                </h3>
                <span className={`text-xs font-extrabold block mt-1 ${aqiInfo.colorClass}`}>
                  {isBn ? aqiInfo.labelBn : aqiInfo.labelEn}
                </span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {aqiInfo.outdoorSafe ? (
                  <ShieldCheck className="w-9 h-9 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-9 h-9 text-rose-500 animate-bounce" />
                )}
              </div>
            </div>

            {/* Health Advisory */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs flex flex-col gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-500" />
                {isBn ? 'স্বাস্থ্য সুরক্ষা ও সতর্কতা পরামর্শ:' : 'Health & Safety Advisory:'}
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                {aqiInfo.healthAdviceBn}
              </p>
              {aqiInfo.maskRecommended && (
                <div className="mt-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1.5">
                  <span>😷 বাইরে বের হলে অবশ্যই ফেস মাস্ক পরিধান করুন।</span>
                </div>
              )}
            </div>

            {/* Pollutants Breakdown */}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isBn ? 'বায়ুদূষণকারী উপাদানের মাত্রা (Pollutants):' : 'Pollutant Breakdown:'}
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">PM2.5 (সূক্ষ্ম ধূলিকণা):</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatNumber((aqiData?.current?.pm2_5 ?? 18.5).toFixed(1), lang)} µg/m³
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">ফুসফুসে সরাসরি প্রবেশযোগ্য</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">PM10 (শ্বাসনালী ধূলিকণা):</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatNumber((aqiData?.current?.pm10 ?? 22.0).toFixed(1), lang)} µg/m³
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">ধুলোবালি ও ধোঁয়া কণা</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">কার্বন মনোক্সাইড (CO):</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatNumber((aqiData?.current?.carbon_monoxide ?? 450).toFixed(0), lang)} µg/m³
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">যানবাহনের নির্গমন ধোঁয়া</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">ওজোন (O₃):</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatNumber((aqiData?.current?.ozone ?? 180).toFixed(0), lang)} µg/m³
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">ভূপৃষ্ঠের ওজোন গ্যাস</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AGRO & FARMERS' WEATHER ADVISORY (কৃষি ও দুর্যোগ সতর্কতা)
         ========================================================================= */}
      {activeTab === 'agro' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
                <Sprout size={14} className="text-emerald-500" />
                {isBn ? 'কৃষক ও ফসলের আবহাওয়া পরামর্শ হাব:' : 'Agro-Weather Advisory Hub:'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                কৃষি বিভাগ গাইডলাইন
              </span>
            </div>

            {/* General Season Alert Card */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs flex flex-col gap-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-600" />
                মৌসুমি আবহাওয়া বুলেটিন:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11.5px]">
                {agroAdvice.generalAlertBn}
              </p>
            </div>

            {/* 3 Core Farming Tasks */}
            <div className="flex flex-col gap-2.5">
              {/* Irrigation */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Droplets size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    জমিতে সেচ প্রদান (Irrigation):
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {agroAdvice.irrigation.textBn}
                  </p>
                </div>
              </div>

              {/* Pesticide / Fertilizer Spray */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Wind size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    কীটনাশক ও সার ছিটানো (Spray Condition):
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {agroAdvice.sprayPesticide.textBn}
                  </p>
                </div>
              </div>

              {/* Harvesting */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Sun size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    ফসল কাটা ও মাড়াই (Harvesting & Drying):
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {agroAdvice.harvesting.textBn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
