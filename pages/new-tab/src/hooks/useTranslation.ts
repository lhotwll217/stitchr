import { useSettings } from './useSettings';
import { fileToBase64, translateContent } from '../api/translate';
import { useCallback, useState } from 'react';
import type { TranslationResponse, VocabularySuggestion } from '../api/translate';

interface UseTranslationState {
  isLoading: boolean;
  error: string | null;
  translation: string | null;
  extractedText: string | null;
  suggestions: VocabularySuggestion[];
}

export const useTranslation = () => {
  const settings = useSettings();

  const [state, setState] = useState<UseTranslationState>({
    isLoading: false,
    error: null,
    translation: null,
    extractedText: null,
    suggestions: [],
  });

  const translate = useCallback(
    async (text?: string, imageFile?: File) => {
      if (!settings.apiKey) {
        setState(prev => ({
          ...prev,
          error: `Please enter your ${settings.providerLabel} API key in Settings`,
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
          settings.provider,
          settings.apiKey,
          settings.model,
          text,
          imageBase64,
          settings.nativeLanguage,
          settings.learningLanguage,
          settings.learningLevel,
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
    [settings],
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

  const removeSuggestion = useCallback((nativeWord: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.nativeWord.toLowerCase() !== nativeWord.toLowerCase()),
    }));
  }, []);

  return {
    ...state,
    translate,
    clearTranslation,
    removeSuggestion,
    hasApiKey: !!settings.apiKey,
  };
};
