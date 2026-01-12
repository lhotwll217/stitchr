import { Button, Card, Badge } from '@extension/ui';
import { Check, X, Sparkles } from 'lucide-react';
import type { VocabularySuggestion } from '../api/translate';

interface VocabularySuggestionCardProps {
  suggestion: VocabularySuggestion;
  onApprove: () => void;
  onReject: () => void;
  isAdded?: boolean;
}

export function VocabularySuggestionCard({ suggestion, onApprove, onReject, isAdded }: VocabularySuggestionCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggested
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{suggestion.from}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-primary truncate">{suggestion.to}</span>
          </div>
        </div>

        {isAdded ? (
          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
            <Check className="h-3 w-3 mr-1" />
            Added
          </Badge>
        ) : (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={onApprove}
              title="Add to vocabulary">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
              onClick={onReject}
              title="Dismiss suggestion">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
