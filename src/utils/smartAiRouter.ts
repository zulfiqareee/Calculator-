import { AIProviderConfig, AIProviderId, AITaskType } from '../types/multiAi';
import {
  getStoredProviders,
  markProviderSuccess,
  markProviderFailure,
} from './aiProviderRegistry';

export interface RouteExecutionResult<T> {
  data: T;
  providerId: AIProviderId;
  providerName: string;
  attemptedProviders: AIProviderId[];
}

export function getEffectiveApiKey(provider: AIProviderConfig): string {
  if (provider.apiKey && provider.apiKey.trim()) {
    return provider.apiKey.trim();
  }
  if (provider.id === 'gemini') {
    return (
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    );
  }
  return '';
}

export async function executeWithSmartFallback<T>(
  taskType: AITaskType,
  executors: {
    [key in AIProviderId]?: (provider: AIProviderConfig, apiKey: string) => Promise<T>;
  },
  offlineFallback: () => Promise<T> | T
): Promise<RouteExecutionResult<T>> {
  const allProviders = getStoredProviders();
  const now = Date.now();

  // Filter eligible providers
  const candidates = allProviders
    .filter((p) => {
      if (!p.enabled) return false;
      if (!p.supportedTasks.includes(taskType)) return false;
      // If was rate limited, check if 60s cool-down has passed
      if (p.status === 'rate_limited' && p.rateLimitResetAt && p.rateLimitResetAt > now) {
        return false;
      }
      // Check key requirement
      const effectiveKey = getEffectiveApiKey(p);
      if (p.id !== 'local_offline' && p.id !== 'pollinations' && !effectiveKey) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  const attempted: AIProviderId[] = [];
  const errors: string[] = [];

  for (const provider of candidates) {
    if (provider.id === 'local_offline') continue; // keep as final fallback

    const executor = executors[provider.id];
    if (!executor) continue;

    attempted.push(provider.id);
    const key = getEffectiveApiKey(provider);

    try {
      const data = await executor(provider, key);
      markProviderSuccess(provider.id);
      return {
        data,
        providerId: provider.id,
        providerName: provider.name,
        attemptedProviders: attempted,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isRateLimit =
        msg.includes('429') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('resource_exhausted');

      console.warn(`[AI Router] ${provider.name} failed on task "${taskType}":`, msg);
      errors.push(`${provider.name}: ${msg}`);
      markProviderFailure(provider.id, msg, isRateLimit);
      // Continue to next provider in loop
    }
  }

  // Final Guarantee: Smart Local Offline Procedural Fallback
  attempted.push('local_offline');
  try {
    const offlineData = await offlineFallback();
    markProviderSuccess('local_offline');
    return {
      data: offlineData,
      providerId: 'local_offline',
      providerName: 'Smart Local Procedural Engine',
      attemptedProviders: attempted,
    };
  } catch (err: any) {
    console.error('[AI Router] Fatal: Local offline fallback failed:', err);
    throw new Error(`All providers failed. Errors: ${errors.join(' | ')}`);
  }
}
