import { createProvider } from '@extension/llm';
import type { ChatMessage, ChatMessageResponse } from '../types/chat';
import type { ContentBlock, LLMMessage, ProviderId } from '@extension/llm';

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

const parseImageBlock = (imageBase64: string): Extract<ContentBlock, { type: 'image' }> | null => {
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    type: 'image',
    mediaType: match[1],
    data: match[2],
  };
};

const buildPrompt = (
  nativeLanguage: string,
  learningLanguage: string,
  level: string,
  maxWordsPerTranslation: number,
): string => `You are a language tutor helping a ${nativeLanguage} speaker learn ${learningLanguage} at ${level} level.

This app builds vocabulary by superimposing ${learningLanguage} words on ${nativeLanguage} websites. When browsing, we replace nativeWord with learningWord (case-insensitive match).

CRITICAL: Only ONE word per sentence maximum. When a ${learningLanguage} word appears surrounded by familiar ${nativeLanguage} context, the brain automatically maps meaning. Multiple replacements per sentence destroys this.

Respond with JSON:
{
  "response": "Your response text",
  "suggestions": [{"learningWord": "...", "nativeWord": "..."}],
  "shouldSuperimpose": true/false
}

Three scenarios:

A) TRANSLATION: User gives ${learningLanguage} text to translate
   - response: Translate to ${nativeLanguage}
   - suggestions: ${maxWordsPerTranslation} words max, ONE per sentence
   - shouldSuperimpose: true

B) NEW VOCABULARY: User asks "How do I say X?" or wants to add a word
   - response: Teach the word briefly
   - suggestions: [{nativeWord: "${nativeLanguage} word", learningWord: "${learningLanguage} word"}]
   - shouldSuperimpose: false (your response is conversational, not a translation)

C) EXPLANATION/OTHER: Grammar, conjugation, general questions
   - response: Explain in ${nativeLanguage}
   - suggestions: [] (empty)
   - shouldSuperimpose: false

IMPORTANT:
- nativeWord is ALWAYS in ${nativeLanguage} (the language found on websites)
- learningWord is ALWAYS in ${learningLanguage}
- shouldSuperimpose=true ONLY for scenario A (pure translations)

Suggestion rules:
- nativeWord must appear EXACTLY in your response (case-insensitive match)
- Pick single common words, not phrases (e.g. "cold" not "very cold")
- Choose words that make sense when replaced in random ${nativeLanguage} text
- Prefer nouns, adjectives, common verbs

Only output valid JSON.`;

const sendChatMessage = async (
  providerId: ProviderId,
  apiKey: string,
  model: string,
  text: string | undefined,
  imageBase64: string | undefined,
  nativeLanguage: string,
  learningLanguage: string,
  level: string,
  maxWordsPerTranslation: number,
  history: ChatMessage[] = [],
): Promise<ChatMessageResponse> => {
  if (!apiKey) {
    throw new Error(`Please enter your ${PROVIDER_LABELS[providerId]} API key in Settings`);
  }

  if (!text && !imageBase64) {
    throw new Error('Message text or image is required');
  }

  const prompt = buildPrompt(nativeLanguage, learningLanguage, level, maxWordsPerTranslation);
  const messageContent: ContentBlock[] = [];

  if (imageBase64) {
    const imageBlock = parseImageBlock(imageBase64);
    if (imageBlock) {
      messageContent.push(imageBlock);
    }
  }

  if (text) {
    messageContent.push({ type: 'text', text });
  } else if (imageBase64) {
    messageContent.push({ type: 'text', text: 'Translate the text in this image.' });
  }

  const recentHistory = history.slice(-10);
  const messages: LLMMessage[] = recentHistory.map(message => ({
    role: message.role,
    content: message.content,
  }));

  messages.push({
    role: 'user',
    content: imageBase64 ? messageContent : (text as string),
  });

  const provider = createProvider({
    providerId,
    apiKey,
    model,
  });

  const result = await provider.complete({
    model,
    maxTokens: 1024,
    system: prompt,
    messages,
  });

  const responseText = result.text || '';

  try {
    let jsonText = responseText.trim();

    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    return {
      content: parsed.response || '',
      suggestions: (parsed.suggestions || []).map((suggestion: { learningWord: string; nativeWord: string }) => ({
        learningWord: suggestion.learningWord,
        nativeWord: suggestion.nativeWord,
        learningLang: learningLanguage,
        nativeLang: nativeLanguage,
      })),
      shouldSuperimpose: parsed.shouldSuperimpose ?? false,
      type: parsed.shouldSuperimpose ? 'translation' : 'conversation',
    };
  } catch {
    return {
      content: responseText,
      suggestions: [],
      shouldSuperimpose: false,
      type: 'conversation',
    };
  }
};

export { sendChatMessage };
