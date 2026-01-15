import { createStorage, StorageEnum } from '../base/index.js';
import type { VocabularyItem, VocabularyStorageType } from '../base/index.js';

/**
 * Vocabulary storage - uses Chrome local storage only
 * No hardcoded defaults - all words come from user input
 */
const storage = createStorage<VocabularyItem[]>(
  'vocabulary-storage-key',
  [], // Empty array - no hardcoded defaults
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const vocabularyStorage: VocabularyStorageType = {
  ...storage,

  addWord: async (item: Omit<VocabularyItem, 'addedAt'>) => {
    await storage.set(currentItems => {
      // Filter out legacy items with old field names (from/to instead of nativeWord/learningWord)
      const validItems = currentItems.filter(i => i.nativeWord && i.learningWord);

      const lowerNative = item.nativeWord.toLowerCase();
      const exists = validItems.some(i => i.nativeWord.toLowerCase() === lowerNative);

      if (exists) {
        return validItems.map(i =>
          i.nativeWord.toLowerCase() === lowerNative ? { ...i, ...item, addedAt: i.addedAt || Date.now() } : i,
        );
      }

      return [
        ...validItems,
        {
          ...item,
          enabled: item.enabled ?? true,
          addedAt: Date.now(),
        },
      ];
    });
  },

  removeWord: async (nativeWord: string) => {
    const lowerNative = nativeWord.toLowerCase();
    await storage.set(currentItems => {
      const validItems = currentItems.filter(i => i.nativeWord && i.learningWord);
      return validItems.filter(i => i.nativeWord.toLowerCase() !== lowerNative);
    });
  },

  toggleWord: async (nativeWord: string) => {
    const lowerNative = nativeWord.toLowerCase();
    await storage.set(currentItems => {
      const validItems = currentItems.filter(i => i.nativeWord && i.learningWord);
      return validItems.map(i => (i.nativeWord.toLowerCase() === lowerNative ? { ...i, enabled: !i.enabled } : i));
    });
  },

  updateWord: async (nativeWord: string, updates: Partial<VocabularyItem>) => {
    const lowerNative = nativeWord.toLowerCase();
    await storage.set(currentItems => {
      const validItems = currentItems.filter(i => i.nativeWord && i.learningWord);
      return validItems.map(i => (i.nativeWord.toLowerCase() === lowerNative ? { ...i, ...updates } : i));
    });
  },
};

/**
 * Get only enabled vocabulary items (for word replacement)
 */
export const getActiveVocabulary = async (): Promise<VocabularyItem[]> => {
  const all = await vocabularyStorage.get();
  // Filter legacy items and get only enabled ones
  return all.filter(item => item.nativeWord && item.learningWord && item.enabled !== false);
};

/**
 * Get vocabulary by language pair
 */
export const getVocabularyByLanguagePair = async (
  nativeLang: string,
  learningLang: string,
): Promise<VocabularyItem[]> => {
  const active = await getActiveVocabulary();
  return active.filter(item => item.nativeLang === nativeLang && item.learningLang === learningLang);
};
