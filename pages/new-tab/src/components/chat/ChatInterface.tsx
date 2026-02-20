import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { sendChatMessage } from '../../api/chat';
import { fileToBase64 } from '../../api/translate';
import { getSetting } from '../../config/settings';
import { useSettings } from '../../hooks/useSettings';
import { useVocabularyStorage } from '../../hooks/useVocabularyStorage';
import { generateMessageId } from '../../utils/messageHelpers';
import { useEffect, useState } from 'react';
import type { ChatMessage, VocabularySuggestion } from '../../types/chat';

const CHAT_STORAGE_KEY = 'chat-history-v1';
const MAX_MESSAGES = 50;

const ChatInterface = () => {
  const settings = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { vocabulary, addWord } = useVocabularyStorage();

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const result = await chrome.storage.local.get(CHAT_STORAGE_KEY);
        if (result[CHAT_STORAGE_KEY]) {
          setMessages(result[CHAT_STORAGE_KEY]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  // Persist chat history whenever it changes
  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        // Keep only the most recent MAX_MESSAGES messages
        const recentMessages = messages.slice(-MAX_MESSAGES);
        await chrome.storage.local.set({
          [CHAT_STORAGE_KEY]: recentMessages,
        });
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    };

    saveChatHistory();
  }, [messages]);

  const handleSendMessage = async (text: string, image?: File) => {
    if (!settings.apiKey) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        type: 'conversation',
        content: `API key is not configured. Please add your ${settings.providerLabel} API key in Settings.`,
        timestamp: Date.now(),
        error: 'API key missing',
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (!text.trim() && !image) {
      return;
    }

    try {
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        type: 'conversation', // Will be determined by content
        content: text,
        image: image ? await fileToBase64(image) : undefined,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMessage]);

      let imageBase64: string | undefined;
      if (image) {
        imageBase64 = await fileToBase64(image);
      }

      // Call unified API - LLM handles everything (pass message history for context)
      const response = await sendChatMessage(
        settings.provider,
        settings.apiKey,
        settings.model,
        text.trim() || undefined,
        imageBase64,
        settings.nativeLanguage,
        settings.learningLanguage,
        settings.learningLevel,
        getSetting('maxVocabWordsPerTranslation'),
        messages,
      );

      // Update user message type based on response
      userMessage.type = response.type;

      // Add AI response message
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        type: response.type,
        content: response.content,
        extractedText: response.extractedText,
        suggestions: response.suggestions,
        shouldSuperimpose: response.shouldSuperimpose,
        timestamp: Date.now(),
        vocabularyExpanded: false, // Start collapsed
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        type: 'conversation',
        content: 'An error occurred. Please try again.',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVocab = async (suggestion: VocabularySuggestion) => {
    try {
      await addWord({
        nativeWord: suggestion.nativeWord,
        learningWord: suggestion.learningWord,
        nativeLang: suggestion.nativeLang,
        learningLang: suggestion.learningLang,
        source: 'ai',
      });
    } catch (error) {
      console.error('Failed to add vocabulary word:', error);
    }
  };

  const handleRejectVocab = (nativeWord: string) => {
    // Remove from suggestions in all messages
    setMessages(prev =>
      prev.map(msg => {
        if (msg.suggestions) {
          return {
            ...msg,
            suggestions: msg.suggestions.filter(s => s?.nativeWord?.toLowerCase() !== nativeWord.toLowerCase()),
          };
        }
        return msg;
      }),
    );
  };

  const handleToggleVocabularyExpanded = (messageId: string, expanded: boolean) => {
    setMessages(prev => prev.map(msg => (msg.id === messageId ? { ...msg, vocabularyExpanded: expanded } : msg)));
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      try {
        await chrome.storage.local.remove(CHAT_STORAGE_KEY);
        setMessages([]);
      } catch (error) {
        console.error('Failed to clear chat history:', error);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    const hints: Record<string, string> = {
      translate: 'Translate: ',
      image: 'Paste an image with text to translate.',
      learn: 'How do I... ',
    };

    console.log('Quick action clicked:', action, hints[action] || '');
  };

  return (
    <div className="bg-background relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Messages area - optimized for scrolling */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <ChatMessageList
          messages={messages}
          vocabulary={vocabulary}
          isLoadingLast={isLoading}
          onApproveVocab={handleApproveVocab}
          onRejectVocab={handleRejectVocab}
          onToggleVocabularyExpanded={handleToggleVocabularyExpanded}
          onQuickActionClick={handleQuickAction}
        />
      </div>

      {/* Input area - floating and integrated */}
      <div className="z-20 w-full flex-shrink-0 px-10 pb-10 pt-4">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            apiKeyMissing={!settings.apiKey}
            providerLabel={settings.providerLabel}
          />
        </div>
      </div>

      {/* Absolute "Clear" button */}
      <div className="absolute right-10 top-0 z-30 -translate-y-1/2 transform opacity-20 transition-all duration-300 hover:translate-y-2 hover:opacity-100">
        <button
          onClick={handleClearHistory}
          className="text-muted-foreground hover:text-destructive border-border bg-background/80 rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md"
          title="Clear chat history">
          Clear History
        </button>
      </div>
    </div>
  );
};

export { ChatInterface };
