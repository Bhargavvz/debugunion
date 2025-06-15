import { useState } from 'react';
import { Trophy, TrendingUp, Award, Crown, Medal, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { mockLeaderboard, mockUsers } from '@/data/mockData';

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'overall' | 'weekly' | 'monthly'>('overall');

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
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {mockLeaderboard.slice(0, 3).map((entry, index) => (
          <Card key={entry.user.id} className={`relative overflow-hidden ${
            index === 0 ? 'ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20' :
            index === 1 ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20' :
            'ring-2 ring-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
          }`}>
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
              <p className="text-sm text-muted-foreground">{entry.user.company}</p>
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
              <div className="flex justify-center mt-3">
                {entry.user.badges.slice(0, 3).map((badge) => (
                  <Badge key={badge.id} variant="outline" className="text-xs mr-1">
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeframe Tabs */}
      <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">All Time</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value={timeframe} className="space-y-4">
          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Full Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLeaderboard.map((entry) => (
                  <div key={entry.user.id} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
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
                        {entry.user.company} • Level {entry.user.level}
                      </p>
                      <div className="flex space-x-1 mt-1">
                        {entry.user.badges.slice(0, 2).map((badge) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#2</div>
            <p className="text-xs text-muted-foreground">
              +1 from last week
            </p>
            <Progress value={75} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              750 XP to next rank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7/10</div>
            <p className="text-xs text-muted-foreground">
              Issues fixed this week
            </p>
            <Progress value={70} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              3 more to reach your goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Badge</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Code Wizard</div>
            <p className="text-xs text-muted-foreground">
              Earn 5000+ XP
            </p>
            <Progress value={50} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              2500 XP remaining
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}