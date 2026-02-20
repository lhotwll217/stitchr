/**
 * App config - centralized defaults
 */
export const appConfig = {
  // AI config
  defaultProvider: 'anthropic' as const,
  models: {
    anthropic: 'claude-haiku-4-5',
    openai: 'gpt-4o-mini',
  },
  maxVocabWordsPerTranslation: 4,

  // User setting defaults (used when settingsStorage is empty)
  defaults: {
    nativeLanguage: 'English',
    learningLanguage: 'Finnish',
    learningLevel: 'B1' as const,
  },
} as const;

export const getSetting = <K extends keyof typeof appConfig>(key: K): (typeof appConfig)[K] => appConfig[key];
