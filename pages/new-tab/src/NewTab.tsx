import '@src/NewTab.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import {
  cn,
  ErrorDisplay,
  LoadingSpinner,
  ToggleButton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  TooltipProvider,
} from '@extension/ui';

import { MultimodalInput } from './components/MultimodalInput';
import { TranslationOutput } from './components/TranslationOutput';
import { VocabularySuggestions } from './components/VocabularySuggestions';
import { VocabularyList } from './components/VocabularyList';
import { Settings } from './components/Settings';
import { useTranslation } from './hooks/useTranslation';
import { useVocabularyStorage } from './hooks/useVocabularyStorage';
import type { VocabularySuggestion } from './api/translate';
import { Settings as SettingsIcon } from 'lucide-react';

const NewTab = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const translation = useTranslation();
  const vocabulary = useVocabularyStorage();

  const handleTranslate = async (text?: string, image?: File) => {
    await translation.translate(text, image);
  };

  const handleApproveSuggestion = async (suggestion: VocabularySuggestion) => {
    await vocabulary.addWord({
      from: suggestion.from,
      to: suggestion.to,
      fromLang: suggestion.fromLang,
      toLang: suggestion.toLang,
      enabled: true,
      source: 'ai',
    });
  };

  const handleRejectSuggestion = (from: string) => {
    translation.removeSuggestion(from);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'App min-h-screen flex flex-col transition-colors duration-200',
          isLight ? 'bg-background' : 'dark bg-background'
        )}>
        <header className="flex w-full items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-extrabold text-transparent">
              Stitchr
            </h1>
            <Badge variant="secondary" className="text-xs">
              FI → EN
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <ToggleButton>{isLight ? 'Dark Mode' : 'Light Mode'}</ToggleButton>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Tabs defaultValue="translate" className="w-full max-w-6xl mx-auto">
            <TabsList className="mb-6">
              <TabsTrigger value="translate">Translate</TabsTrigger>
              <TabsTrigger value="vocabulary" className="gap-2">
                My Vocabulary
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {vocabulary.count}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="translate" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Input */}
                <div className="space-y-4">
                  <MultimodalInput
                    onTranslate={handleTranslate}
                    isLoading={translation.isLoading}
                    hasApiKey={translation.hasApiKey}
                  />
                </div>

                {/* Right Column - Output & Suggestions */}
                <div className="space-y-4">
                  <TranslationOutput
                    translation={translation.translation}
                    extractedText={translation.extractedText}
                    isLoading={translation.isLoading}
                    error={translation.error}
                  />

                  <VocabularySuggestions
                    suggestions={translation.suggestions}
                    onApprove={handleApproveSuggestion}
                    onReject={handleRejectSuggestion}
                    isInVocabulary={vocabulary.hasWord}
                    isLoading={translation.isLoading}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vocabulary" className="mt-0">
              <div className="max-w-3xl mx-auto">
                <VocabularyList
                  vocabulary={vocabulary.vocabulary}
                  onToggle={vocabulary.toggleWord}
                  onDelete={vocabulary.removeWord}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Settings />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="w-full py-4 text-center border-t border-border">
          <p className="text-sm text-muted-foreground">Stitchr Extension v0.1.0</p>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
