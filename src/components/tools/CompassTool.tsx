import React, { useState, useEffect, useRef } from 'react';
import {
  Compass as CompassIcon,
  Navigation,
  MapPin,
  Sparkles,
  RotateCw,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';
import {
  requestLocationPermission,
  getCachedGpsCoords,
  setCachedGpsCoords,
  estimateMagneticDeclination,
} from '../../utils/permissionManager';

interface Props {
  lang: Language;
  userLat?: number;
  userLon?: number;
}

// Spherical trigonometry formula for exact Qibla bearing from True North
export function calculateQiblaAngle(lat: number, lon: number): number {
  const kaabaLat = (21.4224779 * Math.PI) / 180;
  const kaabaLon = (39.8261818 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;

  const y = Math.sin(kaabaLon - lambda);
  const x = Math.cos(phi) * Math.tan(kaabaLat) - Math.sin(phi) * Math.cos(kaabaLon - lambda);
  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

export const CompassTool: React.FC<Props> = ({ lang, userLat, userLon }) => {
  const isBn = lang === 'bn';

  // 1. Location state: Read cached GPS or fallback
  const cachedGps = getCachedGpsCoords();
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; name?: string }>({
    lat: userLat || cachedGps?.lat || 23.8103,
    lon: userLon || cachedGps?.lon || 90.4125,
    name: cachedGps?.name || (userLat ? `GPS: ${userLat.toFixed(2)}°, ${userLon?.toFixed(2)}°` : undefined),
  });
  const [gpsGranted, setGpsGranted] = useState<boolean>(!!cachedGps || !!userLat);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 2. Sensor state
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(false);
  const [sensorType, setSensorType] = useState<'absolute' | 'standard' | 'manual'>('manual');
  const [tiltPitch, setTiltPitch] = useState<number>(0); // beta (-180 to 180)
  const [tiltRoll, setTiltRoll] = useState<number>(0);   // gamma (-90 to 90)
  const [isTilted, setIsTilted] = useState<boolean>(false);
  
  // 3. Calibration & Adjustments
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0);
  const [showQiblaOnDial, setShowQiblaOnDial] = useState<boolean>(true);
  const [showCalibrationHelp, setShowCalibrationHelp] = useState<boolean>(false);
  const [showManualAdjustment, setShowManualAdjustment] = useState<boolean>(false);

  // Magnetic declination for True North
  const magneticDeclination = estimateMagneticDeclination(currentCoords.lat, currentCoords.lon);
  const qiblaAngle = Math.round(calculateQiblaAngle(currentCoords.lat, currentCoords.lon));

  // Request GPS Location immediately
  const handleRequestGps = async () => {
    setIsLocating(true);
    setGpsError(null);
    try {
      const res = await requestLocationPermission();
      setCurrentCoords({
        lat: res.lat,
        lon: res.lon,
        name: res.locationName,
      });
      setGpsGranted(true);
      setCachedGpsCoords(res.lat, res.lon, res.locationName);
    } catch (err: any) {
      setGpsError(err.message || (isBn ? 'জিপিএস লোকেশন পাওয়া যায়নি।' : 'Location request failed.'));
    } finally {
      setIsLocating(false);
    }
  };

  // Attempt auto GPS request if not cached yet
  useEffect(() => {
    if (!cachedGps && !userLat && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const name = `GPS: ${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;
          setCurrentCoords({ lat, lon, name });
          setGpsGranted(true);
          setCachedGpsCoords(lat, lon, name);
        },
        () => {
          // silently wait for explicit tap
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // 4. Orientation Sensor Listeners
  // Modern Android uses 'deviceorientationabsolute', iOS uses 'webkitCompassHeading'
  useEffect(() => {
    let unmounted = false;

    const handleOrientationAbsolute = (e: any) => {
      if (unmounted) return;
      if (e.alpha !== null && !isNaN(e.alpha)) {
        setHasSensor(true);
        setSensorType('absolute');
        // Android absolute heading: (360 - alpha) % 360
        const rawDeg = (360 - e.alpha) % 360;
        setHeading(Math.round(rawDeg));
      }
      if (e.beta !== null && e.gamma !== null) {
        setTiltPitch(Math.round(e.beta));
        setTiltRoll(Math.round(e.gamma));
        setIsTilted(Math.abs(e.beta) > 30 || Math.abs(e.gamma) > 30);
      }
    };

    const handleOrientationStandard = (e: any) => {
      if (unmounted) return;
      // iOS webkitCompassHeading
      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        setHasSensor(true);
        setSensorType('absolute');
        setHeading(Math.round(e.webkitCompassHeading));
      } else if (sensorType !== 'absolute' && e.alpha !== null && !isNaN(e.alpha)) {
        // Fallback standard deviceorientation
        setHasSensor(true);
        setSensorType('standard');
        const rawDeg = (360 - e.alpha) % 360;
        setHeading(Math.round(rawDeg));
      }
      if (e.beta !== null && e.gamma !== null) {
        setTiltPitch(Math.round(e.beta));
        setTiltRoll(Math.round(e.gamma));
        setIsTilted(Math.abs(e.beta) > 30 || Math.abs(e.gamma) > 30);
      }
    };

    if (typeof window !== 'undefined') {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);
      }
      window.addEventListener('deviceorientation', handleOrientationStandard, true);
    }

    return () => {
      unmounted = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);
        window.removeEventListener('deviceorientation', handleOrientationStandard, true);
      }
    };
  }, [sensorType]);

  // Apply calibration offset
  const calibratedHeading = Math.round((heading + calibrationOffset + 360) % 360);

  // Cardinal direction name
  const getDirectionName = (deg: number) => {
    const directionsBn = [
      'উত্তর (North)',
      'উত্তর-পূর্ব (North-East)',
      'পূর্ব (East)',
      'দক্ষিণ-পূর্ব (South-East)',
      'দক্ষিণ (South)',
      'দক্ষিণ-পশ্চিম (South-West)',
      'পশ্চিম (West)',
      'উত্তর-পশ্চিম (North-West)',
    ];
    const directionsEn = [
      'North (N)',
      'North-East (NE)',
      'East (E)',
      'South-East (SE)',
      'South (S)',
      'South-West (SW)',
      'West (W)',
      'North-West (NW)',
    ];
    const index = Math.round(deg / 45) % 8;
    return isBn ? directionsBn[index] : directionsEn[index];
  };

  // Qibla Alignment Check
  const qiblaDiff = Math.abs(calibratedHeading - qiblaAngle);
  const isFacingQibla = qiblaDiff <= 4 || qiblaDiff >= 356;
  const isFacingNorth = calibratedHeading <= 3 || calibratedHeading >= 357;

  // Haptic feedback when crossing exact North or Qibla
  const lastVibrateRef = useRef<number>(0);
  useEffect(() => {
    if ((isFacingNorth || isFacingQibla) && typeof navigator !== 'undefined' && navigator.vibrate) {
      const now = Date.now();
      if (now - lastVibrateRef.current > 1500) {
        navigator.vibrate(25);
        lastVibrateRef.current = now;
      }
    }
  }, [isFacingNorth, isFacingQibla]);

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-8">
      {/* 1. GPS Location Status Card */}
      <div className={`p-4 rounded-3xl border transition ${
        gpsGranted
          ? 'bg-[#0B1E36] border-blue-500/30 text-white'
          : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
      } shadow-lg space-y-2`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              gpsGranted ? 'bg-blue-600/30 text-[#69DCC0]' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white">
                {isBn ? 'আপনার বর্তমান অবস্থান (GPS):' : 'Current Location (GPS):'}
              </span>
              <span className="text-[11px] text-blue-200/80 font-mono">
                {currentCoords.lat.toFixed(4)}° N, {currentCoords.lon.toFixed(4)}° E
              </span>
            </div>
          </div>

          <button
            onClick={handleRequestGps}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
              gpsGranted
                ? 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-extrabold'
            }`}
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? (isBn ? 'খোঁজা হচ্ছে...' : 'Locating...')
                : gpsGranted
                ? (isBn ? 'লোকেশন রিফ্রেশ' : 'Refresh GPS')
                : (isBn ? 'জিপিএস এক্সেস দিন' : 'Enable GPS')}
            </span>
          </button>
        </div>

        {!gpsGranted && (
          <div className="text-[11px] text-amber-300/90 leading-relaxed pt-1 border-t border-amber-500/20 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>
              {isBn
                ? 'সতর্কতা: সঠিক উত্তর ও কেবলার দিক গণনার জন্য জিপিএস পারমিশন আবশ্যক।'
                : 'Notice: GPS location permission is required for true heading and Qibla accuracy.'}
            </span>
          </div>
        )}

        {gpsError && (
          <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-500/40">
            {gpsError}
          </div>
        )}
      </div>

      {/* 2. Main Compass Dial Card */}
      <div className={`p-5 sm:p-6 rounded-3xl text-white border shadow-2xl flex flex-col items-center relative overflow-hidden transition ${
        isFacingQibla
          ? 'bg-gradient-to-b from-[#082824] via-[#071B35] to-[#082824] border-emerald-500/60 ring-2 ring-emerald-500/40'
          : isFacingNorth
          ? 'bg-gradient-to-b from-[#1E112A] via-[#071B35] to-[#1E112A] border-rose-500/60 ring-2 ring-rose-500/40'
          : 'bg-gradient-to-b from-[#071B35] via-[#0B2544] to-[#071B35] border-[#153D55]'
      }`}>
        {/* Top Controls Bar */}
        <div className="w-full flex items-center justify-between gap-2 mb-3 z-10">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              hasSensor ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="text-[11px] font-bold text-slate-300">
              {hasSensor
                ? (sensorType === 'absolute' ? (isBn ? 'ম্যাগনেটোমিটার সক্রিয়' : 'Magnetometer Active') : (isBn ? 'সেন্সর যুক্ত' : 'Sensor Connected'))
                : (isBn ? 'সেন্সর ক্যালিব্রেশন প্রয়োজন' : 'Sensor Calibrating')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQiblaOnDial(!showQiblaOnDial)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                showQiblaOnDial
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🕋</span>
              <span>{isBn ? 'কেবলা' : 'Qibla'}</span>
            </button>

            <button
              onClick={() => setShowCalibrationHelp(!showCalibrationHelp)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300"
              title={isBn ? 'ক্যালিব্রেশন সহায়তা' : 'Calibration Guide'}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Large Degree & Direction Readout */}
        <div className="flex flex-col items-center text-center my-1 z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {formatNumber(calibratedHeading, lang)}
            </span>
            <span className="text-3xl font-black text-[#69DCC0]">°</span>
          </div>
          <span className="text-sm sm:text-base font-extrabold text-[#69DCC0] mt-0.5 tracking-wide">
            {getDirectionName(calibratedHeading)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? `চৌম্বক বিচ্যুতি: ${magneticDeclination}° | কাবার কোণ: ${qiblaAngle}°` : `Declination: ${magneticDeclination}° | Kaaba: ${qiblaAngle}°`}
          </span>
        </div>

        {/* Tilted Warning Banner */}
        {isTilted && (
          <div className="my-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 z-10 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{isBn ? 'সঠিক ফলাফলের জন্য ফোনটি সমতল (Flat) রাখুন' : 'Keep device flat for accurate reading'}</span>
          </div>
        )}

        {/* 360° Rotating Dial Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 flex items-center justify-center">
          {/* Outer Compass Housing with Degree Markers */}
          <div
            className="absolute inset-0 rounded-full border-4 border-[#153D55] bg-[#07182E] shadow-2xl transition-transform duration-100 ease-out flex items-center justify-center"
            style={{ transform: `rotate(${-calibratedHeading}deg)` }}
          >
            {/* Degree Tick Ring (12 major ticks for every 30 degrees) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`w-0.5 ${
                    deg % 90 === 0 ? 'h-4 bg-white font-black' : 'h-2 bg-slate-500'
                  }`}
                />
              </div>
            ))}

            {/* Cardinal Letters: North (Red), East, South, West */}
            <div className="absolute top-4 font-black text-rose-500 text-lg tracking-wider">
              {isBn ? 'উ' : 'N'}
            </div>
            <div className="absolute right-4 font-black text-amber-400 text-lg tracking-wider">
              {isBn ? 'পূ' : 'E'}
            </div>
            <div className="absolute bottom-4 font-black text-sky-400 text-lg tracking-wider">
              {isBn ? 'দ' : 'S'}
            </div>
            <div className="absolute left-4 font-black text-emerald-400 text-lg tracking-wider">
              {isBn ? 'প' : 'W'}
            </div>

            {/* Qibla Marker Needle on the rotating dial */}
            {showQiblaOnDial && (
              <div
                className="absolute inset-0 flex justify-center pointer-events-none"
                style={{ transform: `rotate(${qiblaAngle}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[10px] flex items-center gap-0.5 shadow-md">
                    <span>🕋</span>
                    <span className="hidden xs:inline">কিবলা</span>
                  </div>
                  <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 to-transparent" />
                </div>
              </div>
            )}
          </div>

          {/* Center Fixed Alignment Needle & Bubble Level */}
          <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none z-20 py-2">
            {/* Top Fixed Aim Pointer */}
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-rose-500 drop-shadow-lg" />
            
            {/* Center Pivot Point with Mini Spirit Bubble */}
            <div className="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-xl">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-transform duration-75 ${
                  isTilted ? 'bg-amber-400' : 'bg-emerald-400 shadow-md shadow-emerald-500/50'
                }`}
                style={{
                  transform: `translate(${Math.max(-14, Math.min(14, tiltRoll / 2))}px, ${Math.max(
                    -14,
                    Math.min(14, tiltPitch / 2)
                  )}px)`,
                }}
              />
            </div>

            {/* Bottom Fixed Aim Pointer */}
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-slate-600" />
          </div>
        </div>

        {/* Qibla Facing Status Badge */}
        {isFacingQibla && (
          <div className="mt-2 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg animate-bounce z-10">
            <span>🕋</span>
            <span>{isBn ? 'সঠিক কেবলার দিক! আপনি মক্কার দিকে আছেন।' : 'Aligned with Qibla (Mecca)!'}</span>
          </div>
        )}

        {isFacingNorth && !isFacingQibla && (
          <div className="mt-2 px-4 py-1.5 rounded-2xl bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg z-10">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isBn ? 'সঠিক ভৌগোলিক উত্তর দিক (True North)' : 'Exact True North Alignment'}</span>
          </div>
        )}

        {/* Manual Calibration & Offset Adjustment Toggle */}
        <div className="w-full pt-4 mt-2 border-t border-[#153D55] flex items-center justify-between text-xs z-10">
          <button
            onClick={() => setShowManualAdjustment(!showManualAdjustment)}
            className="text-slate-400 hover:text-white flex items-center gap-1.5 font-bold"
          >
            <Sliders className="w-3.5 h-3.5 text-[#69DCC0]" />
            <span>{isBn ? 'দিক সমন্বয় ও ফাইন টিউন' : 'Fine-Tune Calibration'}</span>
          </button>

          <span className="text-[11px] text-slate-400 font-mono">
            {isBn ? `অফসেট: ${calibrationOffset > 0 ? '+' : ''}${calibrationOffset}°` : `Offset: ${calibrationOffset}°`}
          </span>
        </div>

        {/* Manual Offset Slider */}
        {showManualAdjustment && (
          <div className="w-full mt-3 p-3.5 rounded-2xl bg-[#112B48] border border-[#153D55] space-y-2 z-10 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{isBn ? 'ম্যানুয়াল অফসেট (± ডিগ্রি):' : 'Manual Rotation Offset:'}</span>
              <button
                onClick={() => setCalibrationOffset(0)}
                className="text-[10px] text-[#69DCC0] hover:underline"
              >
                {isBn ? 'রিসেট (০°)' : 'Reset (0°)'}
              </button>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={calibrationOffset}
              onChange={(e) => setCalibrationOffset(parseInt(e.target.value, 10))}
              className="w-full accent-[#69DCC0] cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-snug">
              {isBn
                ? 'যদি ফোনের কভার বা মেটালের কারণে কম্পাস সামান্য বাঁকা দেখায়, তবে স্লাইডার দিয়ে সঠিক করে নিন।'
                : 'Adjust if magnetic phone cases or interference slightly offset the heading.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Sensor Calibration Guide Dialog / Accordion */}
      {showCalibrationHelp && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-[#69DCC0]" />
              <h4 className="text-xs sm:text-sm font-bold">
                {isBn ? 'কম্পাস নির্ভুল করার নির্দেশিকা (Calibration)' : 'Compass Calibration Guide'}
              </h4>
            </div>
            <button
              onClick={() => setShowCalibrationHelp(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#69DCC0]">১.</span>
              <span>
                {isBn
                  ? 'ফোনটিকে হাতের তালুতে সমতল (Flat) রাখুন। হেলানো অবস্থায় কম্পাসের চুম্বকীয় সেন্সর ভুল তথ্য দিতে পারে।'
                  : 'Keep the phone flat on your palm. Tilting causes magnetometer distortion.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#69DCC0]">২.</span>
              <span>
                {isBn
                  ? 'সেন্সর সক্রিয় করতে ফোনটিকে ইংরেজি "8" (আট) আকারের ভঙ্গিতে বাতাসে ২-৩ বার ঘোরান।'
                  : 'Calibrate the compass by waving your phone in a figure-8 motion 2-3 times.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#69DCC0]">৩.</span>
              <span>
                {isBn
                  ? 'ধাতব বস্তু, চুম্বকীয় ফোন কভার, ল্যাপটপ বা স্পিকার থেকে ফোনটি কিছুটা দূরে রাখুন।'
                  : 'Stay away from strong electromagnetic fields, magnets, and heavy metals.'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 4. Cardinal Reference Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-xs font-bold text-rose-500 block">{isBn ? 'উত্তর (North)' : 'North'}</span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white">০° / ৩৬০°</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-xs font-bold text-amber-500 block">{isBn ? 'পূর্ব (East)' : 'East'}</span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white">৯০°</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-xs font-bold text-sky-500 block">{isBn ? 'দক্ষিণ (South)' : 'South'}</span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white">১৮০°</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-xs font-bold text-emerald-500 block">{isBn ? 'পশ্চিম (West)' : 'West'}</span>
          <span className="text-sm font-black font-mono text-slate-900 dark:text-white">২৭০°</span>
        </div>
      </div>
    </div>
  );
};
