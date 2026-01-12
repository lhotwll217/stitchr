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
  from: string;
  to: string;
  fromLang: string;
  toLang: string;
  enabled?: boolean;
  addedAt?: number;
  source?: 'hardcoded' | 'ai' | 'manual';
}

export type VocabularyStorageType = BaseStorageType<VocabularyItem[]> & {
  addWord: (item: Omit<VocabularyItem, 'addedAt'>) => Promise<void>;
  removeWord: (from: string) => Promise<void>;
  toggleWord: (from: string) => Promise<void>;
  updateWord: (from: string, updates: Partial<VocabularyItem>) => Promise<void>;
};

export interface SettingsState {
  anthropicApiKey: string;
  nativeLanguage: string;
  learningLanguage: string;
  learningLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export type SettingsStorageType = BaseStorageType<SettingsState> & {
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
};
