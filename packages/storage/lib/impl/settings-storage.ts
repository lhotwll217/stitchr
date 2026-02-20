import { createStorage, StorageEnum } from '../base/index.js';
import type { SettingsState, SettingsStorageType, ValueOrUpdateType } from '../base/index.js';

type PartialSettingsState = Partial<SettingsState> | null | undefined;

const DEFAULT_SETTINGS: SettingsState = {
  provider: 'anthropic',
  apiKeys: {
    anthropic: '',
    openai: '',
  },
  anthropicApiKey: '',
  nativeLanguage: 'English',
  learningLanguage: 'Finnish',
  learningLevel: 'B1',
};

const normalizeSettings = (settings: PartialSettingsState): SettingsState => {
  const raw = settings ?? {};
  const provider = raw.provider === 'openai' ? 'openai' : 'anthropic';

  const anthropicApiKey =
    raw.apiKeys?.anthropic ??
    (typeof raw.anthropicApiKey === 'string' ? raw.anthropicApiKey : DEFAULT_SETTINGS.anthropicApiKey);

  return {
    provider,
    apiKeys: {
      anthropic: anthropicApiKey,
      openai: raw.apiKeys?.openai ?? DEFAULT_SETTINGS.apiKeys.openai,
    },
    anthropicApiKey,
    nativeLanguage: raw.nativeLanguage ?? DEFAULT_SETTINGS.nativeLanguage,
    learningLanguage: raw.learningLanguage ?? DEFAULT_SETTINGS.learningLanguage,
    learningLevel: raw.learningLevel ?? DEFAULT_SETTINGS.learningLevel,
  };
};

const isAlreadyNormalized = (settings: PartialSettingsState, normalized: SettingsState): boolean => {
  const raw = settings ?? {};

  return (
    raw.provider === normalized.provider &&
    raw.anthropicApiKey === normalized.anthropicApiKey &&
    raw.nativeLanguage === normalized.nativeLanguage &&
    raw.learningLanguage === normalized.learningLanguage &&
    raw.learningLevel === normalized.learningLevel &&
    raw.apiKeys?.anthropic === normalized.apiKeys.anthropic &&
    raw.apiKeys?.openai === normalized.apiKeys.openai
  );
};

const storage = createStorage<SettingsState>('settings-storage-key', DEFAULT_SETTINGS, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

const setNormalized = async (valueOrUpdate: ValueOrUpdateType<SettingsState>) => {
  await storage.set(async currentRaw => {
    const current = normalizeSettings(currentRaw);
    const next = typeof valueOrUpdate === 'function' ? await valueOrUpdate(current) : valueOrUpdate;

    return normalizeSettings(next);
  });
};

const migrateLegacySettings = async () => {
  const current = await storage.get();
  const normalized = normalizeSettings(current);

  if (!isAlreadyNormalized(current, normalized)) {
    await storage.set(normalized);
  }
};

void migrateLegacySettings();

export const settingsStorage: SettingsStorageType = {
  ...storage,
  set: setNormalized,

  setProvider: async provider => {
    await setNormalized(current => ({
      ...current,
      provider,
    }));
  },

  setProviderApiKey: async (provider, key) => {
    const trimmedKey = key.trim();

    await setNormalized(current => {
      const apiKeys = {
        ...current.apiKeys,
        [provider]: trimmedKey,
      };

      return {
        ...current,
        apiKeys,
        anthropicApiKey: apiKeys.anthropic,
      };
    });
  },

  clearProviderApiKey: async provider => {
    await setNormalized(current => {
      const apiKeys = {
        ...current.apiKeys,
        [provider]: '',
      };

      return {
        ...current,
        apiKeys,
        anthropicApiKey: apiKeys.anthropic,
      };
    });
  },

  // Backward-compatible helpers that map to Anthropic key operations.
  setApiKey: async key => {
    await settingsStorage.setProviderApiKey('anthropic', key);
  },

  clearApiKey: async () => {
    await settingsStorage.clearProviderApiKey('anthropic');
  },
};
