import { createStorage, StorageEnum } from '../base/index.js';
import type { SettingsState, SettingsStorageType } from '../base/index.js';

const DEFAULT_SETTINGS: SettingsState = {
  anthropicApiKey: '',
  nativeLanguage: 'English',
  learningLanguage: 'Finnish',
  learningLevel: 'B1',
};

const storage = createStorage<SettingsState>('settings-storage-key', DEFAULT_SETTINGS, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const settingsStorage: SettingsStorageType = {
  ...storage,

  setApiKey: async (key: string) => {
    await storage.set(current => ({
      ...current,
      anthropicApiKey: key,
    }));
  },

  clearApiKey: async () => {
    await storage.set(current => ({
      ...current,
      anthropicApiKey: '',
    }));
  },
};
