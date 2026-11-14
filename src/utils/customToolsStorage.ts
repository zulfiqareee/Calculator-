import { CustomTool } from '../types';
import { evaluateSafeMath } from './safeMathParser';

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

export async function pushCustomToolsToServer(tools: CustomTool[]): Promise<boolean> {
  try {
    const res = await fetch('/api/custom-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tools }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch (err) {
    console.warn('[Sync] Could not push custom tools to server (offline or unavailable):', err);
    return false;
  }
}

export async function fetchCustomToolsFromServer(): Promise<CustomTool[]> {
  try {
    const res = await fetch('/api/custom-tools');
    if (!res.ok) return getStoredCustomTools();
    const data = await res.json();
    if (data?.success && Array.isArray(data.tools)) {
      // Merge server tools with local tools (server is authority for admin published tools)
      const local = getStoredCustomTools();
      const serverTools: CustomTool[] = data.tools;
      
      // If server has tools, ensure local storage is updated so offline works
      if (serverTools.length > 0) {
        saveStoredCustomTools(serverTools, false);
        return serverTools;
      } else if (local.length > 0) {
        // If server is empty but local has tools, push local to server so new customers get them
        pushCustomToolsToServer(local).catch(() => {});
      }
      return local;
    }
  } catch (err) {
    console.warn('[Sync] Could not fetch custom tools from server:', err);
  }
  return getStoredCustomTools();
}

export function saveStoredCustomTools(tools: CustomTool[], pushToServer: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_TOOLS, JSON.stringify(tools));
    if (pushToServer) {
      pushCustomToolsToServer(tools).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save custom tools', err);
  }
}

export function addCustomTool(tool: CustomTool): void {
  const current = getStoredCustomTools();
  const updated = [tool, ...current.filter((t) => t.id !== tool.id)];
  saveStoredCustomTools(updated, true);
}

export function updateCustomTool(tool: CustomTool): void {
  const current = getStoredCustomTools();
  const updated = current.map((t) => (t.id === tool.id ? tool : t));
  saveStoredCustomTools(updated, true);
}

export function deleteCustomTool(toolId: string): void {
  const current = getStoredCustomTools();
  const updated = current.filter((t) => t.id !== toolId);
  saveStoredCustomTools(updated, true);
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
 * Safely evaluates a math expression with named variables (zero eval / new Function)
 */
export function evaluateCustomFormula(
  formula: string,
  variables: Record<string, number>
): { success: boolean; result: number; error?: string } {
  const evaluated = evaluateSafeMath(formula, {
    variables,
    angleUnit: 'rad',
    percentageMode: 'modulo',
    logBase: 'e',
  });

  if (!evaluated.success) {
    return {
      success: false,
      result: 0,
      error: evaluated.error || 'Formula evaluation failed',
    };
  }

  return { success: true, result: evaluated.result };
}
