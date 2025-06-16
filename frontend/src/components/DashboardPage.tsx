import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, DollarSign, FileText, TrendingUp, Loader2, AlertCircle, Trophy, Star, Award, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  onViewIssue: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

interface DashboardStats {
  user: {
    xp: number;
    level: number;
    issuesPosted: number;
    issuesFixed: number;
    bountyEarned: number;
    badges: any[];
  };
  issues: {
    total: number;
    open: number;
    inProgress: number;
    solved: number;
    totalViews: number;
    totalUpvotes: number;
  };
  fixes: {
    total: number;
    accepted: number;
    pending: number;
    totalVotes: number;
  };
  comments: {
    total: number;
    totalVotes: number;
  };
}

export function DashboardPage({ onNavigate, onViewIssue, onViewProfile }: DashboardPageProps) {
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [recentFixes, setRecentFixes] = useState<any[]>([]);
  const [trendingIssues, setTrendingIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Refresh user profile to get latest data
        await refreshUserProfile();
        
        // Use the new safeApiCall utility method
        const [statsResponse, recentIssuesResponse, recentFixesResponse, trendingResponse] = await Promise.all([
          apiService.safeApiCall(
            () => apiService.getDashboardStats(),
            { stats: { user: { xp: 0, level: 1, issuesPosted: 0, issuesFixed: 0, bountyEarned: 0, badges: [] }, issues: { total: 0, open: 0, inProgress: 0, solved: 0, totalViews: 0, totalUpvotes: 0 }, fixes: { total: 0, accepted: 0, pending: 0, totalVotes: 0 }, comments: { total: 0, totalVotes: 0 } } }
          ),
          apiService.safeApiCall(
            () => apiService.getRecentIssues({ limit: 5 }),
            { issues: [] }
          ),
          apiService.safeApiCall(
            () => apiService.getRecentFixes({ limit: 5 }),
            { fixes: [] }
          ),
          apiService.safeApiCall(
            () => apiService.getTrendingIssues({ limit: 5 }),
            { issues: [] }
          )
        ]);

        // Check if any of the responses used fallback data
        const usedFallback = statsResponse.fromFallback || 
                            recentIssuesResponse.fromFallback || 
                            recentFixesResponse.fromFallback || 
                            trendingResponse.fromFallback;
        
        if (usedFallback) {
          // Show a warning toast but don't set error state
          toast({
            title: 'Some data unavailable',
            description: 'Using cached data for some sections. Pull to refresh for latest data.',
            variant: 'warning',
          });
        }
        
        setStats(statsResponse.data.stats);
        setRecentIssues(recentIssuesResponse.data.issues || []);
        setRecentFixes(recentFixesResponse.data.fixes || []);
        setTrendingIssues(trendingResponse.data.issues || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
        
        // Set fallback data
        setStats({
          user: { xp: 0, level: 1, issuesPosted: 0, issuesFixed: 0, bountyEarned: 0, badges: [] },
          issues: { total: 0, open: 0, inProgress: 0, solved: 0, totalViews: 0, totalUpvotes: 0 },
          fixes: { total: 0, accepted: 0, pending: 0, totalVotes: 0 },
          comments: { total: 0, totalVotes: 0 }
        });
        setRecentIssues([]);
        setRecentFixes([]);
        setTrendingIssues([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [refreshUserProfile, toast]);

  // Calculate XP progress to next level
  const calculateXpProgress = (xp: number, level: number) => {
    // Ensure we have valid numbers
    const safeXp = Math.max(0, xp || 0);
    const safeLevel = Math.max(1, level || 1);
    
    const xpForNextLevel = safeLevel * 1000;
    const currentLevelXp = (safeLevel - 1) * 1000;
    const xpProgress = safeXp - currentLevelXp;
    const xpNeeded = Math.max(0, xpForNextLevel - safeXp);
    
    // Avoid division by zero
    const levelRange = xpForNextLevel - currentLevelXp;
    const progressPercentage = levelRange > 0 ? Math.min(100, Math.max(0, (xpProgress / levelRange) * 100)) : 0;
    
    return {
      progressPercentage,
      xpNeeded
    };
  };

  // Get badge color based on rarity
  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-purple-500';
      case 'epic': return 'bg-blue-500';
      case 'rare': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get badge icon based on type
  const getBadgeIcon = (badge: any) => {
    if (!badge || !badge.icon) return <Award className="h-8 w-8 text-white" />;
    
    switch (badge.icon) {
      case 'Bug': return <CheckCircle className="h-8 w-8 text-white" />;
      case 'GitMerge': return <CheckCircle className="h-8 w-8 text-white" />;
      case 'Heart': return <Award className="h-8 w-8 text-white" />;
      case 'Zap': return <Star className="h-8 w-8 text-white" />;
      case 'Award': return <Award className="h-8 w-8 text-white" />;
      case 'DollarSign': return <Award className="h-8 w-8 text-white" />;
      case 'Trophy': return <Trophy className="h-8 w-8 text-white" />;
      case 'Star': return <Star className="h-8 w-8 text-white" />;
      default: return <Award className="h-8 w-8 text-white" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome Message Skeleton */}
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">View your activity and stats</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Calculate XP progress
  const { progressPercentage, xpNeeded } = calculateXpProgress(
    userProfile?.xp || 0, 
    userProfile?.level || 1
  );

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userProfile?.username}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(userProfile?.xp || 0).toLocaleString()}</div>
            <Progress value={Math.min(100, progressPercentage)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {xpNeeded.toLocaleString()} XP to next level
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Posted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.issues.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.issues.open || 0} open, {stats?.issues.solved || 0} solved
            </p>
            <Button 
              variant="link" 
              className="px-0 h-auto text-xs mt-2" 
              onClick={() => onNavigate('post-issue')}
            >
              Post a new issue
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fixes.accepted || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.fixes.pending || 0} pending review
            </p>
            <Button 
              variant="link" 
              className="px-0 h-auto text-xs mt-2" 
              onClick={() => onNavigate('discover')}
            >
              Find issues to fix
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounty Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userProfile?.bountyEarned || 0}</div>
            <p className="text-xs text-muted-foreground">
              From {stats?.fixes.accepted || 0} accepted fixes
            </p>
            <Button 
              variant="link" 
              className="px-0 h-auto text-xs mt-2" 
              onClick={() => onNavigate('leaderboard')}
            >
              View leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">My Issues</TabsTrigger>
          <TabsTrigger value="fixes">My Fixes</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Issues */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Recent Issues</CardTitle>
                <Button variant="outline" size="sm" onClick={() => onNavigate('discover')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentIssues.length > 0 ? (
                  <div className="space-y-4">
                    {recentIssues.map((issue) => (
                      <div 
                        key={issue.id} 
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => onViewIssue(issue.id)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium">{issue.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{issue.category}</Badge>
                            <span>•</span>
                            <span>{issue.views || 0} views</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(issue.createdAt))} ago</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={issue.status === 'open' ? 'default' : 'outline'}>
                            {issue.status}
                          </Badge>
                          {issue.bounty > 0 && (
                            <Badge variant="outline">${issue.bounty}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You haven't posted any issues yet</p>
                    <Button onClick={() => onNavigate('post-issue')}>
                      Post Your First Issue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Fixes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Recent Fixes</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('fixes')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentFixes.length > 0 ? (
                  <div className="space-y-4">
                    {recentFixes.map((fix) => (
                      <div 
                        key={fix.id} 
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => fix.issue && onViewIssue(fix.issueId)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium">{fix.issue?.title || 'Issue not found'}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{fix.issue?.category || 'unknown'}</Badge>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(fix.createdAt))} ago</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={fix.isAccepted ? 'default' : 'outline'}>
                            {fix.isAccepted ? 'Accepted' : 'Pending'}
                          </Badge>
                          {fix.bountyAwarded > 0 && (
                            <Badge variant="outline">${fix.bountyAwarded}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You haven't submitted any fixes yet</p>
                    <Button onClick={() => onNavigate('discover')}>
                      Browse Issues to Help
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Trending Issues */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Trending Issues</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('discover')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {trendingIssues.length > 0 ? (
                <div className="space-y-4">
                  {trendingIssues.map((issue) => (
                    <div 
                      key={issue.id} 
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => onViewIssue(issue.id)}
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium">{issue.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{issue.category}</Badge>
                          <span>•</span>
                          <span>by <span 
                            className="cursor-pointer hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (issue.author?.id && onViewProfile) {
                                onViewProfile(issue.author.id);
                              }
                            }}
                          >{issue.author?.username || 'Unknown'}</span></span>
                          <span>•</span>
                          <span>{issue.views || 0} views</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">{issue.upvotes || 0} ↑</Badge>
                        {issue.bounty > 0 && (
                          <Badge variant="outline">${issue.bounty}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No trending issues at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Issues</h2>
            <Button onClick={() => onNavigate('post-issue')}>
              <Plus className="h-4 w-4 mr-2" />
              Post New Issue
            </Button>
          </div>
          
          {recentIssues.length > 0 ? (
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewIssue(issue.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            issue.status === 'open' ? 'bg-emerald-500' :
                            issue.status === 'in-progress' ? 'bg-blue-500' :
                            issue.status === 'solved' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <Badge variant="outline" className="capitalize">
                            {issue.status.replace('-', ' ')}
                          </Badge>
                          {issue.bounty > 0 && (
                            <Badge className="bg-emerald-500">
                              ${issue.bounty}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {issue.description}
                        </p>
                        <div className="flex flex-wrap gap-2 my-2">
                          {issue.tags && issue.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {issue.tags && issue.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{issue.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                          <span>{issue.views} views</span>
                          <span>{issue.comments?.length || 0} comments</span>
                          <span>{issue.fixes?.length || 0} fixes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No issues posted yet</h3>
                <p className="text-muted-foreground mb-4">
                  Share your coding challenges with the community to get help
                </p>
                <Button onClick={() => onNavigate('post-issue')}>
                  Post Your First Issue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="fixes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Fixes</h2>
            <Button onClick={() => onNavigate('discover')}>
              <Plus className="h-4 w-4 mr-2" />
              Find Issues to Fix
            </Button>
          </div>
          
          {recentFixes.length > 0 ? (
            <div className="space-y-4">
              {recentFixes.map((fix) => (
                <Card key={fix.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => fix.issueId && onViewIssue(fix.issueId)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={fix.isAccepted ? "default" : "outline"} className="capitalize">
                            {fix.isAccepted ? 'Accepted' : 'Pending'}
                          </Badge>
                          {fix.bountyAwarded > 0 && (
                            <Badge className="bg-emerald-500">
                              ${fix.bountyAwarded}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">{fix.issue?.title || 'Issue not found'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {fix.description || 'No description provided'}
                        </p>
                        {fix.codeSnippet && (
                          <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                            <pre>{fix.codeSnippet}</pre>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(fix.createdAt), { addSuffix: true })}</span>
                          <span>{fix.votes || 0} votes</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No fixes submitted yet</h3>
                <p className="text-muted-foreground mb-4">
                  Help other developers by providing solutions to their issues
                </p>
                <Button onClick={() => onNavigate('discover')}>
                  Browse Issues to Help
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="badges" className="space-y-4">
          <h2 className="text-xl font-semibold">My Badges</h2>
          
          {userProfile?.badges && Array.isArray(userProfile.badges) && userProfile.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userProfile.badges.map((badge, index) => (
                <Card key={badge?.id || index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${getBadgeColor(badge?.rarity || 'common')} flex items-center justify-center mx-auto mb-4`}>
                      {getBadgeIcon(badge)}
                    </div>
                    <h3 className="font-semibold mb-2">{badge?.name || 'Badge'}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{badge?.description || 'Achievement unlocked'}</p>
                    <Badge variant="outline" className="capitalize">
                      {badge?.rarity || 'common'}
                    </Badge>
                    {badge?.unlockedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Earned {formatDistanceToNow(new Date(badge.unlockedAt), { addSuffix: true })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No badges earned yet</h3>
                <p className="text-muted-foreground mb-4">
                  Earn badges by participating in the community and helping others
                </p>
                <Button onClick={() => onNavigate('discover')}>
                  Start Earning Badges
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Badges to Earn</CardTitle>
              <CardDescription>Complete these achievements to earn more badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-500 w-10 h-10 rounded-full flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Bug Hunter</h4>
                      <p className="text-sm text-muted-foreground">Fix 10 issues</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, (stats?.fixes.accepted || 0) * 10)} className="w-24" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-500 w-10 h-10 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Problem Solver</h4>
                      <p className="text-sm text-muted-foreground">Earn 5000 XP</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, ((userProfile?.xp || 0) / 50))} className="w-24" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-500 w-10 h-10 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Bounty Hunter</h4>
                      <p className="text-sm text-muted-foreground">Earn $500 in bounties</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, ((userProfile?.bountyEarned || 0) / 5))} className="w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}