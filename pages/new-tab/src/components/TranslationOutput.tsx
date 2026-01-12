import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@extension/ui';
import { FileText, Languages } from 'lucide-react';

interface TranslationOutputProps {
  translation: string | null;
  extractedText: string | null;
  isLoading: boolean;
  error: string | null;
}

export function TranslationOutput({ translation, extractedText, isLoading, error }: TranslationOutputProps) {
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-destructive">Translation Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!translation) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Languages className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Enter Finnish text or paste an image to see the English translation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {extractedText && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Extracted Text</CardTitle>
              <Badge variant="secondary" className="text-xs">
                From Image
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{extractedText}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">English Translation</CardTitle>
            <Badge className="text-xs">FI → EN</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base whitespace-pre-wrap">{translation}</p>
        </CardContent>
      </Card>
    </div>
  );
}
