export type ProviderId = 'anthropic' | 'openai';

export interface LLMProviderConfig {
  providerId: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export type ContentBlock =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image';
      mediaType: string;
      data: string;
    };

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
}

export interface LLMCompletionOpts {
  model?: string;
  messages: LLMMessage[];
  system?: string;
  maxTokens?: number;
}

export interface LLMCompletionResult {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: ProviderId;
  supportsVision: boolean;
}
