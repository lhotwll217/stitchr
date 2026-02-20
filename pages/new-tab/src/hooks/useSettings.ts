import { appConfig } from '../config/settings';
import { useStorage } from '@extension/shared';
import { settingsStorage } from '@extension/storage';
import type { ProviderId } from '@extension/llm';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

/**
 * Returns settings with defaults + provider/key normalization already applied.
 */
export const useSettings = () => {
  const stored = useStorage(settingsStorage);

  const provider = (stored?.provider || appConfig.defaultProvider) as ProviderId;
  const apiKeys = {
    anthropic: stored?.apiKeys?.anthropic || stored?.anthropicApiKey || '',
    openai: stored?.apiKeys?.openai || '',
  };

  return {
    provider,
    providerLabel: PROVIDER_LABELS[provider],
    apiKeys,
    apiKey: apiKeys[provider] || null,
    model: appConfig.models[provider],
    nativeLanguage: stored?.nativeLanguage || appConfig.defaults.nativeLanguage,
    learningLanguage: stored?.learningLanguage || appConfig.defaults.learningLanguage,
    learningLevel: stored?.learningLevel || appConfig.defaults.learningLevel,
  };
};
