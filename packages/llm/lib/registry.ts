import { AnthropicProvider } from './adapters/anthropic.adapter.js';
import { OpenAIProvider } from './adapters/openai.adapter.js';
import type { ILLMProvider, LLMProviderConstructor } from './ports/llm-provider.js';
import type { LLMProviderConfig, ProviderId } from './types.js';

const providers = new Map<ProviderId, LLMProviderConstructor>([
  ['anthropic', AnthropicProvider],
  ['openai', OpenAIProvider],
]);

export const createProvider = (config: LLMProviderConfig): ILLMProvider => {
  const Ctor = providers.get(config.providerId);
  if (!Ctor) {
    throw new Error(`Unknown LLM provider: ${config.providerId}`);
  }

  return new Ctor(config);
};

export const getAvailableProviders = (): ProviderId[] => Array.from(providers.keys());
