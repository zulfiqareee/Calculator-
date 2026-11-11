import React, { useState } from 'react';
import {
  Zap,
  BatteryCharging,
  Sliders,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Layers,
  HelpCircle,
  Lightbulb,
  Fan,
  Tv,
  Refrigerator,
  Flame,
  Wind,
  ShieldAlert,
  Cpu,
  Info,
  Building2,
  Share2,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';
import { tallySounds } from '../../utils/tallyAudioVoice';
import {
  PROVIDERS,
  UtilityProvider,
  calculateElectricityBill,
  calculateIpsSizing,
} from '../../utils/electricityTariffEngine';

interface Props {
  lang: Language;
}

type TabType = 'bill' | 'appliances' | 'ips' | 'engineering' | 'tips';

interface ApplianceItem {
  id: string;
  nameBn: string;
  defaultWatts: number;
  count: number;
  hoursPerDay: number;
}

export const ElectricitySuiteView: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [activeTab, setActiveTab] = useState<TabType>('bill');
  const [copied, setCopied] = useState<boolean>(false);

  // ==========================================
  // TAB 1: ELECTRICITY BILL STATE
  // ==========================================
  const [units, setUnits] = useState<number>(185);
  const [provider, setProvider] = useState<UtilityProvider>('desco');
  const [sanctionedLoad, setSanctionedLoad] = useState<number>(2); // 2 kW
  const [isPrepaid, setIsPrepaid] = useState<boolean>(true);

  const billResult = calculateElectricityBill(units, sanctionedLoad, isPrepaid, provider);
  const currentProvider = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  // ==========================================
  // TAB 2: APPLIANCES & LOAD STATE
  // ==========================================
  const [appliances, setAppliances] = useState<ApplianceItem[]>([
    { id: 'fan', nameBn: 'সিলিং ফ্যান', defaultWatts: 75, count: 3, hoursPerDay: 12 },
    { id: 'led', nameBn: 'এলইডি লাইট', defaultWatts: 15, count: 5, hoursPerDay: 6 },
    { id: 'fridge', nameBn: 'রেফ্রিজারেটর / ফ্রিজ', defaultWatts: 180, count: 1, hoursPerDay: 14 },
    { id: 'tv', nameBn: 'স্মার্ট টিভি (৪৩ ইঞ্চি)', defaultWatts: 70, count: 1, hoursPerDay: 4 },
    { id: 'ac', nameBn: 'দেড় টন এসি (ইনভার্টার)', defaultWatts: 1400, count: 0, hoursPerDay: 6 },
    { id: 'pump', nameBn: 'পানির মোটর (১ ঘোড়া)', defaultWatts: 746, count: 1, hoursPerDay: 1 },
    { id: 'iron', nameBn: 'ইস্ত্রি / আয়রন', defaultWatts: 1000, count: 1, hoursPerDay: 0.3 },
  ]);

  // Total daily kWh
  const totalDailyKwh = appliances.reduce(
    (sum, a) => sum + (a.count * a.defaultWatts * a.hoursPerDay) / 1000,
    0
  );
  const monthlyUnits = Math.round(totalDailyKwh * 30);
  const totalConnectedWatts = appliances.reduce((sum, a) => sum + a.count * a.defaultWatts, 0);

  // ==========================================
  // TAB 3: IPS & SOLAR BATTERY SIZING STATE
  // ==========================================
  const [ipsFans, setIpsFans] = useState<number>(3);
  const [ipsLights, setIpsLights] = useState<number>(4);
  const [ipsTvs, setIpsTvs] = useState<number>(1);
  const [ipsPcs, setIpsPcs] = useState<number>(0);
  const [ipsRouters, setIpsRouters] = useState<number>(1);
  const [ipsBatteryAh, setIpsBatteryAh] = useState<number>(150);
  const [ipsBatteryType, setIpsBatteryType] = useState<'tubular' | 'flat' | 'lithium'>('tubular');

  const ipsResult = calculateIpsSizing(
    ipsFans,
    ipsLights,
    ipsTvs,
    ipsPcs,
    ipsRouters,
    0,
    ipsBatteryAh,
    ipsBatteryType
  );

  // ==========================================
  // TAB 4: ELECTRICAL ENGINEERING TOOLS
  // ==========================================
  // Ohm's Law
  const [ohmV, setOhmV] = useState<number>(220);
  const [ohmI, setOhmI] = useState<number>(5);
  const ohmR = ohmI > 0 ? (ohmV / ohmI).toFixed(2) : '0';
  const ohmP = (ohmV * ohmI).toFixed(0);

  // Motor Current FLA
  const [motorHp, setMotorHp] = useState<number>(5);
  const [motorPhase, setMotorPhase] = useState<'1' | '3'>('3');
  const motorFla =
    motorPhase === '3'
      ? (motorHp * 1.45).toFixed(1) // Rule of thumb: ~1.45A per HP for 400V 3-phase
      : (motorHp * 4.5).toFixed(1); // Single phase ~4.5A per HP for 220V
  const recommendedMcb = Math.ceil(parseFloat(motorFla) * 1.5);

  // Wire Sizing & Voltage Drop
  const [wireAmps, setWireAmps] = useState<number>(15);
  const [wireDistMeters, setWireDistMeters] = useState<number>(25);
  const [wireRm, setWireRm] = useState<number>(2.5); // 2.5 rm
  // Voltage drop = 2 * L * I * R / 1000 (R for copper ~7.4 ohm/km for 2.5mm2)
  const wireResistancePerKm = wireRm === 1.5 ? 12.1 : wireRm === 2.5 ? 7.41 : wireRm === 4.0 ? 4.61 : 3.08;
  const voltDrop = (2 * wireDistMeters * wireAmps * (wireResistancePerKm / 1000)).toFixed(1);
  const voltDropPercent = ((parseFloat(voltDrop) / 220) * 100).toFixed(1);

  const handleCopy = async () => {
    tallySounds.playClickSound();
    let text = '';
    if (activeTab === 'bill') {
      text = `বিদ্যুৎ বিল হিসাব (${currentProvider.nameBn}):
ব্যবহৃত ইউনিট: ${units} kWh (${isPrepaid ? 'প্রিপেইড' : 'পোস্টপেইড'})
-----------------------------
• এনার্জি চার্জ: ৳${billResult.energyCharge.toFixed(2)}
• ডিমান্ড চার্জ: ৳${billResult.demandCharge.toFixed(2)}
• মিটার ভাড়া: ৳${billResult.meterRent.toFixed(2)}
• সরকারি ভ্যাট (৫%): ৳${billResult.vatAmount.toFixed(2)}
-----------------------------
মোট আনুমানিক বিদ্যুৎ বিল: ৳${billResult.totalBill.toLocaleString('en-IN')}`;
    } else if (activeTab === 'appliances') {
      text = `বাসাবাড়ির বিদ্যুৎ লোড ও খরচ হিসাব:
সংযুক্ত মোট ওয়াট: ${totalConnectedWatts} Watts (${(totalConnectedWatts / 1000).toFixed(2)} kW)
দৈনিক বিদ্যুৎ খরচ: ${totalDailyKwh.toFixed(2)} ইউনিট (kWh)
মাসিক বিদ্যুৎ ব্যবহার: প্রায় ${monthlyUnits} ইউনিট`;
    } else if (activeTab === 'ips') {
      text = `আইপিএস ও ব্যাটারি সাইজিং রিপোর্ট:
মোট লোড: ${ipsResult.totalLoadWatts} Watts
প্রস্তাবিত আইপিএস ক্ষমতা: ${ipsResult.recommendedInverterVa} VA
বর্তমান ${ipsBatteryAh}Ah ব্যাটারিতে ব্যাকআপ: প্রায় ${ipsResult.estimatedBackupHours.toFixed(1)} ঘণ্টা
প্রস্তাবিত চার্জিং কারেন্ট: ${ipsResult.chargingCurrentAmps} Amperes`;
    } else {
      text = `ইলেকট্রিক্যাল হিসাব:
ভোল্টেজ: ${ohmV}V | কারেন্ট: ${ohmI}A
রেজিস্ট্যান্স: ${ohmR} Ω | মোট পাওয়ার: ${ohmP} Watts`;
    }

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    addStoredHistory({
      toolId: 'electricity',
      titleEn: 'Electricity & Load Suite',
      titleBn: 'বিদ্যুৎ বিল ও লোড হিসাব',
      expression: `${units} Units (${currentProvider.nameEn})`,
      result: `৳${billResult.totalBill}`,
    });
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-200" />
              {isBn ? 'বিদ্যুৎ ও পাওয়ার ইঞ্জিনিয়ারিং' : 'Power & Electricity Suite'}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
            </button>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isBn ? 'বিদ্যুৎ বিল ও পাওয়ার লোড হাব' : 'Electricity Bill & Power Hub'}
          </h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            {isBn
              ? 'ডেসকো, ডিপিডিসি, পল্লী বিদ্যুৎ সরকারি স্ল্যাব ট্যারিফ, হোম লোড ক্যালকুলেটর, আইপিএস ও সোলার সাইজিং'
              : 'BERC approved utility tariffs, appliance load, IPS battery backup & electrical calculations'}
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-5 bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl gap-1 text-[11px] font-bold">
        {[
          { id: 'bill', labelBn: 'বিদ্যুৎ বিল', labelEn: 'Bill', icon: Zap },
          { id: 'appliances', labelBn: 'হোম লোড', labelEn: 'Load', icon: Lightbulb },
          { id: 'ips', labelBn: 'আইপিএস', labelEn: 'IPS', icon: BatteryCharging },
          { id: 'engineering', labelBn: 'ইঞ্জিনিয়ারিং', labelEn: 'Formula', icon: Cpu },
          { id: 'tips', labelBn: 'সাশ্রয় টিপস', labelEn: 'Tips', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                isSel
                  ? 'bg-[#0B63F6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="truncate w-full text-center leading-tight">
                {isBn ? tab.labelBn : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: ELECTRICITY BILL ESTIMATOR (সরকারি স্ল্যাব ট্যারিফ)
         ========================================================================= */}
      {activeTab === 'bill' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Building2 size={14} className="text-[#0B63F6]" />
              {isBn ? 'বিদ্যুৎ বিতরণকারী সংস্থা ও মিটার টাইপ:' : 'Select Utility & Meter:'}
            </span>

            {/* Provider Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">বিতরণ কোম্পানি:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as UtilityProvider)}
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 text-xs font-bold"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameBn} — {p.areaBn}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Input & Meter Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্যবহৃত ইউনিট (kWh):
                </label>
                <input
                  type="number"
                  value={units || ''}
                  onChange={(e) => setUnits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-11 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 font-mono font-bold text-base text-amber-600 dark:text-amber-400"
                  placeholder="যেমন: ১৮৫"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মিটারের ধরন:
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11 items-center text-[11px] font-bold">
                  <button
                    onClick={() => setIsPrepaid(true)}
                    className={`h-full rounded-lg transition ${
                      isPrepaid ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    প্রিপেইড
                  </button>
                  <button
                    onClick={() => setIsPrepaid(false)}
                    className={`h-full rounded-lg transition ${
                      !isPrepaid ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    পোস্টপেইড
                  </button>
                </div>
              </div>
            </div>

            {/* Sanctioned Load */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                অনুমোদিত লোড (Sanctioned Load kW):
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold font-mono">
                {[1, 2, 3, 5].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setSanctionedLoad(kw)}
                    className={`py-2 rounded-xl border text-center transition ${
                      sanctionedLoad === kw
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B63F6] border-[#0B63F6]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {kw} kW
                  </button>
                ))}
              </div>
            </div>

            {/* Total Estimated Bill Card */}
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-amber-100 block font-medium">আনুমানিক সর্বমোট বিদ্যুৎ বিল:</span>
                <span className="text-2xl font-black font-mono">
                  ৳{billResult.totalBill.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-100/80 block mt-0.5">
                  গড় ইউনিট খরচ: ৳{(billResult.totalBill / (units || 1)).toFixed(2)}/kWh
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-xl backdrop-blur-xs font-bold block">
                  {currentProvider.nameEn}
                </span>
                <span className="text-[10px] text-amber-100 block mt-1">ভ্যাট ৫% সহ</span>
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                বিলের বিস্তারিত আইটেম ও স্ল্যাব হিসাব:
              </span>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 text-xs">
                {billResult.slabBreakdown.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{s.slabLabelBn}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatNumber(s.units, lang)} ইউনিট × ৳{s.rate.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      ৳{s.cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">ডিমান্ড চার্জ:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-white">৳{billResult.demandCharge.toFixed(0)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">মিটার ভাড়া:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-white">৳{billResult.meterRent.toFixed(0)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold">ভ্যাট (৫%):</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-white">৳{billResult.vatAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: HOME APPLIANCES & LOAD CALCULATOR (হোম লোড ক্যালকুলেটর)
         ========================================================================= */}
      {activeTab === 'appliances' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-500" />
                {isBn ? 'ঘরের যন্ত্রপাতি ও ব্যবহারের সময়:' : 'Appliance Quantities & Usage Hours:'}
              </span>
            </div>

            {/* Total Calculated Summary Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">মাসিক সম্ভাব্য খরচ:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatNumber(monthlyUnits, lang)} ইউনিট
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  দৈনিক: {totalDailyKwh.toFixed(1)} kWh/দিন
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">মোট পাওয়ার:</span>
                <span className="text-base font-extrabold font-mono text-amber-300">
                  {formatNumber(totalConnectedWatts, lang)} Watts
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({(totalConnectedWatts / 1000).toFixed(2)} kW)
                </span>
              </div>
            </div>

            {/* Appliances List */}
            <div className="flex flex-col gap-2.5">
              {appliances.map((a, idx) => (
                <div
                  key={a.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {a.nameBn}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {a.defaultWatts} ওয়াট প্রতি ইউনিট
                    </span>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const updated = [...appliances];
                        updated[idx].count = Math.max(0, updated[idx].count - 1);
                        setAppliances(updated);
                      }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-300 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-slate-900 dark:text-white">
                      {a.count}টি
                    </span>
                    <button
                      onClick={() => {
                        const updated = [...appliances];
                        updated[idx].count += 1;
                        setAppliances(updated);
                      }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Hours per Day */}
                  <div className="w-20 text-right">
                    <label className="text-[9px] text-slate-400 block font-bold">ঘণ্টা/দিন</label>
                    <input
                      type="number"
                      step="0.5"
                      value={a.hoursPerDay}
                      onChange={(e) => {
                        const updated = [...appliances];
                        updated[idx].hoursPerDay = Math.max(0, parseFloat(e.target.value) || 0);
                        setAppliances(updated);
                      }}
                      className="w-full h-7 bg-white dark:bg-slate-900 border rounded-lg text-center font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: IPS & SOLAR BATTERY SIZING (আইপিএস ও ব্যাটারি সাইজিং)
         ========================================================================= */}
      {activeTab === 'ips' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <BatteryCharging size={14} className="text-emerald-500" />
              {isBn ? 'আইপিএস লোড ও ব্যাটারি নির্বাচন:' : 'IPS Load & Battery Inputs:'}
            </span>

            {/* Appliances for IPS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">ফ্যান (75W):</span>
                <input
                  type="number"
                  min="0"
                  value={ipsFans}
                  onChange={(e) => setIpsFans(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-8 bg-white dark:bg-slate-900 border rounded-lg text-center font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">লাইট (15W):</span>
                <input
                  type="number"
                  min="0"
                  value={ipsLights}
                  onChange={(e) => setIpsLights(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-8 bg-white dark:bg-slate-900 border rounded-lg text-center font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">টিভি (85W):</span>
                <input
                  type="number"
                  min="0"
                  value={ipsTvs}
                  onChange={(e) => setIpsTvs(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-8 bg-white dark:bg-slate-900 border rounded-lg text-center font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">কম্পিউটার (120W):</span>
                <input
                  type="number"
                  min="0"
                  value={ipsPcs}
                  onChange={(e) => setIpsPcs(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 h-8 bg-white dark:bg-slate-900 border rounded-lg text-center font-bold"
                />
              </div>
            </div>

            {/* Battery Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">ব্যাটারি ক্যাপাসিটি (Ah):</label>
                <select
                  value={ipsBatteryAh}
                  onChange={(e) => setIpsBatteryAh(parseInt(e.target.value))}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 text-xs font-bold"
                >
                  <option value="100">100 Ah (ছোট)</option>
                  <option value="130">130 Ah (মাঝারি)</option>
                  <option value="150">150 Ah (স্ট্যান্ডার্ড)</option>
                  <option value="200">200 Ah (বড় ব্যাকআপ)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">ব্যাটারির ধরন:</label>
                <select
                  value={ipsBatteryType}
                  onChange={(e) => setIpsBatteryType(e.target.value as any)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 text-xs font-bold"
                >
                  <option value="tubular">টিউবুলার (বেশি টেকসই)</option>
                  <option value="flat">ফ্ল্যাট প্লেট লেড-অ্যাসিড</option>
                  <option value="lithium">লিথিয়াম আয়ন (দ্রুত চার্জ)</option>
                </select>
              </div>
            </div>

            {/* IPS Recommendation Result */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-100 block font-medium">প্রত্যাশিত ব্যাকআপ সময়:</span>
                  <span className="text-2xl font-black font-mono">
                    {ipsResult.estimatedBackupHours.toFixed(1)} ঘণ্টা
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-100 block font-medium">প্রয়োজনীয় আইপিএস ক্ষমতা:</span>
                  <span className="text-xl font-black font-mono">
                    {ipsResult.recommendedInverterVa} VA
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/60 flex items-center justify-between text-xs text-emerald-100">
                <span>মোট লোড: {ipsResult.totalLoadWatts} Watts</span>
                <span>চার্জার কারেন্ট: {ipsResult.chargingCurrentAmps}A</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ELECTRICAL ENGINEERING TOOLS (ইঞ্জিনিয়ারিং ক্যালকুলেটর)
         ========================================================================= */}
      {activeTab === 'engineering' && (
        <div className="flex flex-col gap-4">
          {/* Ohm's Law */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Cpu size={14} className="text-[#0B63F6]" />
              ওহমস ল (Ohm’s Law: V = I × R):
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">ভোল্টেজ (V):</label>
                <input
                  type="number"
                  value={ohmV}
                  onChange={(e) => setOhmV(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 font-mono font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">কারেন্ট (I - Amperes):</label>
                <input
                  type="number"
                  value={ohmI}
                  onChange={(e) => setOhmI(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 font-mono font-bold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-center border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] text-slate-500 block font-bold">রেজিস্ট্যান্স (R):</span>
                <span className="text-sm font-extrabold font-mono text-[#0B63F6]">{ohmR} Ω (Ohm)</span>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-center border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] text-slate-500 block font-bold">মোট পাওয়ার (P):</span>
                <span className="text-sm font-extrabold font-mono text-[#0B63F6]">{ohmP} Watts</span>
              </div>
            </div>
          </div>

          {/* Motor Current & MCB */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
              <Sliders size={14} className="text-emerald-500" />
              মোটর ফুল লোড কারেন্ট (FLA) ও ব্রেকার নির্বাচন:
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">মোটর পাওয়ার (HP - ঘোড়া):</label>
                <input
                  type="number"
                  value={motorHp}
                  onChange={(e) => setMotorHp(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 font-mono font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">ফেজ:</label>
                <select
                  value={motorPhase}
                  onChange={(e) => setMotorPhase(e.target.value as any)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border rounded-xl px-2 text-xs font-bold"
                >
                  <option value="3">৩-ফেজ (400V)</option>
                  <option value="1">১-ফেজ (220V)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">ফুল লোড কারেন্ট (FLA):</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {motorFla} Amperes
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] font-bold">প্রস্তাবিত সার্কিট ব্রেকার:</span>
                <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {recommendedMcb}A MCB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ENERGY SAVING TIPS & SAFETY
         ========================================================================= */}
      {activeTab === 'tips' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-500" />
              বিদ্যুৎ সাশ্রয় ও শর্ট সার্কিট সুরক্ষায় ১০টি সোনালী নিয়ম:
            </span>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  ১. এসি সবসময় ২৬° সেলসিয়াসে চালান:
                </span>
                প্রতি ১ ডিগ্রি তাপমাত্রা বাড়ালে প্রায় ৬% বিদ্যুৎ সাশ্রয় হয়। ১৮-তে না চালিয়ে ২৬-এ ফ্যান সহ চালালে রুম দ্রুত ঠান্ডা হয় ও বিদ্যুৎ বিল ৩০% কমে যায়।
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  ২. ইনভার্টার প্রযুক্তির যন্ত্রপাতি ব্যবহার:
                </span>
                ইনভার্টার এসি ও ফ্রিজ কম্প্রেসরকে বারবার অন-অফ না করে মসৃণ গতিতে নিয়ন্ত্রণ করে, ফলে প্রচলিত যন্ত্রের তুলনায় ৪০%-৫০% বিদ্যুৎ সাশ্রয় হয়।
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  ৩. পিক আওয়ারে (সন্ধ্যা ৫টা - রাত ১১টা) ভারী যন্ত্র পরিহার:
                </span>
                পিক সময়ে ইস্ত্রি, ওয়াশিং মেশিন বা পানির মোটর না চালিয়ে সকালের দিকে চালালে জাতীয় গ্রিডে চাপ কমে ও বিল সাশ্রয় হয়।
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  ৪. আরসিসিবি (RCCB) ও প্রপার আর্থিং নিশ্চিত করুন:
                </span>
                যেকোনো কারেন্ট লিকেজ বা মানুষ বিদ্যুৎস্পৃষ্ট হওয়ার সাথে সাথে ০.০৩ সেকেন্ডে আরসিসিবি লাইন বন্ধ করে জীবন রক্ষা করে।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
