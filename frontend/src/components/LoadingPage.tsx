import { useState, useEffect } from 'react';
import { Loader2, Code, Bug, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  
  const loadingMessages = [
    'Initializing...',
    'Loading user data...',
    'Fetching issues...',
    'Preparing dashboard...',
    'Almost there...',
    'Ready to debug!'
  ];
  
  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Update loading message based on progress
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const messageIndex = Math.min(
        Math.floor(progress / 20),
        loadingMessages.length - 1
      );
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 1000);
    
    return () => {
      clearInterval(messageInterval);
    };
  }, [progress, loadingMessages]);
  
  // Animated icons
  const icons = [
    <Code key="code" className="h-8 w-8 text-blue-500" />,
    <Bug key="bug" className="h-8 w-8 text-red-500" />,
    <Zap key="zap" className="h-8 w-8 text-yellow-500" />
  ];
  
  const [currentIcon, setCurrentIcon] = useState(0);
  
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 1000);
    
    return () => clearInterval(iconInterval);
  }, [icons.length]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-lg font-bold">DU</span>
          </div>
          <span className="text-3xl font-bold">DebugUnion</span>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin absolute text-primary opacity-30" />
            <div className="z-10">
              {icons[currentIcon]}
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Loading DebugUnion</h2>
        <p className="text-muted-foreground mb-4">{loadingMessage}</p>
        
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">{progress}% complete</p>
      </div>
    </div>
  );
}