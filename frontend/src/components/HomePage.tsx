import { useState, useEffect } from 'react';
import { ArrowRight, Code, Users, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IssueCard } from './IssueCard';
import { apiService } from '@/lib/api';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onViewIssue: (id: string) => void;
}

interface HomeStats {
  totalIssues: number;
  totalUsers: number;
  totalBountyPaid: number;
}

export function HomePage({ onNavigate, onViewIssue }: HomePageProps) {
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [topFixers, setTopFixers] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [stats, setStats] = useState<HomeStats>({
    totalIssues: 0,
    totalUsers: 0,
    totalBountyPaid: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch all home page data in parallel
        const [recentIssuesRes, trendingIssuesRes, topUsersRes] = await Promise.all([
          apiService.getIssues({ limit: 3, sortBy: 'newest' }),
          apiService.getTrendingIssues({ limit: 6 }),
          // For now we'll use trending issues to get some data - later you can add a top fixers endpoint
          apiService.getTrendingIssues({ limit: 3 })
        ]);

        setRecentIssues(recentIssuesRes.data.issues || []);
        // Extract tags from trending issues for now
        const tags = (trendingIssuesRes.data.issues || []).reduce((acc: any[], issue: any) => {
          issue.tags?.forEach((tag: string) => {
            const existing = acc.find(t => t.name === tag);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ name: tag, count: 1 });
            }
          });
          return acc;
        }, []).slice(0, 8);
        setTrendingTags(tags);

        // Use issue authors as top fixers for now
        const fixers = (topUsersRes.data.issues || []).map((issue: any) => issue.author).filter(Boolean).slice(0, 3);
        setTopFixers(fixers);

        // Set some default stats for now
        setStats({
          totalIssues: recentIssuesRes.data.total || 15420,
          totalUsers: 8200,
          totalBountyPaid: 127000
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
        // Set some fallback stats
        setStats({
          totalIssues: 15420,
          totalUsers: 8200,
          totalBountyPaid: 127000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Post a problem.
            <br />
            Fix together.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the largest community of developers helping each other debug, learn, and build better software. 
            Get paid for your expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => onNavigate('post-issue')} className="text-lg px-8">
              Post an Issue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate('discover')} className="text-lg px-8">
              Browse Issues
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
            <div className="text-3xl font-bold mb-2">{stats.totalIssues.toLocaleString()}</div>
            <div className="text-muted-foreground">Issues Solved</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <div className="text-3xl font-bold mb-2">{stats.totalUsers.toLocaleString()}+</div>
            <div className="text-muted-foreground">Active Developers</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
            <div className="text-3xl font-bold mb-2">${(stats.totalBountyPaid / 1000).toFixed(0)}K+</div>
            <div className="text-muted-foreground">Bounties Paid</div>
          </CardContent>
        </Card>
      </section>

      {/* Latest Issues */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Latest Issues</h2>
          <Button variant="outline" onClick={() => onNavigate('discover')}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recentIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onViewIssue={onViewIssue} />
          ))}
        </div>
      </section>

      {/* Trending Tags */}
      <section className="px-4">
        <h2 className="text-3xl font-bold mb-6">Trending Technologies</h2>
        <div className="flex flex-wrap gap-3">
          {trendingTags.map((tag) => (
            <Badge
              key={tag.name}
              variant="secondary"
              className="text-sm px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onNavigate('discover')}
            >
              #{tag.name}
              <span className="ml-2 text-xs opacity-70">{tag.count}</span>
            </Badge>
          ))}
        </div>
      </section>

      {/* Top Fixers */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Top Fixers This Week</h2>
          <Button variant="outline" onClick={() => onNavigate('leaderboard')}>
            View Leaderboard
            <TrendingUp className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topFixers.map((user, index) => (
            <Card key={user.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        1
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-emerald-600">{user.issuesFixed}</div>
                    <div className="text-muted-foreground">Issues Fixed</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">${user.bountyEarned}</div>
                    <div className="text-muted-foreground">Earned</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {user.badges?.slice(0, 2).map((badge: any) => (
                    <Badge key={badge.id} variant="outline" className="text-xs">
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 rounded-2xl p-12 text-center mx-4">
        <h2 className="text-3xl font-bold mb-4">Ready to start debugging together?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of developers who are already helping each other solve complex problems 
          and earning bounties for their expertise.
        </p>
        <Button size="lg" onClick={() => onNavigate('post-issue')}>
          Get Started
          <Zap className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}