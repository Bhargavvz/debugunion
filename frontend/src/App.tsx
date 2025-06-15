import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import { AuthPage } from '@/components/AuthPage';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HomePage } from '@/components/HomePage';
import { DiscoverPage } from '@/components/DiscoverPage';
import { PostIssuePage } from '@/components/PostIssuePage';
import { IssueDetailPage } from '@/components/IssueDetailPage';
import { DashboardPage } from '@/components/DashboardPage';
import { MessagesPage } from '@/components/MessagesPage';
import { LeaderboardPage } from '@/components/LeaderboardPage';
import { ProfilePage } from '@/components/ProfilePage';
import { SettingsPage } from '@/components/SettingsPage';
import { NotFoundPage } from '@/components/NotFoundPage';
import { LoadingPage } from '@/components/LoadingPage';
import { Toaster } from '@/components/ui/sonner';
import { Page } from '@/types';
import './App.css';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { currentUser, loading } = useAuth();

  // Only redirect authenticated users to dashboard if they explicitly navigate to landing
  // This prevents automatic redirect on initial page load
  const handleNavigate = (page: string, params?: any) => {
    // Special handling for landing page navigation when authenticated
    if (page === 'landing' && currentUser) {
      setCurrentPage('dashboard');
      return;
    }

    // Handle authentication redirects for protected pages
    if (!currentUser && ['home', 'discover', 'post-issue', 'dashboard', 'messages', 'leaderboard', 'profile', 'settings'].includes(page)) {
      setCurrentPage('auth');
      return;
    }

    // Reset state when navigating
    setSelectedIssueId(null);
    
    // Handle profile navigation with userId
    if (page === 'profile' && params?.userId) {
      setSelectedUserId(params.userId);
    } else {
      setSelectedUserId(null);
    }

    setCurrentPage(page as Page);
  };

  const handleViewIssue = (issueId: string) => {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    setSelectedIssueId(issueId);
    setCurrentPage('home'); // We'll render issue detail instead
  };
  
  const handleViewProfile = (userId: string) => {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    setSelectedUserId(userId);
    setCurrentPage('profile');
  };

  // Show loading page while authentication is being determined
  if (loading) {
    return <LoadingPage />;
  }

  // Landing page (no authentication required)
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  // Authentication page
  if (currentPage === 'auth') {
    // If user is already authenticated, redirect to dashboard
    if (currentUser) {
      setCurrentPage('dashboard');
      return <LoadingPage />;
    }
    return <AuthPage onNavigate={handleNavigate} />;
  }

  // 404 page
  if (currentPage === 'not-found') {
    return <NotFoundPage onNavigate={handleNavigate} />;
  }

  // Authenticated pages
  if (!currentUser) {
    return <AuthPage onNavigate={handleNavigate} />;
  }

  const renderCurrentPage = () => {
    if (selectedIssueId) {
      return <IssueDetailPage issueId={selectedIssueId} onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage 
          onNavigate={handleNavigate} 
          onViewIssue={handleViewIssue} 
          onViewProfile={handleViewProfile} 
        />;
      case 'discover':
        return <DiscoverPage 
          onViewIssue={handleViewIssue} 
          onViewProfile={handleViewProfile} 
        />;
      case 'post-issue':
        return <PostIssuePage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage 
          onNavigate={handleNavigate} 
          onViewIssue={handleViewIssue} 
          onViewProfile={handleViewProfile} 
        />;
      case 'messages':
        return <MessagesPage onViewProfile={handleViewProfile} />;
      case 'leaderboard':
        return <LeaderboardPage onViewProfile={handleViewProfile} />;
      case 'profile':
        return <ProfilePage 
          onNavigate={handleNavigate} 
          userId={selectedUserId} 
          onViewIssue={handleViewIssue} 
        />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      default:
        return <NotFoundPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        isAuthenticated={!!currentUser}
      />
      <div className="flex pt-16">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;