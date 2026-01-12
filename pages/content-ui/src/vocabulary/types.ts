export interface VocabularyItem {
  from: string;
  to: string;
  fromLang: string;
  toLang: string;
  enabled?: boolean;
  addedAt?: number;
  source?: 'hardcoded' | 'ai' | 'manual';
}
