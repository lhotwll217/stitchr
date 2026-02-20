import { useState, useRef, useCallback } from 'react';
import { Button } from '@extension/ui';
import { Languages, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@extension/ui';

interface MultimodalInputProps {
  onTranslate: (text?: string, image?: File) => Promise<void>;
  isLoading: boolean;
  hasApiKey: boolean;
}

export function MultimodalInput({ onTranslate, isLoading, hasApiKey }: MultimodalInputProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    },
    [handleImageFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        handleImageFile(file);
      }
    },
    [handleImageFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    await onTranslate(text.trim() || undefined, image || undefined);
  };

  const handleClear = () => {
    setText('');
    setImage(null);
    setImagePreview(null);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const canSubmit = (text.trim().length > 0 || image !== null) && !isLoading && hasApiKey;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="input-text" className="text-sm font-medium text-foreground">
          Finnish Text or Image
        </label>
        <div
          className={cn(
            'relative rounded-md border border-input bg-background transition-colors',
            'focus-within:ring-1 focus-within:ring-ring'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}>
          <textarea
            ref={textareaRef}
            id="input-text"
            placeholder="Type or paste Finnish text here... You can also paste or drag an image (Cmd+V / Ctrl+V)"
            value={text}
            onChange={e => setText(e.target.value)}
            onPaste={handlePaste}
            className={cn(
              'w-full min-h-[150px] px-3 py-2 bg-transparent text-base resize-none',
              'placeholder:text-muted-foreground focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            disabled={isLoading}
          />

          {imagePreview && (
            <div className="p-3 border-t border-input">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Pasted image"
                  className="max-h-32 rounded-md border border-border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                Image attached
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Paste an image directly with Cmd+V (Mac) or Ctrl+V (Windows)
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              Translate to English
            </>
          )}
        </Button>
        {(text || image) && (
          <Button type="button" variant="outline" onClick={handleClear} disabled={isLoading}>
            Clear
          </Button>
        )}
      </div>

      {!hasApiKey && (
        <p className="text-sm text-amber-600">Please add an API key in the Settings tab to enable translation.</p>
      )}
    </form>
  );
}
