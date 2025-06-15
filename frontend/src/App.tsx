import { useState, useEffect } from 'react';
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
  const { currentUser, loading } = useAuth();

  // Redirect authenticated users from landing page to dashboard
  useEffect(() => {
    if (currentUser && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [currentUser, currentPage]);

  const handleNavigate = (page: string) => {
    // Handle authentication redirects
    if (!currentUser && ['home', 'discover', 'post-issue', 'dashboard', 'messages', 'leaderboard', 'profile', 'settings'].includes(page)) {
      setCurrentPage('auth');
      return;
    }

    setCurrentPage(page as Page);
    setSelectedIssueId(null);
  };

  const handleViewIssue = (issueId: string) => {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    setSelectedIssueId(issueId);
    setCurrentPage('home'); // We'll render issue detail instead
  };

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
        return <HomePage onNavigate={handleNavigate} onViewIssue={handleViewIssue} />;
      case 'discover':
        return <DiscoverPage onViewIssue={handleViewIssue} />;
      case 'post-issue':
        return <PostIssuePage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} onViewIssue={handleViewIssue} />;
      case 'messages':
        return <MessagesPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
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