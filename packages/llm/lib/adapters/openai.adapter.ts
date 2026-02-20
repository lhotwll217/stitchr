import type { ILLMProvider } from '../ports/llm-provider.js';
import type {
  ContentBlock,
  LLMCompletionOpts,
  LLMCompletionResult,
  LLMProviderConfig,
  ModelInfo,
  ProviderId,
} from '../types.js';

// TODO(stitchr): Migrate OpenAI adapter from Chat Completions to Responses API (`/v1/responses`).
// Responses is OpenAI's recommended default for new integrations.
const DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions';

const OPENAI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    providerId: 'openai',
    supportsVision: true,
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 mini',
    providerId: 'openai',
    supportsVision: true,
  },
];

type OpenAIContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: 'text'; text?: string }> | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

const toOpenAIContent = (content: string | ContentBlock[]): string | OpenAIContentPart[] => {
  if (typeof content === 'string') {
    return content;
  }

  return content.map(block => {
    if (block.type === 'text') {
      return {
        type: 'text',
        text: block.text,
      };
    }

    return {
      type: 'image_url',
      image_url: {
        url: `data:${block.mediaType};base64,${block.data}`,
      },
    };
  });
};

const extractText = (data: OpenAIResponse): string => {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (!content) {
    return '';
  }

  return content
    .filter(part => part.type === 'text')
    .map(part => part.text || '')
    .join('\n')
    .trim();
};

export class OpenAIProvider implements ILLMProvider {
  public readonly providerId: ProviderId = 'openai';

  public constructor(private readonly config: LLMProviderConfig) {}

  public listModels(): ModelInfo[] {
    return OPENAI_MODELS;
  }

  public async complete(opts: LLMCompletionOpts): Promise<LLMCompletionResult> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is missing');
    }

    const model = opts.model || this.config.model;
    const messages: OpenAIMessage[] = [];

    if (opts.system) {
      messages.push({ role: 'system', content: opts.system });
    }

    messages.push(
      ...opts.messages.map(message => ({
        role: message.role,
        content: toOpenAIContent(message.content),
      })),
    );

    const response = await fetch(this.config.baseUrl || DEFAULT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        (errorData as { message?: string })?.message ||
        response.statusText;
      throw new Error(`API Error: ${errorMessage}`);
    }

    const data = (await response.json()) as OpenAIResponse;

    return {
      text: extractText(data),
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens ?? 0,
            outputTokens: data.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }
}
