import { Home, Search, FileText, MessageSquare, Trophy, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const sidebarItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'dashboard', label: 'Dashboard', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:top-16 md:bottom-0 md:left-0 md:border-r md:bg-muted/10">
      <div className="flex flex-col flex-1 min-h-0 pt-4">
        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary/10 text-primary font-medium'
                )}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => onNavigate('settings')}
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}