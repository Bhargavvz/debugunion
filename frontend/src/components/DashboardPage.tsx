import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onViewIssue: (id: string) => void;
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

export function DashboardPage({ onNavigate, onViewIssue }: DashboardPageProps) {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [recentFixes, setRecentFixes] = useState<any[]>([]);
  const [trendingIssues, setTrendingIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard data with individual error handling
        const fetchWithFallback = async (apiCall: () => Promise<any>, fallbackData: any) => {
          try {
            const response = await apiCall();
            return response;
          } catch (error: any) {
            console.warn('API call failed, using fallback:', error.message);
            return { data: fallbackData };
          }
        };

        const [statsResponse, recentIssuesResponse, recentFixesResponse, trendingResponse] = await Promise.all([
          fetchWithFallback(
            () => apiService.getDashboardStats(),
            { stats: { user: { xp: 0, level: 1, issuesPosted: 0, issuesFixed: 0, bountyEarned: 0, badges: [] }, issues: { total: 0, open: 0, inProgress: 0, solved: 0, totalViews: 0, totalUpvotes: 0 }, fixes: { total: 0, accepted: 0, pending: 0, totalVotes: 0 }, comments: { total: 0, totalVotes: 0 } } }
          ),
          fetchWithFallback(
            () => apiService.getRecentIssues({ limit: 5 }),
            { issues: [] }
          ),
          fetchWithFallback(
            () => apiService.getRecentFixes({ limit: 5 }),
            { fixes: [] }
          ),
          fetchWithFallback(
            () => apiService.getTrendingIssues({ limit: 5 }),
            { issues: [] }
          )
        ]);

        setStats(statsResponse.data.stats);
        setRecentIssues(recentIssuesResponse.data.issues || []);
        setRecentFixes(recentFixesResponse.data.fixes || []);
        setTrendingIssues(trendingResponse.data.issues || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your contributions and progress</p>
        </div>
        <Button onClick={() => onNavigate('post-issue')}>
          Post New Issue
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Posted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.user.issuesPosted || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total issues you've posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.user.issuesFixed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total accepted fixes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounty Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.user.bountyEarned || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total bounty earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.user.xp?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Level {stats?.user.level || 1} Developer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            XP Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Level {stats?.user.level || 1} Developer</div>
              <div className="text-sm text-muted-foreground">{stats?.user.xp?.toLocaleString() || 0} XP earned</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Next Level</div>
              <div className="text-xs text-muted-foreground">
                {((stats?.user.level || 1) * 1000) - (stats?.user.xp || 0)} XP needed
              </div>
            </div>
          </div>
          <Progress 
            value={((stats?.user.xp || 0) % 1000) / 10} 
            className="w-full" 
          />
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">My Issues</TabsTrigger>
          <TabsTrigger value="fixes">My Fixes</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
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
                        <Badge variant={
                          issue.status === 'open' ? 'default' :
                          issue.status === 'solved' ? 'secondary' : 'outline'
                        }>
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
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No issues posted yet</p>
                  <Button variant="outline" onClick={() => onNavigate('post-issue')} className="mt-4">
                    Post Your First Issue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Fixes</CardTitle>
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
                        {fix.bountyAwarded && (
                          <Badge variant="secondary">${fix.bountyAwarded}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fixes submitted yet</p>
                  <Button variant="outline" onClick={() => onNavigate('discover')} className="mt-4">
                    Browse Issues to Fix
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Issues</CardTitle>
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
                          <span>by {issue.author?.username || 'Unknown'}</span>
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
                <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trending issues found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}