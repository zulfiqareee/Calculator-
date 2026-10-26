import React, { useState } from 'react';
import {
  Battery,
  BatteryCharging,
  Zap,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Tv,
  Wind,
  Lightbulb,
  Monitor,
  Wifi,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

export const BatteryIpsCalculator: React.FC<Props> = ({ lang }) => {
  const t = UI_TEXT[lang];

  // Appliances counts
  const [fans, setFans] = useState<number>(3); // 80W each
  const [lights, setLights] = useState<number>(4); // 15W each
  const [tvs, setTvs] = useState<number>(1); // 90W
  const [pcs, setPcs] = useState<number>(0); // 150W
  const [routers, setRouters] = useState<number>(1); // 15W
  const [customWatts, setCustomWatts] = useState<number>(0);

  // Battery Parameters
  const [batteryAh, setBatteryAh] = useState<number>(150);
  const [systemVoltage, setSystemVoltage] = useState<number>(12); // 12V (1 bat), 24V (2 bats), 48V (4 bats)
  const [batteryType, setBatteryType] = useState<'tubular' | 'flat' | 'lithium'>('tubular');
  const [inverterEff, setInverterEff] = useState<number>(85); // 85%

  // Compute Total Load in Watts
  const totalLoadWatts =
    fans * 80 + lights * 15 + tvs * 90 + pcs * 150 + routers * 15 + customWatts;

  // Depth of Discharge (DoD)
  const dod = batteryType === 'lithium' ? 0.9 : batteryType === 'tubular' ? 0.75 : 0.65;

  // Total Battery Energy in Watt-Hours (Wh)
  const totalWh = systemVoltage * batteryAh;
  const usableWh = totalWh * dod * (inverterEff / 100);

  // Backup Hours
  let backupHours = 0;
  if (totalLoadWatts > 0) {
    backupHours = usableWh / totalLoadWatts;
  }

  const hours = Math.floor(backupHours);
  const minutes = Math.round((backupHours - hours) * 60);

  // Required Inverter VA (with 0.8 Power Factor and 25% safety margin)
  const minInverterVa = Math.round((totalLoadWatts / 0.8) * 1.25);

  // Recommended Charging Current (10% to 12% of Ah)
  const recChargingCurrent = (batteryAh * 0.1).toFixed(1);

  // Discharge Current from battery
  const dischargeCurrent = systemVoltage > 0 ? (totalLoadWatts / systemVoltage / (inverterEff / 100)).toFixed(1) : '0';

  const [copied, setCopied] = useState<boolean>(false);

  const handleReset = () => {
    setFans(3);
    setLights(4);
    setTvs(1);
    setPcs(0);
    setRouters(1);
    setCustomWatts(0);
    setBatteryAh(150);
    setSystemVoltage(12);
    setBatteryType('tubular');
  };

  const handleCopy = async () => {
    const text = `আইপিএস / ব্যাটারি ব্যাকআপ হিসাব:
কানেক্টেড লোড: ${totalLoadWatts} Watts (${fans} ফ্যান, ${lights} লাইট, ${tvs} টিভি, ${routers} রাউটার)
ব্যাটারি কনফিগারেশন: ${batteryAh}Ah (${systemVoltage}V)
------------------------
সম্ভাব্য ব্যাকআপ টাইম: ${hours} ঘণ্টা ${minutes} মিনিট
প্রস্তাবিত আইপিএস রেটিং: ${minInverterVa} VA বা তার বেশি
প্রস্তাবিত চার্জার কারেন্ট: ${recChargingCurrent} Amperes
ডিসচার্জ কারেন্ট: ${dischargeCurrent} Amps`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'battery-ips',
      titleEn: 'Battery & IPS Backup Calculator',
      titleBn: 'ব্যাটারি/UPS/IPS ব্যাকআপ ক্যালকুলেটর',
      expression: `${totalLoadWatts}W on ${batteryAh}Ah @ ${systemVoltage}V`,
      result: `${hours} ঘণ্টা ${minutes} মিনিট ব্যাকআপ (${minInverterVa} VA)`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      {/* Appliances Load Calculator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-[#0B63F6]">
            <Zap className="w-4 h-4" />
            <span>১. আইপিএস লোডসমূহ সিলেক্ট করুন:</span>
          </span>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.actions.reset}</span>
          </button>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Ceiling Fan */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ফ্যান (৮০W)</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setFans(Math.max(0, fans - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border font-bold text-sm"
              >
                -
              </button>
              <span className="text-sm font-black font-mono">{fans}</span>
              <button
                onClick={() => setFans(fans + 1)}
                className="w-8 h-8 rounded-lg bg-[#0B63F6] text-white font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* LED Light */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">লাইট (১৫W)</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLights(Math.max(0, lights - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border font-bold text-sm"
              >
                -
              </button>
              <span className="text-sm font-black font-mono">{lights}</span>
              <button
                onClick={() => setLights(lights + 1)}
                className="w-8 h-8 rounded-lg bg-[#0B63F6] text-white font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* LED TV */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Tv className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">টিভি (৯০W)</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTvs(Math.max(0, tvs - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border font-bold text-sm"
              >
                -
              </button>
              <span className="text-sm font-black font-mono">{tvs}</span>
              <button
                onClick={() => setTvs(tvs + 1)}
                className="w-8 h-8 rounded-lg bg-[#0B63F6] text-white font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Computer / PC */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">কম্পিউটার (১৫০W)</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPcs(Math.max(0, pcs - 1))}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border font-bold text-sm"
              >
                -
              </button>
              <span className="text-sm font-black font-mono">{pcs}</span>
              <button
                onClick={() => setPcs(pcs + 1)}
                className="w-8 h-8 rounded-lg bg-[#0B63F6] text-white font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Custom Load */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            অন্যান্য লোড (Watts):
          </label>
          <input
            type="number"
            value={customWatts || ''}
            onChange={(e) => setCustomWatts(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="e.g. 50"
            className="flex-1 h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
          />
        </div>

        {/* Total Load Banner */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">মোট ব্যবহৃত লোড:</span>
          <span className="text-base font-black font-mono text-[#0B63F6]">{totalLoadWatts} Watts</span>
        </div>
      </div>

      {/* Battery Config Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
        <span className="text-xs font-bold text-[#0B63F6] flex items-center gap-1.5">
          <BatteryCharging className="w-4 h-4" />
          <span>২. ব্যাটারি ও ইনভার্টার কনফিগারেশন:</span>
        </span>

        {/* Battery Ah */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ব্যাটারি ক্ষমতা (Capacity in Ah):
            </label>
            <span className="text-xs font-mono font-bold text-[#0B63F6]">{batteryAh} Ah</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[100, 130, 150, 180, 200, 230].map((ah) => (
              <button
                key={ah}
                onClick={() => setBatteryAh(ah)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  batteryAh === ah
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {ah} Ah
              </button>
            ))}
          </div>
        </div>

        {/* System Voltage */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            সিস্টেম ভোল্টেজ (ব্যাটারির সংখ্যা):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 12, label: '১২V (১টি ব্যাটারি)' },
              { v: 24, label: '২৪V (২টি ব্যাটারি)' },
              { v: 48, label: '৪৮V (৪টি ব্যাটারি)' },
            ].map((sys) => (
              <button
                key={sys.v}
                onClick={() => setSystemVoltage(sys.v)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                  systemVoltage === sys.v
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {sys.label}
              </button>
            ))}
          </div>
        </div>

        {/* Battery Type */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            ব্যাটারির ধরন (Depth of Discharge):
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'tubular', label: 'টিউবুলার (৭৫%)' },
              { id: 'flat', label: 'ফ্ল্যাট প্লেট (৬৫%)' },
              { id: 'lithium', label: 'লিথিয়াম (৯০%)' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setBatteryType(b.id as any)}
                className={`py-2 px-1 rounded-xl font-bold border transition text-center ${
                  batteryType === b.id
                    ? 'bg-[#0B63F6] text-white border-[#0B63F6]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Display Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-4">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>ব্যাকআপ ও আইপিএস সিলেকশন ফলাফল:</span>
        </span>

        {/* Big Backup Time Display */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">সম্ভাব্য ব্যাকআপ সময়:</span>
            <span className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
              {formatNumber(hours, lang)} <span className="text-sm font-sans text-slate-300">ঘণ্টা</span> {formatNumber(minutes, lang)} <span className="text-sm font-sans text-slate-300">মিনিট</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Battery className="w-6 h-6" />
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[11px]">প্রস্তাবিত IPS রেটিং:</span>
            <span className="text-sm font-bold font-mono text-blue-400 mt-0.5">
              {formatNumber(minInverterVa, lang)} VA
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">২৫% সেফটি মার্জিনসহ</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[11px]">চার্জিং কারেন্ট (১০%):</span>
            <span className="text-sm font-bold font-mono text-amber-400 mt-0.5">
              {formatNumber(recChargingCurrent, lang)} Amperes
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">নিরাপদ ব্যাটারি লাইফের জন্য</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[11px]">ডিসচার্জ কারেন্ট:</span>
            <span className="text-sm font-bold font-mono text-purple-400 mt-0.5">
              {formatNumber(dischargeCurrent, lang)} A
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">ব্যাটারি থেকে ড্রপ</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[11px]">ব্যবহারযোগ্য শক্তি:</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {formatNumber(Math.round(usableWh), lang)} Wh
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">{totalWh} Wh এর মধ্যে</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full h-11 bg-[#0B63F6] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t.actions.copied : 'ব্যাকআপ হিসাব কপি করুন'}</span>
        </button>
      </div>
    </div>
  );
};
