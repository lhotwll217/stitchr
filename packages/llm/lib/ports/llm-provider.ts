import type { LLMCompletionOpts, LLMCompletionResult, LLMProviderConfig, ModelInfo, ProviderId } from '../types.js';

export interface ILLMProvider {
  readonly providerId: ProviderId;
  complete(opts: LLMCompletionOpts): Promise<LLMCompletionResult>;
  listModels(): ModelInfo[];
}

export type LLMProviderConstructor = new (config: LLMProviderConfig) => ILLMProvider;
