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
      const lowerFrom = item.from.toLowerCase();
      const exists = currentItems.some(i => i.from.toLowerCase() === lowerFrom);

      if (exists) {
        // Update existing word
        return currentItems.map(i =>
          i.from.toLowerCase() === lowerFrom ? { ...i, ...item, addedAt: i.addedAt || Date.now() } : i
        );
      }

      // Add new word
      return [
        ...currentItems,
        {
          ...item,
          enabled: item.enabled ?? true,
          addedAt: Date.now(),
        },
      ];
    });
  },

  removeWord: async (from: string) => {
    const lowerFrom = from.toLowerCase();
    await storage.set(currentItems => currentItems.filter(i => i.from.toLowerCase() !== lowerFrom));
  },

  toggleWord: async (from: string) => {
    const lowerFrom = from.toLowerCase();
    await storage.set(currentItems =>
      currentItems.map(i => (i.from.toLowerCase() === lowerFrom ? { ...i, enabled: !i.enabled } : i))
    );
  },

  updateWord: async (from: string, updates: Partial<VocabularyItem>) => {
    const lowerFrom = from.toLowerCase();
    await storage.set(currentItems =>
      currentItems.map(i => (i.from.toLowerCase() === lowerFrom ? { ...i, ...updates } : i))
    );
  },
};

/**
 * Get only enabled vocabulary items (for word replacement)
 */
export const getActiveVocabulary = async (): Promise<VocabularyItem[]> => {
  const all = await vocabularyStorage.get();
  return all.filter(item => item.enabled !== false);
};

/**
 * Get vocabulary by language pair
 */
export const getVocabularyByLanguagePair = async (fromLang: string, toLang: string): Promise<VocabularyItem[]> => {
  const active = await getActiveVocabulary();
  return active.filter(item => item.fromLang === fromLang && item.toLang === toLang);
};
