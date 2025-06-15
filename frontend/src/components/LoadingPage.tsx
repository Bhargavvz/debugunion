import { Loader2 } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-sm font-bold">DU</span>
          </div>
          <span className="text-2xl font-bold">DebugUnion</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}