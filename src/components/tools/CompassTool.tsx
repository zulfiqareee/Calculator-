import React, { useState, useEffect } from 'react';
import {
  Compass as CompassIcon,
  Navigation,
  MapPin,
  Sparkles,
  RotateCw,
  Info,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../types';
import { formatNumber } from '../../i18n/translations';

interface Props {
  lang: Language;
  userLat?: number;
  userLon?: number;
}

// Calculate exact Qibla bearing in degrees from true North
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

export const CompassTool: React.FC<Props> = ({ lang, userLat = 23.8103, userLon = 90.4125 }) => {
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(false);
  const [sensorPermissionRequested, setSensorPermissionRequested] = useState<boolean>(false);
  const [showQiblaOnDial, setShowQiblaOnDial] = useState<boolean>(true);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  const isBn = lang === 'bn';
  const qiblaAngle = Math.round(calculateQiblaAngle(userLat, userLon));

  // Determine current active heading
  const currentHeading = isManualMode ? manualHeading : heading;

  // Listen to mobile device orientation
  useEffect(() => {
    let handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;
      // iOS webkitCompassHeading
      if ((e as any).webkitCompassHeading !== undefined) {
        compassHeading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android compass heading (alpha is angle around z axis)
        compassHeading = 360 - e.alpha;
      }

      if (compassHeading !== null && !isNaN(compassHeading)) {
        setHasSensor(true);
        const norm = Math.round((compassHeading + 360) % 360);
        setHeading(norm);

        // Haptic feedback when aligned with exact North (within 2 degrees)
        if ((norm <= 2 || norm >= 358) && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
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
  }, []);

  const requestOrientationPermission = async () => {
    setSensorPermissionRequested(true);
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setHasSensor(true);
        }
      } catch (e) {
        console.warn('Orientation permission error:', e);
      }
    }
  };

  // Convert degree to Cardinal name
  const getDirectionName = (deg: number) => {
    const directionsBn = [
      'উত্তর (N)',
      'উত্তর-পূর্ব (NE)',
      'পূর্ব (E)',
      'দক্ষিণ-পূর্ব (SE)',
      'দক্ষিণ (S)',
      'দক্ষিণ-পশ্চিম (SW)',
      'পশ্চিম (W)',
      'উত্তর-পশ্চিম (NW)',
    ];
    const directionsEn = ['North (N)', 'North-East (NE)', 'East (E)', 'South-East (SE)', 'South (S)', 'South-West (SW)', 'West (W)', 'North-West (NW)'];
    const index = Math.round(deg / 45) % 8;
    return isBn ? directionsBn[index] : directionsEn[index];
  };

  // Difference between current heading and Qibla
  const qiblaDiff = Math.abs(currentHeading - qiblaAngle);
  const isFacingQibla = qiblaDiff <= 4 || qiblaDiff >= 356;

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-6">
      {/* Top Heading Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B1E36] to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setShowQiblaOnDial(!showQiblaOnDial)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              showQiblaOnDial
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🕋</span>
            <span>{isBn ? 'কেবলা সূচক' : 'Qibla'}</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
          <CompassIcon className="w-3.5 h-3.5" />
          <span>{isBn ? 'ডিজিটাল কম্পাস ও দিকদর্শন' : 'Digital Magnetic Compass'}</span>
        </span>

        <div className="my-2">
          <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
            {formatNumber(currentHeading, lang)}°
          </h2>
          <p className="text-sm sm:text-base font-bold text-amber-400 mt-1">
            {getDirectionName(currentHeading)}
          </p>
        </div>

        {/* Qibla Direction Indicator Banner */}
        {showQiblaOnDial && (
          <div
            className={`w-full mt-2 p-2.5 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold ${
              isFacingQibla
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 animate-pulse'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🕋</span>
              <div className="text-left">
                <span className="block text-[11px] text-slate-400">
                  {isBn ? 'মক্কা মুকাররমার দিকে কেবলা কোণ:' : 'Qibla Bearing:'}
                </span>
                <span className="font-mono text-sm text-amber-300">
                  {formatNumber(qiblaAngle, lang)}° {isBn ? 'পশ্চিম-দক্ষিণ' : 'W'}
                </span>
              </div>
            </div>

            {isFacingQibla ? (
              <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">
                {isBn ? '✓ সঠিক কেবলা' : 'Facing Qibla'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                {isBn ? `${formatNumber(Math.min(qiblaDiff, 360 - qiblaDiff), lang)}° ঘুরুন` : `Turn ${Math.min(qiblaDiff, 360 - qiblaDiff)}°`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Compass Dial */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
        {/* Outer Glow Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isFacingQibla
              ? 'ring-4 ring-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
              : currentHeading <= 2 || currentHeading >= 358
              ? 'ring-4 ring-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
              : 'ring-1 ring-slate-300 dark:ring-slate-800 shadow-md'
          }`}
        />

        {/* Rotating Compass Disc */}
        <div
          className="relative w-full h-full rounded-full bg-slate-900 border-4 border-slate-800 shadow-inner overflow-hidden transition-transform duration-200 ease-out"
          style={{ transform: `rotate(${-currentHeading}deg)` }}
        >
          {/* Degree ticks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const deg = i * 10;
            const isMajor = deg % 90 === 0;
            const isMid = deg % 30 === 0;
            return (
              <div
                key={deg}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`w-0.5 rounded-full ${
                    isMajor
                      ? 'h-4 bg-amber-400'
                      : isMid
                      ? 'h-3 bg-slate-400'
                      : 'h-1.5 bg-slate-600'
                  }`}
                />
              </div>
            );
          })}

          {/* Cardinals: N, E, S, W */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-rose-500 font-black text-sm tracking-widest">
            {isBn ? 'উ' : 'N'}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">
            {isBn ? 'পূ' : 'E'}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-300 font-bold text-sm">
            {isBn ? 'দ' : 'S'}
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm">
            {isBn ? 'প' : 'W'}
          </div>

          {/* Qibla Marker on Disc */}
          {showQiblaOnDial && (
            <div
              className="absolute inset-0 flex justify-center pointer-events-none"
              style={{ transform: `rotate(${qiblaAngle}deg)` }}
            >
              <div className="flex flex-col items-center pt-2">
                <span className="text-lg filter drop-shadow">🕋</span>
                <div className="w-1 h-14 bg-emerald-400 rounded-full shadow-md" />
              </div>
            </div>
          )}

          {/* Center Pivot Point */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 rounded-full bg-amber-400 shadow-xs" />
          </div>
        </div>

        {/* Stationary Phone Heading Pointer (Top Red Arrow) */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-rose-500 filter drop-shadow" />
        </div>
      </div>

      {/* Sensor Calibration & Permission Controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Navigation className="w-4 h-4 text-[#0B63F6]" />
            <span>{isBn ? 'সেন্সর অবস্থা:' : 'Compass Sensor:'}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              hasSensor
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {hasSensor ? (isBn ? 'সক্রিয় (Magnetic Active)' : 'Active') : (isBn ? 'ম্যানুয়াল / ওয়েব মোড' : 'Manual/Web')}
          </span>
        </div>

        {!hasSensor && !sensorPermissionRequested && (
          <button
            onClick={requestOrientationPermission}
            className="w-full py-2.5 rounded-2xl bg-[#0B63F6] hover:bg-blue-700 text-white font-bold text-xs transition"
          >
            {isBn ? 'কম্পাস সেন্সর পারমিশন দিন' : 'Grant Compass Sensor Permission'}
          </button>
        )}

        {/* Manual Degree Slider (For testing or devices without magnetic compass sensor) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-semibold">
              {isBn ? 'ম্যানুয়াল ডায়াল ঘূর্ণন:' : 'Manual Rotation Slider:'}
            </span>
            <span className="font-mono font-bold text-[#0B63F6]">{manualHeading}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={manualHeading}
            onChange={(e) => {
              setIsManualMode(true);
              setManualHeading(Number(e.target.value));
            }}
            className="w-full accent-[#0B63F6] cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isBn
            ? 'টিপস: ফোনের সঠিক দিক পেতে ফোনটিকে সমতলে রাখুন এবং শূন্যে ইংরেজি ‘8’ অক্ষরের মতো কয়েকবার ঘোরান (Calibration)।'
            : 'Tip: Hold device flat and rotate in figure-8 motion for highest compass accuracy.'}
        </p>
      </div>
    </div>
  );
};
