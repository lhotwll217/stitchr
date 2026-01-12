import { Button, Switch } from '@extension/ui';
import { Trash2 } from 'lucide-react';
import type { VocabularyItem } from '@extension/storage';

interface VocabularyListItemProps {
  item: VocabularyItem;
  onToggle: () => void;
  onDelete: () => void;
}

export function VocabularyListItem({ item, onToggle, onDelete }: VocabularyListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <Switch checked={item.enabled !== false} onCheckedChange={onToggle} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.enabled === false ? 'text-muted-foreground line-through' : ''}`}>
            {item.from}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`text-primary ${item.enabled === false ? 'text-muted-foreground line-through' : ''}`}>
            {item.to}
          </span>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        title="Delete word">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
