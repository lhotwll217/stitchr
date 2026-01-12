import { useState } from 'react';
import { useStorage } from '@extension/shared';
import { settingsStorage, type SettingsState } from '@extension/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@extension/ui';
import { Key, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

export function Settings() {
  const settings = useStorage(settingsStorage);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    await settingsStorage.setApiKey(apiKey.trim());
    setApiKey('');
    setSaving(false);
  };

  const handleClearKey = async () => {
    await settingsStorage.clearApiKey();
  };

  const hasKey = !!settings?.anthropicApiKey;
  const maskedKey = settings?.anthropicApiKey
    ? `${settings.anthropicApiKey.slice(0, 10)}...${settings.anthropicApiKey.slice(-4)}`
    : '';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>API Key</CardTitle>
          </div>
          <CardDescription>
            Enter your Anthropic API key to enable translations. Your key is stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  API Key Configured
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {showKey ? settings?.anthropicApiKey : maskedKey}
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
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button onClick={handleSaveKey} disabled={!apiKey.trim() || saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1">
                  console.anthropic.com
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
          <CardDescription>Configure your learning preferences (changes take effect on next translation)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Native Language</label>
              <p className="text-sm text-muted-foreground">{settings?.nativeLanguage || 'English'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Learning</label>
              <p className="text-sm text-muted-foreground">{settings?.learningLanguage || 'Finnish'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <p className="text-sm text-muted-foreground">{settings?.learningLevel || 'B1'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Language settings are currently hardcoded. Customization coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
