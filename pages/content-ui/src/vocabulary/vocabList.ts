import type { VocabularyItem } from './types';

/**
 * Vocabulary functions - reads directly from Chrome local storage
 * No hardcoded defaults - all words come from user input via the new-tab UI
 */

const STORAGE_KEY = 'vocabulary-storage-key';

/**
 * Load vocabulary from Chrome storage
 */
export const loadVocabularyFromStorage = async (): Promise<VocabularyItem[]> => {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(STORAGE_KEY, result => {
        const stored = result[STORAGE_KEY];
        if (Array.isArray(stored)) {
          resolve(stored);
        } else {
          resolve([]);
        }
      });
    } else {
      resolve([]);
    }
  });
};

/**
 * Get active vocabulary items from storage
 */
export const getActiveVocabulary = async (): Promise<VocabularyItem[]> => {
  const vocabulary = await loadVocabularyFromStorage();
  return vocabulary.filter(item => item.enabled !== false);
};
