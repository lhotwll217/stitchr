export interface VocabularySuggestion {
  from: string;
  to: string;
  fromLang: string;
  toLang: string;
}

export interface TranslationResponse {
  translation: string;
  extractedText?: string;
  suggestions: VocabularySuggestion[];
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function buildPrompt(
  text: string | undefined,
  hasImage: boolean,
  nativeLanguage: string,
  learningLanguage: string,
  level: string
): string {
  // User is learning a new language (learningLanguage) and speaks nativeLanguage
  // They input text in EITHER language and want to see translations
  // Vocabulary: English words -> Finnish translations (to learn Finnish while browsing English sites)
  const imageInstruction = hasImage
    ? `First, extract all readable text from the image. Then translate it.`
    : '';

  return `You are a professional translator and language learning assistant for a ${nativeLanguage} speaker learning ${learningLanguage} at ${level} level.

TASK:
1. ${imageInstruction ? imageInstruction : `Translate the provided text (detect the language and translate to the other language)`}
2. Extract 3-5 useful vocabulary words for learning ${learningLanguage}

${text ? `TEXT TO TRANSLATE:\n"""\n${text}\n"""` : 'Process the image provided.'}

TRANSLATION GUIDELINES:
- If the input is ${nativeLanguage}, translate to ${learningLanguage}
- If the input is ${learningLanguage}, translate to ${nativeLanguage}
- Provide natural, fluent translation

VOCABULARY SELECTION CRITERIA:
- Provide ${nativeLanguage} words with their ${learningLanguage} translations
- These will be used to replace ${nativeLanguage} words on websites with ${learningLanguage} translations
- Practical, commonly-used words at or slightly above ${level} level
- Concrete nouns, common verbs, useful adjectives
- ONE clear translation per word (pragmatic 1:1 mapping)
- Avoid: proper nouns, technical terms, very basic words

Respond in this exact JSON format:
{
  "translation": "Full translation here",
  ${hasImage ? '"extractedText": "The text extracted from the image",' : ''}
  "suggestions": [
    { "from": "${nativeLanguage.toLowerCase()}_word", "to": "${learningLanguage.toLowerCase()}_translation" }
  ]
}

Example suggestions for English speaker learning Finnish:
{ "from": "cold", "to": "kylmä" }
{ "from": "house", "to": "talo" }

Only output valid JSON, no other text.`;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  >;
}

export async function translateContent(
  apiKey: string,
  text?: string,
  imageBase64?: string,
  nativeLanguage = 'English',
  learningLanguage = 'Finnish',
  level = 'B1'
): Promise<TranslationResponse> {
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
    return {
      translation: parsed.translation || '',
      extractedText: parsed.extractedText,
      suggestions: (parsed.suggestions || []).map((s: { from: string; to: string }) => ({
        from: s.from,
        to: s.to,
        fromLang: nativeLanguage, // English word (found on English websites)
        toLang: learningLanguage, // Finnish translation (to help learn Finnish)
      })),
    };
  } catch {
    // If JSON parsing fails, return the raw text as translation
    return {
      translation: responseText,
      suggestions: [],
    };
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
