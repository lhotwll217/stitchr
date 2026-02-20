import { useSettings } from '../hooks/useSettings';
import { settingsStorage } from '@extension/storage';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@extension/ui';
import { Check, ExternalLink, Eye, EyeOff, Key } from 'lucide-react';
import { useState } from 'react';
import type { ProviderId } from '@extension/llm';

const PROVIDER_META: Record<ProviderId, { label: string; keyPlaceholder: string; keyUrl: string }> = {
  anthropic: {
    label: 'Anthropic',
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  openai: {
    label: 'OpenAI',
    keyPlaceholder: 'sk-proj-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
};

const PROVIDERS = Object.keys(PROVIDER_META) as ProviderId[];

const Settings = () => {
  const settings = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeProvider = settings.provider;
  const activeProviderMeta = PROVIDER_META[activeProvider];
  const activeApiKey = settings.apiKeys[activeProvider] || '';
  const hasKey = !!activeApiKey;
  const maskedKey = hasKey ? `${activeApiKey.slice(0, 10)}...${activeApiKey.slice(-4)}` : '';

  const handleProviderChange = async (provider: ProviderId) => {
    setApiKeyInput('');
    setShowKey(false);
    await settingsStorage.setProvider(provider);
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      return;
    }

    setSaving(true);
    await settingsStorage.setProviderApiKey(activeProvider, apiKeyInput.trim());
    setApiKeyInput('');
    setSaving(false);
  };

  const handleClearKey = async () => {
    await settingsStorage.clearProviderApiKey(activeProvider);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="text-primary h-5 w-5" />
            <CardTitle>LLM Provider</CardTitle>
          </div>
          <CardDescription>
            Select your active provider and set API keys per provider. Keys are stored locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="provider" className="text-sm font-medium">
              Active Provider
            </label>
            <select
              id="provider"
              value={activeProvider}
              onChange={event => void handleProviderChange(event.target.value as ProviderId)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1">
              {PROVIDERS.map(provider => (
                <option key={provider} value={provider}>
                  {PROVIDER_META[provider].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map(provider => {
              const configured = !!settings.apiKeys[provider];

              return (
                <Badge
                  key={provider}
                  variant="outline"
                  className={
                    configured ? 'border-green-600 text-green-600' : 'border-muted-foreground text-muted-foreground'
                  }>
                  {configured ? <Check className="mr-1 h-3 w-3" /> : null}
                  {PROVIDER_META[provider].label}: {configured ? 'Configured' : 'Missing'}
                </Badge>
              );
            })}
          </div>

          {hasKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-600 text-green-600">
                  <Check className="mr-1 h-3 w-3" />
                  {activeProviderMeta.label} API Key Configured
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-sm">
                  {showKey ? activeApiKey : maskedKey}
                </code>
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={handleClearKey}>
                Remove API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={activeProviderMeta.keyPlaceholder}
                  value={apiKeyInput}
                  onChange={event => setApiKeyInput(event.target.value)}
                  className="border-input bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                />
                <Button onClick={handleSaveKey} disabled={!apiKeyInput.trim() || saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Get your key from{' '}
                <a
                  href={activeProviderMeta.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline">
                  {activeProviderMeta.label} console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language Settings</CardTitle>
          <CardDescription>
            Configure your learning preferences (changes take effect on next translation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Native Language</p>
              <p className="text-muted-foreground text-sm">{settings.nativeLanguage}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Learning</p>
              <p className="text-muted-foreground text-sm">{settings.learningLanguage}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Level</p>
              <p className="text-muted-foreground text-sm">{settings.learningLevel}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            Language settings are currently hardcoded. Customization coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export { Settings };
