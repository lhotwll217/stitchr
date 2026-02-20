import { Button, Textarea } from '@extension/ui';
import { Send, ImageIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type React from 'react';

interface ChatInputProps {
  onSendMessage: (text: string, image?: File) => void;
  isLoading?: boolean;
  apiKeyMissing?: boolean;
  providerLabel?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  apiKeyMissing = false,
  providerLabel = 'selected provider',
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedImage) {
      return;
    }

    onSendMessage(inputText, selectedImage || undefined);

    // Clear input
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageSelect(file);
        }
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-muted');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-muted');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-muted');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageSelect(file);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Error message if API key is missing */}
      {apiKeyMissing && (
        <div className="mb-4 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="text-xl">⚠️</span>
          <span className="font-bold tracking-tight">
            API key not configured. Please add your {providerLabel} API key in Settings.
          </span>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-4 inline-block animate-in fade-in zoom-in-95 duration-300">
          <div className="relative group overflow-hidden rounded-2xl border-2 border-border shadow-xl">
            <img src={imagePreview} alt="Selected" className="max-h-48 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-2xl scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className="relative flex items-end gap-3 rounded-[2.5rem] border-2 border-border bg-card p-4 shadow-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-500 group"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        {/* Image button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || apiKeyMissing}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 w-12 shrink-0 rounded-full text-muted-foreground bg-muted border-2 border-border hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm active:scale-95"
          title="Add image (Cmd+V)">
          <ImageIcon className="h-6 w-6" />
        </Button>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Message Stitchr..."
          disabled={isLoading || apiKeyMissing}
          className="min-h-[48px] max-h-60 w-full resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-base leading-relaxed selection:bg-primary/20"
        />

        {/* Send button */}
        <Button
          disabled={isLoading || (!inputText.trim() && !selectedImage) || apiKeyMissing}
          onClick={handleSendMessage}
          size="icon"
          title="Send (Enter)"
          className="h-12 w-12 shrink-0 rounded-full mb-0 transition-all active:scale-95 disabled:opacity-30 shadow-lg border-2 border-primary/40 bg-primary text-primary-foreground hover:bg-primary hover:border-primary">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
