import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@extension/ui';
import { Sparkles } from 'lucide-react';
import { VocabularySuggestionCard } from './VocabularySuggestionCard';
import type { VocabularySuggestion } from '../api/translate';

interface VocabularySuggestionsProps {
  suggestions: VocabularySuggestion[];
  onApprove: (suggestion: VocabularySuggestion) => void;
  onReject: (from: string) => void;
  isInVocabulary: (from: string) => boolean;
  isLoading?: boolean;
}

export function VocabularySuggestions({
  suggestions,
  onApprove,
  onReject,
  isInVocabulary,
  isLoading,
}: VocabularySuggestionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">Vocabulary Suggestions</CardTitle>
          <span className="text-xs text-muted-foreground">({suggestions.length})</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Click the checkmark to add words to your vocabulary
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map(suggestion => (
          <VocabularySuggestionCard
            key={suggestion.from}
            suggestion={suggestion}
            onApprove={() => onApprove(suggestion)}
            onReject={() => onReject(suggestion.from)}
            isAdded={isInVocabulary(suggestion.from)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
