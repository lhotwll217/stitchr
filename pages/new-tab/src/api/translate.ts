import { createProvider } from '@extension/llm';
import type { ContentBlock, ProviderId } from '@extension/llm';

interface VocabularySuggestion {
  nativeWord: string;
  learningWord: string;
  nativeLang: string;
  learningLang: string;
}

interface TranslationResponse {
  translation: string;
  extractedText?: string;
  suggestions: VocabularySuggestion[];
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

const buildPrompt = (
  text: string | undefined,
  hasImage: boolean,
  nativeLanguage: string,
  learningLanguage: string,
  level: string,
): string => {
  const imageInstruction = hasImage ? 'First, extract all readable text from the image. Then translate it.' : '';

  return `You are a professional translator and language learning assistant for a ${nativeLanguage} speaker learning ${learningLanguage} at ${level} level.

TASK:
1. Detect the language of the input text
2. ${imageInstruction ? imageInstruction : `Translate ONLY if the text contains ${learningLanguage} - otherwise just respond naturally`}
3. ONLY if translating: extract vocabulary words that are ACTUALLY PRESENT in the source text

${text ? `TEXT:\n"""\n${text}\n"""` : 'Process the image provided.'}

CRITICAL RULES:
- ONLY translate if the input contains ${learningLanguage} text
- If the input is just ${nativeLanguage} text (like "hello" or "what's up"), DO NOT translate - just respond conversationally
- If you DO translate, vocabulary suggestions must be words ACTUALLY IN the original ${learningLanguage} text
- NEVER make up or suggest words that aren't in the source text
- If no translation is needed, return empty suggestions array

TRANSLATION (only when ${learningLanguage} is detected):
- Translate ${learningLanguage} → ${nativeLanguage}
- Provide natural, fluent translation

VOCABULARY (only when translating ${learningLanguage} text):
- ONLY include words that actually appear in the original ${learningLanguage} text
- For each ${learningLanguage} word, provide its ${nativeLanguage} equivalent
- The "from" field should be the ${nativeLanguage} word (for website replacement)
- The "to" field should be the ${learningLanguage} word (from the original text)
- Select 2-4 useful words at or slightly above ${level} level
- Skip: proper nouns, numbers, very common words

Respond in this exact JSON format:
{
  "translation": "Translation here, or empty string if no translation needed",
  "needsTranslation": true/false,
  ${hasImage ? '"extractedText": "The text extracted from the image",' : ''}
  "suggestions": [
    { "from": "${nativeLanguage.toLowerCase()}_word", "to": "${learningLanguage.toLowerCase()}_word_from_text" }
  ]
}

EXAMPLES:

Input: "Hyvää päivää, miten voit?" (Finnish)
Output: { "translation": "Good day, how are you?", "needsTranslation": true, "suggestions": [{"from": "day", "to": "päivää"}, {"from": "how", "to": "miten"}] }

Input: "What's a good restaurant nearby?" (English - no Finnish present)
Output: { "translation": "", "needsTranslation": false, "suggestions": [] }

Input: "Can you help me understand this: talvi on kylmä" (Mixed - Finnish present)
Output: { "translation": "winter is cold", "needsTranslation": true, "suggestions": [{"from": "winter", "to": "talvi"}, {"from": "cold", "to": "kylmä"}] }

Only output valid JSON, no other text.`;
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

const translateContent = async (
  providerId: ProviderId,
  apiKey: string,
  model: string,
  text?: string,
  imageBase64?: string,
  nativeLanguage = 'English',
  learningLanguage = 'Finnish',
  level = 'B1',
): Promise<TranslationResponse> => {
  if (!apiKey) {
    throw new Error(`Please enter your ${PROVIDER_LABELS[providerId]} API key in Settings`);
  }

  if (!text && !imageBase64) {
    throw new Error('Either text or image is required');
  }

  const hasImage = !!imageBase64;
  const prompt = buildPrompt(text, hasImage, nativeLanguage, learningLanguage, level);

  const content: ContentBlock[] = [];

  if (imageBase64) {
    const imageBlock = parseImageBlock(imageBase64);
    if (imageBlock) {
      content.push(imageBlock);
    }
  }

  content.push({
    type: 'text',
    text: prompt,
  });

  const provider = createProvider({
    providerId,
    apiKey,
    model,
  });

  const result = await provider.complete({
    model,
    maxTokens: 2048,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  const responseText = result.text || '';

  try {
    const parsed = JSON.parse(responseText);
    const suggestions =
      parsed.needsTranslation && parsed.suggestions
        ? parsed.suggestions.map((suggestion: { from: string; to: string }) => ({
            nativeWord: suggestion.from,
            learningWord: suggestion.to,
            nativeLang: nativeLanguage,
            learningLang: learningLanguage,
          }))
        : [];

    return {
      translation: parsed.translation || '',
      extractedText: parsed.extractedText,
      suggestions,
    };
  } catch {
    return {
      translation: responseText,
      suggestions: [],
    };
  }
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export { fileToBase64, translateContent };
export type { TranslationResponse, VocabularySuggestion };
