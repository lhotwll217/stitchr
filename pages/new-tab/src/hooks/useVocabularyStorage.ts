import { useStorage } from '@extension/shared';
import { vocabularyStorage, type VocabularyItem } from '@extension/storage';
import { useMemo, useCallback } from 'react';

export function useVocabularyStorage() {
  const rawVocabulary = useStorage(vocabularyStorage);

  // Ensure vocabulary is always an array (handle null/undefined from storage)
  const vocabulary = useMemo(() => {
    if (!rawVocabulary || !Array.isArray(rawVocabulary)) {
      return [];
    }
    return rawVocabulary;
  }, [rawVocabulary]);

  // Get active (enabled) vocabulary
  const activeVocabulary = useMemo(() => {
    return vocabulary.filter(item => item.enabled !== false);
  }, [vocabulary]);

  // Add a new word
  const addWord = useCallback(async (item: Omit<VocabularyItem, 'addedAt'>) => {
    await vocabularyStorage.addWord(item);
  }, []);

  // Remove a word
  const removeWord = useCallback(async (from: string) => {
    await vocabularyStorage.removeWord(from);
  }, []);

  // Toggle word enabled state
  const toggleWord = useCallback(async (from: string) => {
    await vocabularyStorage.toggleWord(from);
  }, []);

  // Check if a word exists in vocabulary
  const hasWord = useCallback(
    (from: string) => {
      return vocabulary.some(item => item.from.toLowerCase() === from.toLowerCase());
    },
    [vocabulary]
  );

  return {
    vocabulary,
    activeVocabulary,
    addWord,
    removeWord,
    toggleWord,
    hasWord,
    count: vocabulary.length,
    activeCount: activeVocabulary.length,
  };
}
