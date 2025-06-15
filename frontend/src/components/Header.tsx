import { Bell, Menu, Plus, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  isAuthenticated: boolean;
}

export function Header({ onNavigate, currentPage, isAuthenticated }: HeaderProps) {
  const { userProfile, logout } = useAuth();
  const unreadNotifications = 0; // We'll implement this later with real notifications

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => onNavigate(isAuthenticated ? 'home' : 'landing')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="text-sm font-bold">DU</span>
          </div>
          <span className="text-xl font-bold">DebugUnion</span>
        </div>

        {/* Search - only show when authenticated */}
        {isAuthenticated && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search issues, tags, users..."
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button 
                variant={currentPage === 'post-issue' ? 'default' : 'ghost'}
                onClick={() => onNavigate('post-issue')}
                className="hidden md:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post Issue
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.avatar} alt="User" />
                      <AvatarFallback>
                        {userProfile?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{userProfile?.username || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {userProfile?.email || ''}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onNavigate('auth')}>
                Sign In
              </Button>
              <Button onClick={() => onNavigate('auth')}>
                Get Started
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}