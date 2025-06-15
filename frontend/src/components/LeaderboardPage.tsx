import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Crown, Medal, Star, Loader2, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LeaderboardEntry } from '@/types';

interface LeaderboardPageProps {
  onViewProfile?: (id: string) => void;
}

export function LeaderboardPage({ onViewProfile }: LeaderboardPageProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [timeframe, setTimeframe] = useState<'overall' | 'weekly' | 'monthly'>('overall');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await apiService.getLeaderboard(timeframe);
          if (response.data.leaderboard) {
            setLeaderboard(response.data.leaderboard);
            
            // Find current user's rank
            const currentUserRank = response.data.leaderboard.find(
              (entry: LeaderboardEntry) => entry.user.id === userProfile?.id
            );
            
            setUserRank(currentUserRank || null);
          }
        } catch (apiError: any) {
          // If the endpoint returns 404, use mock data instead
          if (apiError.response && apiError.response.status === 404) {
            console.log('Leaderboard API not available, using mock data');
            
            // Generate mock leaderboard data
            const mockLeaderboard = generateMockLeaderboard();
            setLeaderboard(mockLeaderboard);
            
            // Find or create mock user rank
            const mockUserRank = userProfile ? {
              rank: Math.floor(Math.random() * 20) + 1,
              user: {
                id: userProfile.id,
                username: userProfile.username,
                avatar: userProfile.avatar || '',
              },
              xp: userProfile.xp || 0,
              issuesFixed: userProfile.issuesFixed || 0,
              issuesPosted: userProfile.issuesPosted || 0,
              bountyEarned: userProfile.bountyEarned || 0,
              badges: userProfile.badges?.length || 0
            } : null;
            
            setUserRank(mockUserRank);
          } else {
            throw apiError; // Re-throw if it's not a 404
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load leaderboard',
          variant: 'destructive',
        });
        
        // Set empty leaderboard as fallback
        setLeaderboard([]);
        setUserRank(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to generate mock leaderboard data
    const generateMockLeaderboard = () => {
      const mockUsers = [
        { id: 'user1', username: 'CodeMaster', avatar: '' },
        { id: 'user2', username: 'BugHunter', avatar: '' },
        { id: 'user3', username: 'DevNinja', avatar: '' },
        { id: 'user4', username: 'PixelPerfect', avatar: '' },
        { id: 'user5', username: 'AlgorithmAce', avatar: '' },
        { id: 'user6', username: 'FullStackPro', avatar: '' },
        { id: 'user7', username: 'DataWizard', avatar: '' },
        { id: 'user8', username: 'SecurityGuru', avatar: '' },
        { id: 'user9', username: 'CloudArchitect', avatar: '' },
        { id: 'user10', username: 'UIDesigner', avatar: '' }
      ];
      
      return mockUsers.map((user, index) => ({
        rank: index + 1,
        user,
        xp: 10000 - (index * 500),
        issuesFixed: 50 - (index * 3),
        issuesPosted: 20 - (index),
        bountyEarned: 1000 - (index * 75),
        badges: 10 - index
      }));
    };
    
    fetchLeaderboard();
  }, [timeframe, userProfile, toast]);

  // Filter leaderboard based on search term
  const filteredLeaderboard = searchTerm
    ? leaderboard.filter(entry => 
        entry.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.user.company && entry.user.company.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : leaderboard;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  // Calculate XP needed for next level
  const calculateXpToNextLevel = (xp: number, level: number) => {
    const nextLevelXp = level * 1000;
    return Math.max(0, nextLevelXp - xp);
  };

  // Calculate progress percentage to next level
  const calculateLevelProgress = (xp: number, level: number) => {
    const currentLevelXp = (level - 1) * 1000;
    const nextLevelXp = level * 1000;
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Handle view profile click
  const handleViewProfile = (userId: string) => {
    if (onViewProfile) {
      onViewProfile(userId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">Top developers in the DebugUnion community</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="text-center pb-2">
                <Skeleton className="h-5 w-5 mx-auto mb-2" />
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto mt-2" />
              </CardHeader>
              <CardContent className="text-center">
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Skeleton className="h-5 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Tabs value={timeframe}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overall">All Time</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Full Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">Top developers in the DebugUnion community</p>
          </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">Top developers in the DebugUnion community</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Top 3 Podium */}
      {filteredLeaderboard.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {filteredLeaderboard.slice(0, 3).map((entry, index) => (
            <Card 
              key={entry.user.id} 
              className={`relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                index === 0 ? 'ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20' :
                index === 1 ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20' :
                'ring-2 ring-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
              }`}
              onClick={() => handleViewProfile(entry.user.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={entry.user.avatar} />
                  <AvatarFallback className="text-lg">
                    {entry.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{entry.user.username}</CardTitle>
                <p className="text-sm text-muted-foreground">{entry.user.company || 'Developer'}</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {entry.score.toLocaleString()} XP
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-semibold text-emerald-600">{entry.user.issuesFixed}</div>
                    <div className="text-muted-foreground">Fixed</div>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-600">${entry.user.bountyEarned}</div>
                    <div className="text-muted-foreground">Earned</div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center mt-3 gap-1">
                  {entry.user.badges && entry.user.badges.slice(0, 3).map((badge) => (
                    <Badge key={badge.id} variant="outline" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No results</AlertTitle>
          <AlertDescription>
            No users found matching your search criteria.
          </AlertDescription>
        </Alert>
      )}

      {/* Timeframe Tabs */}
      <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">All Time</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value={timeframe} className="space-y-4 mt-4">
          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Full Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLeaderboard.length > 0 ? (
                <div className="space-y-4">
                  {filteredLeaderboard.map((entry) => (
                    <div 
                      key={entry.user.id} 
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewProfile(entry.user.id)}
                    >
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.user.avatar} />
                        <AvatarFallback>
                          {entry.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{entry.user.username}</h4>
                          {entry.user.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.user.company || 'Developer'} • Level {entry.user.level}
                        </p>
                        <div className="flex flex-wrap space-x-1 mt-1">
                          {entry.user.badges && entry.user.badges.slice(0, 2).map((badge) => (
                            <Badge key={badge.id} variant="outline" className="text-xs">
                              {badge.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">XP</div>
                      </div>
                      
                      <div className="text-right min-w-[60px]">
                        <div className={`text-sm font-medium ${getChangeColor(entry.change)}`}>
                          {getChangeIcon(entry.change)} {Math.abs(entry.change)}
                        </div>
                        <div className="text-xs text-muted-foreground">vs last week</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm min-w-[120px]">
                        <div className="text-center">
                          <div className="font-semibold text-emerald-600">{entry.user.issuesFixed}</div>
                          <div className="text-muted-foreground">Fixed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">${entry.user.bountyEarned}</div>
                          <div className="text-muted-foreground">Earned</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found matching your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Cards */}
      {userRank && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{userRank.rank}</div>
              <p className="text-xs text-muted-foreground">
                {userRank.change > 0 ? `+${userRank.change}` : userRank.change < 0 ? userRank.change : 'No change'} from last week
              </p>
              <Progress 
                value={calculateLevelProgress(userProfile?.xp || 0, userProfile?.level || 1)} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {calculateXpToNextLevel(userProfile?.xp || 0, userProfile?.level || 1).toLocaleString()} XP to next level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Stats</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.issuesFixed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Issues fixed in total
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm font-semibold">{userProfile?.issuesPosted || 0}</div>
                  <div className="text-xs text-muted-foreground">Issues Posted</div>
                </div>
                <div>
                  <div className="text-sm font-semibold">${userProfile?.bountyEarned || 0}</div>
                  <div className="text-xs text-muted-foreground">Bounty Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.badges?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Badges earned
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {userProfile?.badges?.slice(0, 3).map(badge => (
                  <Badge key={badge.id} variant="outline" className="text-xs">
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}