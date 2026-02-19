interface VocabularySuggestion {
  nativeWord: string; // Word in user's native language (for website replacement)
  learningWord: string; // Word in language being learned
  nativeLang: string; // e.g., "English"
  learningLang: string; // e.g., "Finnish"
}

interface TranslationResponse {
  translation: string;
  extractedText?: string;
  suggestions: VocabularySuggestion[];
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const buildPrompt = (
  text: string | undefined,
  hasImage: boolean,
  nativeLanguage: string,
  learningLanguage: string,
  level: string,
): string => {
  const imageInstruction = hasImage ? `First, extract all readable text from the image. Then translate it.` : '';

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

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<
    { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  >;
}

export const translateContent = async (
  apiKey: string,
  text?: string,
  imageBase64?: string,
  nativeLanguage = 'English',
  learningLanguage = 'Finnish',
  level = 'B1',
): Promise<TranslationResponse> => {
  if (!apiKey) {
    throw new Error('Please enter your Anthropic API key in Settings');
  }

  if (!text && !imageBase64) {
    throw new Error('Either text or image is required');
  }

  const hasImage = !!imageBase64;
  const prompt = buildPrompt(text, hasImage, nativeLanguage, learningLanguage, level);

  // Build message content
  const content: AnthropicMessage['content'] = [];

  if (imageBase64) {
    // Extract base64 data and media type
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: match[1],
          data: match[2],
        },
      });
    }
  }

  content.push({
    type: 'text',
    text: prompt,
  });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`API Error: ${errorMessage}`);
  }

  const data = await response.json();
  const responseText = data.content?.[0]?.text || '';

  // Parse JSON response
  try {
    const parsed = JSON.parse(responseText);

    // Only return suggestions if translation was actually needed
    const suggestions =
      parsed.needsTranslation && parsed.suggestions
        ? parsed.suggestions.map((s: { from: string; to: string }) => ({
            nativeWord: s.from, // Native language word (for finding on websites)
            learningWord: s.to, // Learning language word (from the original text)
            nativeLang: nativeLanguage, // e.g., English
            learningLang: learningLanguage, // e.g., Finnish
          }))
        : [];

    return {
      translation: parsed.translation || '',
      extractedText: parsed.extractedText,
      suggestions,
    };
  } catch {
    // If JSON parsing fails, return the raw text as translation
    return {
      translation: responseText,
      suggestions: [],
    };
  }
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export type { TranslationResponse, VocabularySuggestion };
