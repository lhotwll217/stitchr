import { useState, useCallback } from 'react';
import { useStorage } from '@extension/shared';
import { settingsStorage } from '@extension/storage';
import { translateContent, fileToBase64, type TranslationResponse, type VocabularySuggestion } from '../api/translate';

interface UseTranslationState {
  isLoading: boolean;
  error: string | null;
  translation: string | null;
  extractedText: string | null;
  suggestions: VocabularySuggestion[];
}

export function useTranslation() {
  const settings = useStorage(settingsStorage);

  const [state, setState] = useState<UseTranslationState>({
    isLoading: false,
    error: null,
    translation: null,
    extractedText: null,
    suggestions: [],
  });

  const translate = useCallback(
    async (text?: string, imageFile?: File) => {
      if (!settings?.anthropicApiKey) {
        setState(prev => ({
          ...prev,
          error: 'Please enter your Anthropic API key in the settings below',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        let imageBase64: string | undefined;

        if (imageFile) {
          imageBase64 = await fileToBase64(imageFile);
        }

        const response: TranslationResponse = await translateContent(
          settings.anthropicApiKey,
          text,
          imageBase64,
          settings.nativeLanguage,
          settings.learningLanguage,
          settings.learningLevel
        );

        setState({
          isLoading: false,
          error: null,
          translation: response.translation,
          extractedText: response.extractedText || null,
          suggestions: response.suggestions,
        });

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Translation failed';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [settings]
  );

  const clearTranslation = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      translation: null,
      extractedText: null,
      suggestions: [],
    });
  }, []);

  const removeSuggestion = useCallback((from: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.from.toLowerCase() !== from.toLowerCase()),
    }));
  }, []);

  return {
    ...state,
    translate,
    clearTranslation,
    removeSuggestion,
    hasApiKey: !!settings?.anthropicApiKey,
  };
}
