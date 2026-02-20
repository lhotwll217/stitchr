import type { ILLMProvider } from '../ports/llm-provider.js';
import type {
  ContentBlock,
  LLMCompletionOpts,
  LLMCompletionResult,
  LLMProviderConfig,
  ModelInfo,
  ProviderId,
} from '../types.js';

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1/messages';

const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    providerId: 'anthropic',
    supportsVision: true,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    providerId: 'anthropic',
    supportsVision: true,
  },
];

type AnthropicContentBlock =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image';
      source: {
        type: 'base64';
        media_type: string;
        data: string;
      };
    };

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: AnthropicContentBlock[];
};

type AnthropicResponse = {
  content?: Array<{ type: 'text'; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const toAnthropicContentBlocks = (content: string | ContentBlock[]): AnthropicContentBlock[] => {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  return content.map(block => {
    if (block.type === 'text') {
      return {
        type: 'text',
        text: block.text,
      };
    }

    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: block.mediaType,
        data: block.data,
      },
    };
  });
};

const toSystemText = (messages: LLMCompletionOpts['messages'], explicitSystem?: string): string | undefined => {
  const systemFromMessages = messages
    .filter(message => message.role === 'system')
    .map(message => {
      if (typeof message.content === 'string') {
        return message.content;
      }

      return message.content
        .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    })
    .filter(Boolean);

  const chunks = [explicitSystem, ...systemFromMessages].filter(Boolean);
  return chunks.length > 0 ? chunks.join('\n\n') : undefined;
};

const extractText = (data: AnthropicResponse): string =>
  (data.content || [])
    .filter(block => block.type === 'text')
    .map(block => block.text || '')
    .join('\n')
    .trim();

export class AnthropicProvider implements ILLMProvider {
  public readonly providerId: ProviderId = 'anthropic';

  public constructor(private readonly config: LLMProviderConfig) {}

  public listModels(): ModelInfo[] {
    return ANTHROPIC_MODELS;
  }

  public async complete(opts: LLMCompletionOpts): Promise<LLMCompletionResult> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is missing');
    }

    const model = opts.model || this.config.model;
    const system = toSystemText(opts.messages, opts.system);
    const messages: AnthropicMessage[] = [];

    for (const message of opts.messages) {
      if (message.role === 'system') {
        continue;
      }

      messages.push({
        role: message.role,
        content: toAnthropicContentBlocks(message.content),
      });
    }

    if (messages.length === 0) {
      throw new Error('At least one non-system message is required');
    }

    const response = await fetch(this.config.baseUrl || DEFAULT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
      throw new Error(`API Error: ${errorMessage}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    return {
      text: extractText(data),
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens ?? 0,
            outputTokens: data.usage.output_tokens ?? 0,
          }
        : undefined,
    };
  }
}
