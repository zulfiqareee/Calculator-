import { AIProviderConfig, AIProviderId, AITaskType } from '../types/multiAi';

const STORAGE_KEY_PROVIDERS = 'smart_ai_provider_registry_v2';

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini 3.8 Flash',
    supportedTasks: ['script_generation', 'scene_prompts', 'text_to_speech', 'seo_metadata'],
    priority: 1,
    enabled: true,
    hasApiKey: false,
    apiKey: '',
    status: 'active',
    successCount: 0,
    failureCount: 0,
    freeTierInfo: 'গুগল এআই স্টুডিও ফ্রি টিয়ার (১৫ আরপিএম / ১৫০০ দৈনিক রিকোয়েস্ট)',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Llama 3.3 70B / Mixtral)',
    supportedTasks: ['script_generation', 'scene_prompts', 'seo_metadata'],
    priority: 2,
    enabled: true,
    hasApiKey: false,
    apiKey: '',
    status: 'active',
    successCount: 0,
    failureCount: 0,
    freeTierInfo: 'গ্রোক ফ্রি টিয়ার (৩০ আরপিএম / ১৪,৪০০ দৈনিক রিকোয়েস্ট)',
  },
  {
    id: 'pollinations',
    name: 'Pollinations AI (Free Visuals)',
    supportedTasks: ['image_generation'],
    priority: 1,
    enabled: true,
    hasApiKey: true,
    apiKey: '',
    status: 'active',
    successCount: 0,
    failureCount: 0,
    freeTierInfo: 'সম্পূর্ণ উন্মুক্ত ও বিনামূল্যে এআই ইমেজ জেনারেশন (জিরো বিলিং)',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference (FLUX / SDXL)',
    supportedTasks: ['image_generation', 'scene_prompts'],
    priority: 3,
    enabled: false,
    hasApiKey: false,
    apiKey: '',
    status: 'active',
    successCount: 0,
    failureCount: 0,
    freeTierInfo: 'হাগিং ফেস ফ্রি সার্ভারলেস ইনফারেন্স (ফ্রি টোকেন প্রযোজ্য)',
  },
  {
    id: 'local_offline',
    name: 'Smart Local Procedural Engine',
    supportedTasks: [
      'script_generation',
      'scene_prompts',
      'image_generation',
      'text_to_speech',
      'seo_metadata',
      'video_rendering',
    ],
    priority: 99,
    enabled: true,
    hasApiKey: true,
    apiKey: '',
    status: 'active',
    successCount: 0,
    failureCount: 0,
    freeTierInfo: '১০০% অফলাইন প্রসিডিউরাল এআই ব্যাকআপ (কখনো ফেল করবে না)',
  },
];

export function getStoredProviders(): AIProviderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    if (!raw) return DEFAULT_PROVIDERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default providers in case new providers were introduced
      return DEFAULT_PROVIDERS.map((def) => {
        const found = parsed.find((p: any) => p.id === def.id);
        if (found) {
          return {
            ...def,
            ...found,
            hasApiKey: def.id === 'local_offline' || def.id === 'pollinations' || !!found.apiKey,
          };
        }
        return def;
      });
    }
    return DEFAULT_PROVIDERS;
  } catch (err) {
    console.error('Failed to load AI providers from storage:', err);
    return DEFAULT_PROVIDERS;
  }
}

export const getAllProviders = getStoredProviders;

export function saveStoredProviders(providers: AIProviderConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
  } catch (err) {
    console.error('Failed to save AI providers to storage:', err);
  }
}

export function updateProviderConfig(
  providerId: AIProviderId,
  updates: Partial<AIProviderConfig>
): AIProviderConfig[] {
  const current = getStoredProviders();
  const updated = current.map((p) => {
    if (p.id === providerId) {
      const merged = { ...p, ...updates };
      if (updates.apiKey !== undefined) {
        merged.hasApiKey = !!updates.apiKey.trim() || p.id === 'local_offline' || p.id === 'pollinations';
      }
      return merged;
    }
    return p;
  });
  saveStoredProviders(updated);
  return updated;
}

export function markProviderSuccess(providerId: AIProviderId): void {
  const current = getStoredProviders();
  const updated = current.map((p) => {
    if (p.id === providerId) {
      return {
        ...p,
        status: 'active' as const,
        lastUsedAt: Date.now(),
        lastError: null,
        successCount: (p.successCount || 0) + 1,
      };
    }
    return p;
  });
  saveStoredProviders(updated);
}

export function markProviderFailure(
  providerId: AIProviderId,
  errorMsg: string,
  isRateLimit = false
): void {
  const current = getStoredProviders();
  const updated = current.map((p) => {
    if (p.id === providerId) {
      return {
        ...p,
        status: (isRateLimit ? 'rate_limited' : 'error') as any,
        lastUsedAt: Date.now(),
        lastError: errorMsg,
        failureCount: (p.failureCount || 0) + 1,
        rateLimitResetAt: isRateLimit ? Date.now() + 60 * 1000 : undefined, // 1 min cool-off
      };
    }
    return p;
  });
  saveStoredProviders(updated);
}

export function resetProviderStats(): void {
  const current = getStoredProviders();
  const updated = current.map((p) => ({
    ...p,
    status: p.enabled ? ('active' as const) : ('disabled' as const),
    lastError: null,
    successCount: 0,
    failureCount: 0,
  }));
  saveStoredProviders(updated);
}
