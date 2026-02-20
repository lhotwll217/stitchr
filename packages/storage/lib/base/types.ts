import type { StorageEnum } from './index.js';

export type ValueOrUpdateType<D> = D | ((prev: D) => Promise<D> | D);

export type BaseStorageType<D> = {
  get: () => Promise<D>;
  set: (value: ValueOrUpdateType<D>) => Promise<void>;
  getSnapshot: () => D | null;
  subscribe: (listener: () => void) => () => void;
};

export type StorageConfigType<D = string> = {
  /**
   * Assign the {@link StorageEnum} to use.
   * @default Local
   */
  storageEnum?: StorageEnum;
  /**
   * Only for {@link StorageEnum.Session}: Grant Content scripts access to storage area?
   * @default false
   */
  sessionAccessForContentScripts?: boolean;
  /**
   * Keeps state live in sync between all instances of the extension. Like between popup, side panel and content scripts.
   * To allow chrome background scripts to stay in sync as well, use {@link StorageEnum.Session} storage area with
   * {@link StorageConfigType.sessionAccessForContentScripts} potentially also set to true.
   * @see https://stackoverflow.com/a/75637138/2763239
   * @default false
   */
  liveUpdate?: boolean;
  /**
   * An optional props for converting values from storage and into it.
   * @default undefined
   */
  serialization?: {
    /**
     * convert non-native values to string to be saved in storage
     */
    serialize: (value: D) => string;
    /**
     * convert string value from storage to non-native values
     */
    deserialize: (text: string) => D;
  };
};

export interface ThemeStateType {
  theme: 'light' | 'dark';
  isLight: boolean;
}

export type ThemeStorageType = BaseStorageType<ThemeStateType> & {
  toggle: () => Promise<void>;
};

export interface VocabularyItem {
  nativeWord: string; // Word in user's native language (found on websites)
  learningWord: string; // Word in language being learned (replacement)
  nativeLang: string; // e.g., "English"
  learningLang: string; // e.g., "Finnish"
  enabled?: boolean;
  addedAt?: number;
  source?: 'hardcoded' | 'ai' | 'manual';
}

export type VocabularyStorageType = BaseStorageType<VocabularyItem[]> & {
  addWord: (item: Omit<VocabularyItem, 'addedAt'>) => Promise<void>;
  removeWord: (nativeWord: string) => Promise<void>;
  toggleWord: (nativeWord: string) => Promise<void>;
  updateWord: (nativeWord: string, updates: Partial<VocabularyItem>) => Promise<void>;
};

export interface SettingsState {
  provider: 'anthropic' | 'openai';
  apiKeys: {
    anthropic: string;
    openai: string;
  };
  // Legacy field kept for backward compatibility with existing stored data.
  anthropicApiKey: string;
  nativeLanguage: string;
  learningLanguage: string;
  learningLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export type SettingsStorageType = BaseStorageType<SettingsState> & {
  setProvider: (provider: SettingsState['provider']) => Promise<void>;
  setProviderApiKey: (provider: SettingsState['provider'], key: string) => Promise<void>;
  clearProviderApiKey: (provider: SettingsState['provider']) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
};
