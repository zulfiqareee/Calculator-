import React, { useState } from 'react';
import {
  Cpu,
  ShieldAlert,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Gauge,
  Sliders,
  BatteryCharging,
  Maximize2,
  Workflow,
  Radio,
  Anchor,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../../types';
import { UI_TEXT, formatNumber } from '../../i18n/translations';
import { addStoredHistory } from '../../utils/storage';
import { copyToClipboard } from '../../utils/clipboard';

interface Props {
  lang: Language;
}

type ElectricalTab =
  | 'ohms'
  | 'ac_power'
  | 'voltage_drop'
  | 'motor'
  | 'transformer'
  | 'power_factor'
  | 'breaker'
  | 'resistor'
  | 'battery'
  | 'earthing';

export const ElectricalCalculator: React.FC<Props> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<ElectricalTab>('ohms');
  const [copied, setCopied] = useState<boolean>(false);
  const t = UI_TEXT[lang];

  // ==========================================
  // TAB 1: OHM'S LAW STATE
  // ==========================================
  const [vInput, setVInput] = useState<string>('220');
  const [iInput, setIInput] = useState<string>('5');
  const [rInput, setRInput] = useState<string>('');
  const [pInput, setPInput] = useState<string>('');

  // ==========================================
  // TAB 2: AC 1-PHASE / 3-PHASE POWER STATE
  // ==========================================
  const [acPhase, setAcPhase] = useState<'1' | '3'>('3');
  const [acVoltage, setAcVoltage] = useState<string>('400');
  const [acCurrent, setAcCurrent] = useState<string>('25');
  const [acPF, setAcPF] = useState<string>('0.85');

  // ==========================================
  // TAB 3: VOLTAGE DROP & WIRE SIZING STATE
  // ==========================================
  const [vdPhase, setVdPhase] = useState<'1' | '3'>('1');
  const [vdVoltage, setVdVoltage] = useState<string>('220');
  const [vdCurrent, setVdCurrent] = useState<string>('15');
  const [vdDistance, setVdDistance] = useState<string>('30'); // meters
  const [vdMaterial, setVdMaterial] = useState<'cu' | 'al'>('cu');
  const [vdWireSize, setVdWireSize] = useState<string>('2.5'); // mm2

  // ==========================================
  // TAB 4: MOTOR CURRENT & HP/KW STATE
  // ==========================================
  const [motorUnit, setMotorUnit] = useState<'hp' | 'kw'>('hp');
  const [motorPower, setMotorPower] = useState<string>('5');
  const [motorPhase, setMotorPhase] = useState<'1' | '3'>('3');
  const [motorVoltage, setMotorVoltage] = useState<string>('400');
  const [motorPF, setMotorPF] = useState<string>('0.85');
  const [motorEff, setMotorEff] = useState<string>('88'); // %

  // ==========================================
  // TAB 5: TRANSFORMER SIZING STATE
  // ==========================================
  const [txKva, setTxKva] = useState<string>('100');
  const [txPhase, setTxPhase] = useState<'1' | '3'>('3');
  const [txVPrimary, setTxVPrimary] = useState<string>('11000');
  const [txVSecondary, setTxVSecondary] = useState<string>('415');

  // ==========================================
  // TAB 6: POWER FACTOR CORRECTION STATE
  // ==========================================
  const [pfActiveKw, setPfActiveKw] = useState<string>('50');
  const [pfCurrent, setPfCurrent] = useState<string>('0.72');
  const [pfTarget, setPfTarget] = useState<string>('0.98');
  const [pfVoltage, setPfVoltage] = useState<string>('400');

  // ==========================================
  // TAB 7: CIRCUIT BREAKER & LOAD STATE
  // ==========================================
  const [cbWattage, setCbWattage] = useState<string>('3000');
  const [cbVoltage, setCbVoltage] = useState<string>('220');
  const [cbPF, setCbPF] = useState<string>('0.9');
  const [cbIsContinuous, setCbIsContinuous] = useState<boolean>(true); // 125% rule

  // ==========================================
  // TAB 8: RESISTOR COLOR CODE STATE
  // ==========================================
  const [resistorBands, setResistorBands] = useState<'4' | '5'>('4');
  const [band1, setBand1] = useState<number>(1); // Brown (1)
  const [band2, setBand2] = useState<number>(0); // Black (0)
  const [band3, setBand3] = useState<number>(2); // Red (2)
  const [multiplier, setMultiplier] = useState<number>(2); // 10^2 = 100
  const [tolerance, setTolerance] = useState<number>(5); // 5% (Gold)

  // ==========================================
  // TAB 9: UPS/IPS BATTERY BACKUP STATE
  // ==========================================
  const [batAh, setBatAh] = useState<string>('150');
  const [batVoltage, setBatVoltage] = useState<string>('12');
  const [batLoadWatts, setBatLoadWatts] = useState<string>('350');
  const [batEfficiency, setBatEfficiency] = useState<string>('85');
  const [batDoD, setBatDoD] = useState<string>('80'); // Depth of Discharge

  // ==========================================
  // TAB 10: EARTHING RESISTANCE STATE
  // ==========================================
  const [earthLength, setEarthLength] = useState<string>('3'); // meters
  const [earthDiameter, setEarthDiameter] = useState<string>('16'); // mm
  const [earthResistivity, setEarthResistivity] = useState<string>('50'); // Ohm-m (garden soil/clay)

  // Copy helper
  const handleCopyResult = async (title: string, summary: string) => {
    const ok = await copyToClipboard(summary);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    addStoredHistory({
      toolId: 'electrical',
      titleEn: title,
      titleBn: title,
      expression: activeTab.toUpperCase(),
      result: summary.split('\n')[0] || summary,
    });
  };

  // =========================================================
  // CALCULATIONS IMPLEMENTATION
  // =========================================================

  // 1. Ohm's Law
  const solveOhms = () => {
    const v = parseFloat(vInput);
    const i = parseFloat(iInput);
    const r = parseFloat(rInput);
    const p = parseFloat(pInput);

    const hasV = !isNaN(v) && v > 0;
    const hasI = !isNaN(i) && i > 0;
    const hasR = !isNaN(r) && r > 0;
    const hasP = !isNaN(p) && p > 0;

    const count = [hasV, hasI, hasR, hasP].filter(Boolean).length;
    if (count < 2) return null;

    let calcV = v, calcI = i, calcR = r, calcP = p;
    let formula = '';

    if (hasV && hasI) {
      calcR = calcV / calcI;
      calcP = calcV * calcI;
      formula = 'R = V/I, P = V×I';
    } else if (hasV && hasR) {
      calcI = calcV / calcR;
      calcP = (calcV * calcV) / calcR;
      formula = 'I = V/R, P = V²/R';
    } else if (hasV && hasP) {
      calcI = calcP / calcV;
      calcR = (calcV * calcV) / calcP;
      formula = 'I = P/V, R = V²/P';
    } else if (hasI && hasR) {
      calcV = calcI * calcR;
      calcP = calcI * calcI * calcR;
      formula = 'V = I×R, P = I²×R';
    } else if (hasI && hasP) {
      calcV = calcP / calcI;
      calcR = calcP / (calcI * calcI);
      formula = 'V = P/I, R = P/I²';
    } else if (hasR && hasP) {
      calcV = Math.sqrt(calcP * calcR);
      calcI = Math.sqrt(calcP / calcR);
      formula = 'V = √(P×R), I = √(P/R)';
    }

    return { v: calcV, i: calcI, r: calcR, p: calcP, formula };
  };

  // 2. AC Power
  const solveAcPower = () => {
    const v = parseFloat(acVoltage) || 0;
    const i = parseFloat(acCurrent) || 0;
    const pf = Math.min(1, Math.max(0.1, parseFloat(acPF) || 0.85));

    const factor = acPhase === '3' ? Math.sqrt(3) : 1;
    const apparentKva = (factor * v * i) / 1000;
    const realKw = apparentKva * pf;
    const reactiveKvar = apparentKva * Math.sin(Math.acos(pf));

    return {
      apparentKva: apparentKva.toFixed(2),
      realKw: realKw.toFixed(2),
      reactiveKvar: reactiveKvar.toFixed(2),
      current: i.toFixed(2),
      pf: pf.toFixed(2),
    };
  };

  // 3. Voltage Drop & Wire Sizing
  const solveVoltageDrop = () => {
    const v = parseFloat(vdVoltage) || 220;
    const i = parseFloat(vdCurrent) || 10;
    const l = parseFloat(vdDistance) || 20; // meters
    const a = parseFloat(vdWireSize) || 2.5; // mm2

    // Resistivity: Copper = 0.0175, Aluminum = 0.028 Ohm*mm2/m
    const rho = vdMaterial === 'cu' ? 0.0175 : 0.028;
    // Single phase = 2 * L, Three phase = sqrt(3) * L
    const multiplier = vdPhase === '3' ? Math.sqrt(3) : 2;

    const rTotal = (rho * l * multiplier) / a;
    const vDrop = i * rTotal;
    const vDropPercent = (vDrop / v) * 100;
    const vEnd = Math.max(0, v - vDrop);

    // Wire recommendations
    let wireStatus = 'Acceptable (Within 3%)';
    let wireColor = 'text-emerald-500';
    if (vDropPercent > 5) {
      wireStatus = 'Critical! (> 5% Drop, Increase Wire Size)';
      wireColor = 'text-rose-500';
    } else if (vDropPercent > 3) {
      wireStatus = 'Warning (3% to 5% Drop, Feeder only)';
      wireColor = 'text-amber-500';
    }

    return {
      vDrop: vDrop.toFixed(2),
      vDropPercent: vDropPercent.toFixed(2),
      vEnd: vEnd.toFixed(1),
      wireStatus,
      wireColor,
      resistance: rTotal.toFixed(3),
    };
  };

  // 4. Motor Calculation
  const solveMotor = () => {
    const rawPower = parseFloat(motorPower) || 1;
    const v = parseFloat(motorVoltage) || 400;
    const pf = parseFloat(motorPF) || 0.85;
    const eff = (parseFloat(motorEff) || 88) / 100;

    const powerKw = motorUnit === 'hp' ? rawPower * 0.7457 : rawPower;
    const powerHp = motorUnit === 'hp' ? rawPower : rawPower / 0.7457;

    const factor = motorPhase === '3' ? Math.sqrt(3) : 1;
    // I = (P in Watts) / (Factor * V * PF * Efficiency)
    const fla = (powerKw * 1000) / (factor * v * pf * eff);
    const startingCurrentMin = fla * 5;
    const startingCurrentMax = fla * 7;

    // Circuit breaker recommended (175% to 250% for motor direct start)
    const mcbRating = Math.ceil((fla * 1.5) / 5) * 5;

    return {
      kw: powerKw.toFixed(2),
      hp: powerHp.toFixed(2),
      fla: fla.toFixed(2),
      startingCurrent: `${startingCurrentMin.toFixed(0)} - ${startingCurrentMax.toFixed(0)} A`,
      recommendedMcb: `${mcbRating} A`,
    };
  };

  // 5. Transformer Sizing
  const solveTransformer = () => {
    const kva = parseFloat(txKva) || 100;
    const v1 = parseFloat(txVPrimary) || 11000;
    const v2 = parseFloat(txVSecondary) || 415;
    const factor = txPhase === '3' ? Math.sqrt(3) : 1;

    const iPrimary = (kva * 1000) / (factor * v1);
    const iSecondary = (kva * 1000) / (factor * v2);
    const ratio = v1 / v2;

    return {
      iPrimary: iPrimary.toFixed(2),
      iSecondary: iSecondary.toFixed(1),
      ratio: ratio.toFixed(2),
    };
  };

  // 6. Power Factor Correction (Capacitor Bank)
  const solvePfc = () => {
    const pKw = parseFloat(pfActiveKw) || 50;
    const pf1 = Math.min(0.99, Math.max(0.2, parseFloat(pfCurrent) || 0.72));
    const pf2 = Math.min(1.0, Math.max(pf1, parseFloat(pfTarget) || 0.98));
    const v = parseFloat(pfVoltage) || 400;

    const theta1 = Math.acos(pf1);
    const theta2 = Math.acos(pf2);

    // Q_cap = P * (tan(theta1) - tan(theta2))
    const tan1 = Math.tan(theta1);
    const tan2 = Math.tan(theta2);
    const reqKvar = Math.max(0, pKw * (tan1 - tan2));

    // Cap current in 3-phase = (kVAR * 1000) / (sqrt(3) * V)
    const capAmps = (reqKvar * 1000) / (Math.sqrt(3) * v);

    // Line current before and after
    const currentBefore = (pKw * 1000) / (Math.sqrt(3) * v * pf1);
    const currentAfter = (pKw * 1000) / (Math.sqrt(3) * v * pf2);
    const reductionPercent = (((currentBefore - currentAfter) / currentBefore) * 100).toFixed(1);

    return {
      kvar: reqKvar.toFixed(2),
      capAmps: capAmps.toFixed(1),
      currentBefore: currentBefore.toFixed(1),
      currentAfter: currentAfter.toFixed(1),
      reductionPercent,
    };
  };

  // 7. Circuit Breaker Sizing
  const solveBreaker = () => {
    const watts = parseFloat(cbWattage) || 3000;
    const v = parseFloat(cbVoltage) || 220;
    const pf = parseFloat(cbPF) || 0.9;

    const opCurrent = watts / (v * pf);
    const designFactor = cbIsContinuous ? 1.25 : 1.0;
    const designCurrent = opCurrent * designFactor;

    // Standard MCB ratings: 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125 A
    const standardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
    const recMcb = standardRatings.find((r) => r >= designCurrent) || 250;

    // Minimum wire size estimation based on MCB
    let wireMm2 = '1.5';
    if (recMcb > 63) wireMm2 = '25.0';
    else if (recMcb > 40) wireMm2 = '16.0';
    else if (recMcb > 32) wireMm2 = '10.0';
    else if (recMcb > 25) wireMm2 = '6.0';
    else if (recMcb > 20) wireMm2 = '4.0';
    else if (recMcb > 16) wireMm2 = '2.5';

    return {
      opCurrent: opCurrent.toFixed(1),
      designCurrent: designCurrent.toFixed(1),
      recMcb,
      wireMm2,
    };
  };

  // 8. Resistor Color Code
  const COLOR_MAP = [
    { name: 'Black', nameBn: 'কালো', val: 0, mult: 1, tol: null, bg: '#18181b', text: '#ffffff' },
    { name: 'Brown', nameBn: 'বাদামী', val: 1, mult: 10, tol: 1, bg: '#78350f', text: '#ffffff' },
    { name: 'Red', nameBn: 'লাল', val: 2, mult: 100, tol: 2, bg: '#dc2626', text: '#ffffff' },
    { name: 'Orange', nameBn: 'কমলা', val: 3, mult: 1000, tol: null, bg: '#ea580c', text: '#ffffff' },
    { name: 'Yellow', nameBn: 'হলুদ', val: 4, mult: 10000, tol: null, bg: '#eab308', text: '#000000' },
    { name: 'Green', nameBn: 'সবুজ', val: 5, mult: 100000, tol: 0.5, bg: '#16a34a', text: '#ffffff' },
    { name: 'Blue', nameBn: 'নীল', val: 6, mult: 1000000, tol: 0.25, bg: '#2563eb', text: '#ffffff' },
    { name: 'Violet', nameBn: 'বেগুনী', val: 7, mult: 10000000, tol: 0.1, bg: '#9333ea', text: '#ffffff' },
    { name: 'Gray', nameBn: 'ধূসর', val: 8, mult: 100000000, tol: 0.05, bg: '#6b7280', text: '#ffffff' },
    { name: 'White', nameBn: 'সাদা', val: 9, mult: 1000000000, tol: null, bg: '#f3f4f6', text: '#000000' },
    { name: 'Gold', nameBn: 'সোনালী', val: -1, mult: 0.1, tol: 5, bg: '#d97706', text: '#000000' },
    { name: 'Silver', nameBn: 'রূপালী', val: -2, mult: 0.01, tol: 10, bg: '#94a3b8', text: '#000000' },
  ];

  const solveResistor = () => {
    let baseVal = 0;
    if (resistorBands === '4') {
      baseVal = band1 * 10 + band2;
    } else {
      baseVal = band1 * 100 + band2 * 10 + band3;
    }
    const multObj = COLOR_MAP.find((c) => c.val === multiplier) || COLOR_MAP[2];
    const totalOhms = baseVal * multObj.mult;

    // Format units
    let formatted = '';
    if (totalOhms >= 1000000) {
      formatted = `${(totalOhms / 1000000).toFixed(2)} MΩ`;
    } else if (totalOhms >= 1000) {
      formatted = `${(totalOhms / 1000).toFixed(2)} kΩ`;
    } else {
      formatted = `${totalOhms.toFixed(1)} Ω`;
    }

    return { totalOhms, formatted, tolerance };
  };

  // 9. UPS/IPS Battery Backup
  const solveBattery = () => {
    const ah = parseFloat(batAh) || 150;
    const v = parseFloat(batVoltage) || 12;
    const loadW = parseFloat(batLoadWatts) || 350;
    const eff = (parseFloat(batEfficiency) || 85) / 100;
    const dod = (parseFloat(batDoD) || 80) / 100;

    const totalWh = ah * v;
    const usableWh = totalWh * dod * eff;
    const hours = loadW > 0 ? usableWh / loadW : 0;
    const dischargeAmps = v > 0 ? loadW / (v * eff) : 0;

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return {
      totalWh: totalWh.toFixed(0),
      usableWh: usableWh.toFixed(0),
      duration: `${h} ঘণ্টা ${m} মিনিট (${hours.toFixed(1)} hrs)`,
      dischargeAmps: dischargeAmps.toFixed(1),
    };
  };

  // 10. Earthing Resistance
  const solveEarthing = () => {
    const l = parseFloat(earthLength) || 3; // meters
    const dMm = parseFloat(earthDiameter) || 16;
    const rho = parseFloat(earthResistivity) || 50; // Ohm-m

    const rM = (dMm / 1000) / 2; // radius in meters
    // Dwight's formula for vertical rod: R = (rho / (2 * pi * L)) * (ln(4L / r) - 1)
    let rEarth = 0;
    if (l > 0 && rM > 0) {
      rEarth = (rho / (2 * Math.PI * l)) * (Math.log((4 * l) / rM) - 1);
    }
    const isSafe = rEarth <= 5.0; // standard 5 Ohm threshold

    return {
      rEarth: Math.max(0.1, rEarth).toFixed(2),
      isSafe,
      safetyText: isSafe ? 'Safe (≤ 5.0 Ω Standard)' : 'High Resistance (> 5.0 Ω)! Add earth enhancement compound or parallel rod.',
    };
  };

  // Navigation tabs metadata
  const TABS = [
    { id: 'ohms', labelEn: "Ohm's Law", labelBn: 'ওহমস ল', icon: Cpu },
    { id: 'ac_power', labelEn: '1Ø / 3Ø Power', labelBn: 'এসি পাওয়ার', icon: Zap },
    { id: 'voltage_drop', labelEn: 'Voltage Drop & Cable', labelBn: 'ভোল্টেজ ড্রপ ও তার', icon: Sliders },
    { id: 'motor', labelEn: 'Motor HP & Amps', labelBn: 'মোটর ও HP', icon: Activity },
    { id: 'transformer', labelEn: 'Transformer', labelBn: 'ট্রান্সফরমার', icon: Layers },
    { id: 'power_factor', labelEn: 'PF Capacitor Bank', labelBn: 'পাওয়ার ফ্যাক্টর', icon: Gauge },
    { id: 'breaker', labelEn: 'Breaker & MCB', labelBn: 'সার্কিট ব্রেকার', icon: ShieldAlert },
    { id: 'resistor', labelEn: 'Resistor Color', labelBn: 'রেজিস্টর কোড', icon: Radio },
    { id: 'battery', labelEn: 'IPS / Battery', labelBn: 'আইপিএস ব্যাকআপ', icon: BatteryCharging },
    { id: 'earthing', labelEn: 'Earthing Rod', labelBn: 'আর্থিং রেজিস্ট্যান্স', icon: Anchor },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Safety Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'bn'
            ? 'ইলেকট্রিক্যাল সেফটি সতর্কতা: সকল গণনা আদর্শ সূত্রের ভিত্তিতে প্রস্তুত। প্র্যাকটিক্যাল ওয়্যারিং বা ব্রেকার ইন্সটলেশনের পূর্বে সার্টিফাইড ইঞ্জিনিয়ারের পরামর্শ নিন।'
            : t.disclaimers.electricalSafety}
        </p>
      </div>

      {/* Segmented Electrical Sub-Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-850 rounded-2xl no-scrollbar border border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ElectricalTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OHM'S LAW
         ========================================================================= */}
      {activeTab === 'ohms' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{lang === 'bn' ? 'যেকোনো দুটি ঘরে মান লিখুন (বাকি দুটি স্বয়ংক্রিয় বের হবে):' : 'Enter any two values to solve the other two:'}</span>
              <button
                onClick={() => {
                  setVInput('');
                  setIInput('');
                  setRInput('');
                  setPInput('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.actions.reset}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'ভোল্টেজ (Voltage)' : 'Voltage (V)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={vInput}
                    onChange={(e) => setVInput(e.target.value)}
                    placeholder="Volts"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">V</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'কারেন্ট (Current)' : 'Current (I)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={iInput}
                    onChange={(e) => setIInput(e.target.value)}
                    placeholder="Amps"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">A</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'রোধ (Resistance)' : 'Resistance (R)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rInput}
                    onChange={(e) => setRInput(e.target.value)}
                    placeholder="Ohms"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Ω</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'ওয়াট শক্তি (Power)' : 'Power (P)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pInput}
                    onChange={(e) => setPInput(e.target.value)}
                    placeholder="Watts"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">W</span>
                </div>
              </div>
            </div>
          </div>

          {solveOhms() && (
            <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                {lang === 'bn' ? 'ওহমের সূত্রের ফলাফল:' : "Ohm's Law Result:"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Voltage</span>
                  <span className="text-xl font-mono font-bold text-cyan-400">{solveOhms()?.v.toFixed(2)} V</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Current</span>
                  <span className="text-xl font-mono font-bold text-teal-400">{solveOhms()?.i.toFixed(2)} A</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Resistance</span>
                  <span className="text-xl font-mono font-bold text-amber-400">{solveOhms()?.r.toFixed(2)} Ω</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Power</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{solveOhms()?.p.toFixed(2)} W</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const s = solveOhms();
                  if (s) handleCopyResult("Ohm's Law", `V=${s.v.toFixed(2)}V, I=${s.i.toFixed(2)}A, R=${s.r.toFixed(2)}Ω, P=${s.p.toFixed(2)}W`);
                }}
                className="w-full h-10 mt-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.actions.copied : t.actions.copy}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: AC 1-PHASE / 3-PHASE POWER
         ========================================================================= */}
      {activeTab === 'ac_power' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase System:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setAcPhase('1'); setAcVoltage('220'); }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${acPhase === '1' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'}`}
                >
                  1-Phase (Single)
                </button>
                <button
                  onClick={() => { setAcPhase('3'); setAcVoltage('400'); }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${acPhase === '3' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'}`}
                >
                  3-Phase (Three)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Voltage (V)</label>
                <input
                  type="number"
                  value={acVoltage}
                  onChange={(e) => setAcVoltage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Current (Amps)</label>
                <input
                  type="number"
                  value={acCurrent}
                  onChange={(e) => setAcCurrent(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Power Factor (PF)</label>
                <input
                  type="number"
                  step="0.05"
                  max="1.0"
                  min="0.1"
                  value={acPF}
                  onChange={(e) => setAcPF(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-semibold text-emerald-400">
              {lang === 'bn' ? 'এসি পাওয়ার ত্রিভুজ হিসাব (Power Triangle):' : 'Calculated AC Power Triangle:'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Real Power (kW)</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400 mt-0.5 block">{solveAcPower().realKw} kW</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Apparent (kVA)</span>
                <span className="text-lg font-mono font-extrabold text-cyan-400 mt-0.5 block">{solveAcPower().apparentKva} kVA</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Reactive (kVAR)</span>
                <span className="text-lg font-mono font-extrabold text-amber-400 mt-0.5 block">{solveAcPower().reactiveKvar} kVAR</span>
              </div>
            </div>
            <button
              onClick={() => {
                const res = solveAcPower();
                handleCopyResult('AC Power', `Real Power: ${res.realKw} kW, Apparent: ${res.apparentKva} kVA, Reactive: ${res.reactiveKvar} kVAR`);
              }}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>{t.actions.copy}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: VOLTAGE DROP & WIRE SIZING
         ========================================================================= */}
      {activeTab === 'voltage_drop' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'সাপ্লাই ভোল্টেজ (V)' : 'Supply Voltage'}
                </label>
                <select
                  value={vdVoltage}
                  onChange={(e) => setVdVoltage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                >
                  <option value="220">220V (1-Phase)</option>
                  <option value="230">230V (1-Phase)</option>
                  <option value="400">400V (3-Phase)</option>
                  <option value="415">415V (3-Phase)</option>
                  <option value="12">12V DC</option>
                  <option value="24">24V DC</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'তারের উপাদান (Conductor)' : 'Conductor Material'}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVdMaterial('cu')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${vdMaterial === 'cu' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    Copper (তামা)
                  </button>
                  <button
                    onClick={() => setVdMaterial('al')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${vdMaterial === 'al' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    Aluminum
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'লোড কারেন্ট (Amperes)' : 'Load Current (A)'}
                </label>
                <input
                  type="number"
                  value={vdCurrent}
                  onChange={(e) => setVdCurrent(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'দূরত্ব (One-way Meters)' : 'Distance (Meters)'}
                </label>
                <input
                  type="number"
                  value={vdDistance}
                  onChange={(e) => setVdDistance(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'তারের ক্রস-সেকশন সাইজ (Wire Size in mm²)' : 'Wire Cross-Section (mm²)'}
                </label>
                <select
                  value={vdWireSize}
                  onChange={(e) => setVdWireSize(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                >
                  <option value="1.0">1.0 mm² (~17 AWG)</option>
                  <option value="1.5">1.5 mm² (~15 AWG / 3/22)</option>
                  <option value="2.5">2.5 mm² (~13 AWG / 7/22)</option>
                  <option value="4.0">4.0 mm² (~11 AWG / 7/20)</option>
                  <option value="6.0">6.0 mm² (~9 AWG)</option>
                  <option value="10.0">10.0 mm² (~7 AWG)</option>
                  <option value="16.0">16.0 mm² (~5 AWG)</option>
                  <option value="25.0">25.0 mm² (~3 AWG)</option>
                  <option value="35.0">35.0 mm² (~2 AWG)</option>
                  <option value="50.0">50.0 mm² (~1/0 AWG)</option>
                  <option value="70.0">70.0 mm² (~2/0 AWG)</option>
                  <option value="95.0">95.0 mm² (~3/0 AWG)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const drop = solveVoltageDrop();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">Voltage Drop Evaluation:</span>
                  <span className={`font-bold text-xs ${drop.wireColor}`}>{drop.wireStatus}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Voltage Drop (V)</span>
                    <span className="text-lg font-mono font-bold text-rose-400 mt-0.5 block">{drop.vDrop} V</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Drop Percentage</span>
                    <span className={`text-lg font-mono font-bold mt-0.5 block ${drop.wireColor}`}>{drop.vDropPercent}%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Voltage at End</span>
                    <span className="text-lg font-mono font-bold text-teal-400 mt-0.5 block">{drop.vEnd} V</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 4: MOTOR CURRENT & HP/KW
         ========================================================================= */}
      {activeTab === 'motor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'মোটর ক্ষমতা ইউনিট' : 'Power Unit'}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMotorUnit('hp')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${motorUnit === 'hp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    Horsepower (HP)
                  </button>
                  <button
                    onClick={() => setMotorUnit('kw')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${motorUnit === 'kw' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    Kilowatt (kW)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'মোটরের রেটিং' : 'Motor Rating'}
                </label>
                <input
                  type="number"
                  value={motorPower}
                  onChange={(e) => setMotorPower(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Phase</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMotorPhase('1'); setMotorVoltage('220'); }}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${motorPhase === '1' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    1-Phase (220V)
                  </button>
                  <button
                    onClick={() => { setMotorPhase('3'); setMotorVoltage('400'); }}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${motorPhase === '3' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    3-Phase (400V)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Efficiency (%)</label>
                <input
                  type="number"
                  value={motorEff}
                  onChange={(e) => setMotorEff(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Motor Results */}
          {(() => {
            const m = solveMotor();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-semibold text-emerald-400">Motor Full Load Current & Ratings:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Full Load Amps (FLA)</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">{m.fla} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Starting Current</span>
                    <span className="text-sm font-mono font-bold text-amber-400 mt-1 block">{m.startingCurrent}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Recommended MCB</span>
                    <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5 block">{m.recommendedMcb}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 5: TRANSFORMER SIZING
         ========================================================================= */}
      {activeTab === 'transformer' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'ট্রান্সফরমার ক্ষমতা (kVA)' : 'Transformer Capacity (kVA)'}
                </label>
                <input
                  type="number"
                  value={txKva}
                  onChange={(e) => setTxKva(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'ফেজ সিস্টেম' : 'Phase'}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxPhase('3')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${txPhase === '3' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    3-Phase
                  </button>
                  <button
                    onClick={() => setTxPhase('1')}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold ${txPhase === '1' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    1-Phase
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Primary Voltage (V1)
                </label>
                <input
                  type="number"
                  value={txVPrimary}
                  onChange={(e) => setTxVPrimary(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Secondary Voltage (V2)
                </label>
                <input
                  type="number"
                  value={txVSecondary}
                  onChange={(e) => setTxVSecondary(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const tx = solveTransformer();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-semibold text-emerald-400">Transformer Full Load Currents:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Primary Current (I1)</span>
                    <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5 block">{tx.iPrimary} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Secondary (I2)</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">{tx.iSecondary} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Turns Ratio</span>
                    <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">{tx.ratio} : 1</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 6: POWER FACTOR CORRECTION & CAPACITOR BANK
         ========================================================================= */}
      {activeTab === 'power_factor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Active Load (kW)
                </label>
                <input
                  type="number"
                  value={pfActiveKw}
                  onChange={(e) => setPfActiveKw(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Voltage (V)
                </label>
                <input
                  type="number"
                  value={pfVoltage}
                  onChange={(e) => setPfVoltage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Current Power Factor (cos φ1)
                </label>
                <input
                  type="number"
                  step="0.02"
                  value={pfCurrent}
                  onChange={(e) => setPfCurrent(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Power Factor (cos φ2)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="1.0"
                  value={pfTarget}
                  onChange={(e) => setPfTarget(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const pfc = solvePfc();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-semibold text-emerald-400">Capacitor Bank Requirement:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Required Bank</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-0.5 block">{pfc.kvar} kVAR</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Capacitor Amps</span>
                    <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">{pfc.capAmps} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Line Current Saved</span>
                    <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5 block">{pfc.reductionPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 7: CIRCUIT BREAKER / MCB
         ========================================================================= */}
      {activeTab === 'breaker' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'bn' ? 'মোট কানেক্টেড লোড (Watts)' : 'Total Connected Load (W)'}
                </label>
                <input
                  type="number"
                  value={cbWattage}
                  onChange={(e) => setCbWattage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Voltage (V)
                </label>
                <input
                  type="number"
                  value={cbVoltage}
                  onChange={(e) => setCbVoltage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Power Factor (PF)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={cbPF}
                  onChange={(e) => setCbPF(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Load Characteristic
                </label>
                <button
                  onClick={() => setCbIsContinuous(!cbIsContinuous)}
                  className={`w-full h-10 rounded-xl text-xs font-bold transition ${cbIsContinuous ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {cbIsContinuous ? 'Continuous (125% Safety)' : 'Intermittent (100%)'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const cb = solveBreaker();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-semibold text-emerald-400">Circuit Breaker & Cable Sizing:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Actual Load</span>
                    <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5 block">{cb.opCurrent} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Recommended MCB</span>
                    <span className="text-2xl font-mono font-black text-emerald-400 mt-0.5 block">{cb.recMcb} A</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Min Cable Size</span>
                    <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">{cb.wireMm2} mm²</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 8: RESISTOR COLOR CODE
         ========================================================================= */}
      {activeTab === 'resistor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            {/* Visual Resistor Display */}
            <div className="w-full h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
              <div className="w-3/4 h-8 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 rounded-full flex items-center justify-around px-6 relative shadow-inner">
                {/* Band 1 */}
                <div className="w-3 h-8 shadow-sm" style={{ backgroundColor: COLOR_MAP.find((c) => c.val === band1)?.bg }} />
                {/* Band 2 */}
                <div className="w-3 h-8 shadow-sm" style={{ backgroundColor: COLOR_MAP.find((c) => c.val === band2)?.bg }} />
                {/* Multiplier */}
                <div className="w-3 h-8 shadow-sm" style={{ backgroundColor: COLOR_MAP.find((c) => c.val === multiplier)?.bg }} />
                {/* Tolerance */}
                <div className="w-3 h-8 shadow-sm ml-4" style={{ backgroundColor: tolerance === 5 ? '#d97706' : tolerance === 10 ? '#94a3b8' : '#78350f' }} />
              </div>
            </div>

            {/* Band Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Band 1 (1st Digit)</label>
                <select
                  value={band1}
                  onChange={(e) => setBand1(parseInt(e.target.value))}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold"
                >
                  {COLOR_MAP.filter((c) => c.val >= 1 && c.val <= 9).map((c) => (
                    <option key={`b1-${c.val}`} value={c.val}>
                      {c.name} ({c.val})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Band 2 (2nd Digit)</label>
                <select
                  value={band2}
                  onChange={(e) => setBand2(parseInt(e.target.value))}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold"
                >
                  {COLOR_MAP.filter((c) => c.val >= 0 && c.val <= 9).map((c) => (
                    <option key={`b2-${c.val}`} value={c.val}>
                      {c.name} ({c.val})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Multiplier (10ⁿ)</label>
                <select
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseInt(e.target.value))}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold"
                >
                  {COLOR_MAP.filter((c) => c.val >= 0 && c.val <= 7).map((c) => (
                    <option key={`mult-${c.val}`} value={c.val}>
                      {c.name} (×{c.mult >= 1000000 ? `${c.mult/1000000}M` : c.mult >= 1000 ? `${c.mult/1000}k` : c.mult})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tolerance (±%)</label>
                <select
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value))}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs font-bold"
                >
                  <option value="5">Gold (±5%)</option>
                  <option value="10">Silver (±10%)</option>
                  <option value="1">Brown (±1%)</option>
                  <option value="2">Red (±2%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const res = solveResistor();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Total Resistance Value:</span>
                  <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                    {res.formatted} <span className="text-sm font-normal text-slate-400">±{res.tolerance}%</span>
                  </span>
                </div>
                <button
                  onClick={() => handleCopyResult('Resistor Color Code', `${res.formatted} ±${res.tolerance}%`)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 9: UPS/IPS BATTERY BACKUP
         ========================================================================= */}
      {activeTab === 'battery' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Battery Capacity (Ah)
                </label>
                <input
                  type="number"
                  value={batAh}
                  onChange={(e) => setBatAh(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Battery Voltage (V)
                </label>
                <select
                  value={batVoltage}
                  onChange={(e) => setBatVoltage(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                >
                  <option value="12">12V (Single Battery)</option>
                  <option value="24">24V (2 in series)</option>
                  <option value="48">48V (4 in series)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Total Load (Watts)
                </label>
                <input
                  type="number"
                  value={batLoadWatts}
                  onChange={(e) => setBatLoadWatts(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Inverter Efficiency (%)
                </label>
                <input
                  type="number"
                  value={batEfficiency}
                  onChange={(e) => setBatEfficiency(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const bat = solveBattery();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-semibold text-emerald-400">Estimated Backup Time:</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl col-span-2">
                    <span className="text-[10px] text-slate-400 block">Total Backup Duration</span>
                    <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">{bat.duration}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Battery Current</span>
                    <span className="text-lg font-mono font-bold text-amber-400 mt-1 block">{bat.dischargeAmps} A</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 10: EARTHING RESISTANCE
         ========================================================================= */}
      {activeTab === 'earthing' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Rod Length (Meters)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={earthLength}
                  onChange={(e) => setEarthLength(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Rod Diameter (mm)
                </label>
                <input
                  type="number"
                  value={earthDiameter}
                  onChange={(e) => setEarthDiameter(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Soil Resistivity (ρ in Ω·m)
                </label>
                <select
                  value={earthResistivity}
                  onChange={(e) => setEarthResistivity(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold"
                >
                  <option value="30">Moist garden soil / Clay (30 Ω·m)</option>
                  <option value="50">Normal soil / Farming land (50 Ω·m)</option>
                  <option value="100">Sandy soil / Dry clay (100 Ω·m)</option>
                  <option value="250">Gravel / Sand mixture (250 Ω·m)</option>
                  <option value="1000">Rocky / Mountainous (1000 Ω·m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {(() => {
            const ear = solveEarthing();
            return (
              <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">Earth Resistance:</span>
                  <span className={`font-bold text-xs ${ear.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ear.safetyText}
                  </span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-slate-400">Single Rod Ground Resistance:</span>
                  <span className={`text-2xl font-mono font-black ${ear.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ear.rEarth} Ω
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
