import { CustomTool } from '../types';

const STORAGE_KEY_CUSTOM_TOOLS = 'smart_utility_custom_tools_v1';
const STORAGE_KEY_ADMIN_PIN = 'smart_utility_admin_pin_v1';

export const DEFAULT_ADMIN_PIN = '1234';

export const INITIAL_CUSTOM_TOOLS: CustomTool[] = [];

export function getStoredCustomTools(): CustomTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_TOOLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TOOLS, JSON.stringify(INITIAL_CUSTOM_TOOLS));
      return INITIAL_CUSTOM_TOOLS;
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : INITIAL_CUSTOM_TOOLS;
    // Filter out deleted tools if previously saved in user localStorage
    const filtered = list.filter((t: CustomTool) => t.id !== 'custom-solar-pv' && t.id !== 'custom-led-resistor');
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TOOLS, JSON.stringify(filtered));
    }
    return filtered;
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
