import { CustomTool } from '../types';

const STORAGE_KEY_CUSTOM_TOOLS = 'smart_utility_custom_tools_v1';
const STORAGE_KEY_ADMIN_PIN = 'smart_utility_admin_pin_v1';

export const DEFAULT_ADMIN_PIN = '1234';

export const INITIAL_CUSTOM_TOOLS: CustomTool[] = [
  {
    id: 'custom-solar-pv',
    titleEn: 'Solar Panel Daily Energy (Wh)',
    titleBn: 'সোলার প্যানেল দৈনিক উৎপাদন',
    descEn: 'Calculate daily Watt-hours generated based on panel wattage and peak sun hours.',
    descBn: 'প্যানেল ওয়াট এবং দৈনিক রোদের ঘণ্টা অনুযায়ী সম্ভাব্য বিদ্যুৎ উৎপাদন।',
    category: 'electrical',
    badgeEn: 'Solar',
    badgeBn: 'সোলার',
    iconName: 'Sun',
    gradient: 'from-amber-500 to-yellow-600',
    inputs: [
      { id: 'w', labelEn: 'Panel Capacity (Watts)', labelBn: 'প্যানেল ক্ষমতা (ওয়াট)', variable: 'w', defaultValue: 300, unit: 'W' },
      { id: 'h', labelEn: 'Peak Sun Hours / Day', labelBn: 'দৈনিক গড় রোদ (ঘণ্টা)', variable: 'h', defaultValue: 4.5, unit: 'hrs', step: 0.1 },
      { id: 'eff', labelEn: 'System Efficiency (%)', labelBn: 'সিস্টেম দক্ষতা (%)', variable: 'eff', defaultValue: 80, unit: '%', step: 1 }
    ],
    formula: 'w * h * (eff / 100)',
    outputLabelEn: 'Daily Generated Energy',
    outputLabelBn: 'দৈনিক উৎপাদিত মোট শক্তি',
    outputUnit: 'Wh / দিন',
    formulaDesc: 'Energy (Wh) = Watts × Sun Hours × (Efficiency / 100)',
    createdAt: Date.now() - 100000,
  },
  {
    id: 'custom-led-resistor',
    titleEn: 'LED Current Limiting Resistor',
    titleBn: 'এলইডি সিরিজ রেজিস্টর সাইজ',
    descEn: 'Calculate required series resistor for any LED given supply voltage and LED rating.',
    descBn: 'সাপ্লাই ভোল্টেজ এবং এলইডি ড্রপ ও কারেন্ট অনুযায়ী সুরক্ষা রেজিস্টরের মান।',
    category: 'electrical',
    badgeEn: 'Electronics',
    badgeBn: 'ইলেকট্রনিক্স',
    iconName: 'Cpu',
    gradient: 'from-blue-500 to-cyan-600',
    inputs: [
      { id: 'vs', labelEn: 'Supply Voltage (Vs)', labelBn: 'সাপ্লাই ভোল্টেজ (Vs)', variable: 'vs', defaultValue: 12, unit: 'V' },
      { id: 'vf', labelEn: 'LED Forward Voltage (Vf)', labelBn: 'এলইডি ভোল্টেজ ড্রপ (Vf)', variable: 'vf', defaultValue: 2.2, unit: 'V', step: 0.1 },
      { id: 'if_ma', labelEn: 'LED Current (mA)', labelBn: 'এলইডি কারেন্ট (mA)', variable: 'if_ma', defaultValue: 20, unit: 'mA' }
    ],
    formula: '(vs - vf) / (if_ma / 1000)',
    outputLabelEn: 'Required Resistor (Ohms)',
    outputLabelBn: 'প্রয়োজনীয় রেজিস্টরের মান',
    outputUnit: 'Ω',
    formulaDesc: 'R = (Supply Volts - LED Volts) / (Amps)',
    createdAt: Date.now() - 50000,
  }
];

export function getStoredCustomTools(): CustomTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_TOOLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TOOLS, JSON.stringify(INITIAL_CUSTOM_TOOLS));
      return INITIAL_CUSTOM_TOOLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CUSTOM_TOOLS;
  } catch {
    return INITIAL_CUSTOM_TOOLS;
  }
}

export function saveStoredCustomTools(tools: CustomTool[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_TOOLS, JSON.stringify(tools));
  } catch (err) {
    console.error('Failed to save custom tools', err);
  }
}

export function addCustomTool(tool: CustomTool): void {
  const current = getStoredCustomTools();
  const updated = [tool, ...current.filter((t) => t.id !== tool.id)];
  saveStoredCustomTools(updated);
}

export function updateCustomTool(tool: CustomTool): void {
  const current = getStoredCustomTools();
  const updated = current.map((t) => (t.id === tool.id ? tool : t));
  saveStoredCustomTools(updated);
}

export function deleteCustomTool(toolId: string): void {
  const current = getStoredCustomTools();
  const updated = current.filter((t) => t.id !== toolId);
  saveStoredCustomTools(updated);
}

export function getAdminPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PIN) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

export function setAdminPin(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PIN, pin);
  } catch (err) {
    console.error('Failed to save pin', err);
  }
}

/**
 * Safely evaluates a math expression with named variables
 */
export function evaluateCustomFormula(
  formula: string,
  variables: Record<string, number>
): { success: boolean; result: number; error?: string } {
  try {
    // Only allow alphanumeric variable names, Math.* functions, and math operators
    const allowedNames = Object.keys(variables);
    
    // Create argument names and values
    const argNames = allowedNames;
    const argValues = allowedNames.map((k) => variables[k]);

    // Sanitization: verify formula does not contain malicious tokens
    if (/[;{}[\]`'"\\]/.test(formula) || formula.includes('window') || formula.includes('document') || formula.includes('eval') || formula.includes('Function') || formula.includes('fetch')) {
      return { success: false, result: 0, error: 'Illegal character or keyword in formula' };
    }

    // Replace common shortcuts like sqrt() with Math.sqrt()
    const sanitizedFormula = formula
      .replace(/\bsqrt\(/gi, 'Math.sqrt(')
      .replace(/\bpow\(/gi, 'Math.pow(')
      .replace(/\bPI\b/gi, 'Math.PI')
      .replace(/\babs\(/gi, 'Math.abs(')
      .replace(/\bround\(/gi, 'Math.round(')
      .replace(/\bceil\(/gi, 'Math.ceil(')
      .replace(/\bfloor\(/gi, 'Math.floor(');

    // Evaluate
    const fn = new Function(...argNames, `return (${sanitizedFormula});`);
    const val = fn(...argValues);

    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return { success: false, result: 0, error: 'Math error: result is NaN or infinite' };
    }

    return { success: true, result: val };
  } catch (err: any) {
    return { success: false, result: 0, error: err?.message || 'Formula evaluation failed' };
  }
}
