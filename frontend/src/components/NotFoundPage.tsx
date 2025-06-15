import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="text-6xl font-bold text-primary mb-2">404</div>
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => onNavigate('home')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button variant="outline" onClick={() => onNavigate('discover')} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Browse Issues
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}