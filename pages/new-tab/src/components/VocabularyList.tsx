import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, ScrollArea, Badge } from '@extension/ui';
import { BookOpen, Search } from 'lucide-react';
import { VocabularyListItem } from './VocabularyListItem';
import type { VocabularyItem } from '@extension/storage';

interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  onToggle: (from: string) => void;
  onDelete: (from: string) => void;
}

export function VocabularyList({ vocabulary, onToggle, onDelete }: VocabularyListProps) {
  const [search, setSearch] = useState('');

  const filteredVocabulary = useMemo(() => {
    if (!search.trim()) return vocabulary;

    const query = search.toLowerCase();
    return vocabulary.filter(item => item.from.toLowerCase().includes(query) || item.to.toLowerCase().includes(query));
  }, [vocabulary, search]);

  const enabledCount = vocabulary.filter(v => v.enabled !== false).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">My Vocabulary</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {enabledCount} / {vocabulary.length} active
          </Badge>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2">
        {vocabulary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No vocabulary words yet</p>
            <p className="text-xs text-muted-foreground">Translate text to get AI suggestions</p>
          </div>
        ) : filteredVocabulary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No words match "{search}"</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-2">
              {filteredVocabulary.map(item => (
                <VocabularyListItem
                  key={item.from}
                  item={item}
                  onToggle={() => onToggle(item.from)}
                  onDelete={() => onDelete(item.from)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
