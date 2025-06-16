import { useState, useEffect } from 'react';
import { Edit, Github, Globe, Linkedin, MapPin, Building, Calendar, Star, Award, Code, Users, MessageSquare, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { User, Issue, Fix, Badge as BadgeType } from '@/types';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  userId?: string; // Optional userId for viewing other profiles
  onViewIssue?: (id: string) => void;
}

interface ActivityItem {
  id: string;
  type: 'issue_created' | 'issue_solved' | 'fix_submitted' | 'fix_accepted' | 'badge_earned' | 'xp_earned';
  title: string;
  description: string;
  timestamp: Date;
  color: string;
  data?: any;
}

export function ProfilePage({ onNavigate, userId, onViewIssue }: ProfilePageProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [userFixes, setUserFixes] = useState<Fix[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    issuesPosted: 0,
    issuesFixed: 0,
    bountyEarned: 0
  });

  // Calculate XP progress to next level
  const calculateXpProgress = (xp: number, level: number) => {
    const xpForNextLevel = level * 1000;
    const currentLevelXp = (level - 1) * 1000;
    const xpProgress = xp - currentLevelXp;
    const xpNeeded = xpForNextLevel - xp;
    const progressPercentage = (xpProgress / (xpForNextLevel - currentLevelXp)) * 100;
    
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
  const getBadgeIcon = (badge: BadgeType) => {
    switch (badge.icon) {
      case 'Bug': return <Code className="h-8 w-8 text-white" />;
      case 'GitMerge': return <Code className="h-8 w-8 text-white" />;
      case 'Heart': return <Award className="h-8 w-8 text-white" />;
      case 'Zap': return <Star className="h-8 w-8 text-white" />;
      case 'Award': return <Award className="h-8 w-8 text-white" />;
      case 'DollarSign': return <Award className="h-8 w-8 text-white" />;
      default: return <Award className="h-8 w-8 text-white" />;
    }
  };

  // Get status color for issues
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      case 'solved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Load user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine if viewing own profile or another user's profile
        const targetUserId = userId || (userProfile?.id || userProfile?.uid);
        
        if (!targetUserId) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        setIsOwnProfile(!userId || userId === (userProfile?.id || userProfile?.uid));
        
        // Fetch user profile
        const userResponse = userId 
          ? await apiService.getUserById(userId)
          : { data: { user: userProfile } };
        
        if (!userResponse.data.user) {
          setError('User profile not found');
          setLoading(false);
          return;
        }
        
        setProfileUser(userResponse.data.user);
        
        // Fetch user's issues
        const issuesResponse = await apiService.getIssues({ 
          userId: targetUserId,
          limit: 10,
          sortBy: 'newest'
        });
        
        setUserIssues(issuesResponse.data.issues || []);
        
        // Fetch user's fixes
        const fixesResponse = await apiService.getFixes({
          userId: targetUserId,
          limit: 10,
          sortBy: 'newest'
        });
        
        setUserFixes(fixesResponse.data.fixes || []);
        
        // Generate activity feed from issues and fixes
        generateActivityFeed(
          issuesResponse.data.issues || [], 
          fixesResponse.data.fixes || [],
          userResponse.data.user.badges || []
        );
        
        // Calculate monthly stats
        calculateMonthlyStats(
          issuesResponse.data.issues || [],
          fixesResponse.data.fixes || []
        );
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, userProfile, toast]);
  
  // Generate activity feed from user data
  const generateActivityFeed = (issues: Issue[], fixes: Fix[], badges: BadgeType[]) => {
    const activities: ActivityItem[] = [];
    
    // Add issue creation activities
    issues.forEach(issue => {
      activities.push({
        id: `issue-${issue.id}`,
        type: 'issue_created',
        title: 'Posted a new issue',
        description: issue.title,
        timestamp: new Date(issue.createdAt),
        color: 'bg-emerald-500',
        data: issue
      });
      
      // Add issue solved activities if applicable
      if (issue.status === 'solved') {
        activities.push({
          id: `issue-solved-${issue.id}`,
          type: 'issue_solved',
          title: 'Issue solved',
          description: issue.title,
          timestamp: new Date(issue.updatedAt),
          color: 'bg-green-500',
          data: issue
        });
      }
    });
    
    // Add fix submission activities
    fixes.forEach(fix => {
      activities.push({
        id: `fix-${fix.id}`,
        type: 'fix_submitted',
        title: 'Submitted a fix',
        description: fix.description || 'Solution for an issue',
        timestamp: new Date(fix.createdAt),
        color: 'bg-blue-500',
        data: fix
      });
      
      // Add fix accepted activities if applicable
      if (fix.isAccepted) {
        activities.push({
          id: `fix-accepted-${fix.id}`,
          type: 'fix_accepted',
          title: 'Fix accepted',
          description: `Earned ${fix.bountyAwarded ? `$${fix.bountyAwarded} bounty` : 'XP'} for solution`,
          timestamp: new Date(fix.createdAt), // Should be acceptedAt but using createdAt as fallback
          color: 'bg-purple-500',
          data: fix
        });
      }
    });
    
    // Add badge earned activities
    badges.forEach(badge => {
      if (badge.unlockedAt) {
        activities.push({
          id: `badge-${badge.id}`,
          type: 'badge_earned',
          title: 'Badge earned',
          description: `Achieved "${badge.name}" badge`,
          timestamp: new Date(badge.unlockedAt),
          color: 'bg-yellow-500',
          data: badge
        });
      }
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setActivityItems(activities);
  };
  
  // Calculate monthly stats
  const calculateMonthlyStats = (issues: Issue[], fixes: Fix[]) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyIssues = issues.filter(issue => 
      new Date(issue.createdAt) >= monthStart
    ).length;
    
    const monthlyFixes = fixes.filter(fix => 
      fix.isAccepted && new Date(fix.createdAt) >= monthStart
    ).length;
    
    const monthlyBounty = fixes
      .filter(fix => fix.isAccepted && new Date(fix.createdAt) >= monthStart)
      .reduce((total, fix) => total + (fix.bountyAwarded || 0), 0);
    
    setMonthlyStats({
      issuesPosted: monthlyIssues,
      issuesFixed: monthlyFixes,
      bountyEarned: monthlyBounty
    });
  };
  
  // Handle sending a message to the user
  const handleSendMessage = async () => {
    if (!profileUser || isOwnProfile) return;
    
    try {
      await apiService.sendMessage({
        recipientId: profileUser.id,
        content: `Hello! I saw your profile on DevBounty.`,
        type: 'direct'
      });
      
      toast({
        title: 'Message Sent',
        description: `Your message has been sent to ${profileUser.username}`,
      });
      
      // Navigate to messages page
      onNavigate('messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profileUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'User profile not found'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => onNavigate('discover')}>
          Return to Discover
        </Button>
      </div>
    );
  }

  // Calculate XP progress
  const { progressPercentage, xpNeeded } = calculateXpProgress(
    profileUser?.xp || 0, 
    profileUser?.level || 1
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileUser?.avatar} />
              <AvatarFallback className="text-2xl">
                {profileUser?.username ? profileUser.username.slice(0, 2).toUpperCase() : 'UN'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{profileUser?.username || 'User'}</h1>
                {profileUser?.isOnline && (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                )}
                <Badge className="bg-primary/10 text-primary">
                  Level {profileUser?.level || 1}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4">{profileUser?.bio || 'No bio provided'}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profileUser?.company && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {profileUser.company}
                  </div>
                )}
                {profileUser?.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profileUser.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {profileUser?.joinedAt ? formatDistanceToNow(new Date(profileUser.joinedAt), { addSuffix: true }) : 'recently'}
                </div>
                {!isOwnProfile && profileUser?.lastActive && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Active {formatDistanceToNow(new Date(profileUser.lastActive), { addSuffix: true })}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center space-x-2 mt-4">
                {profileUser?.githubUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profileUser.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                {profileUser?.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profileUser.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {profileUser?.websiteUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {isOwnProfile ? (
                  <Button onClick={() => onNavigate('settings')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button onClick={handleSendMessage}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileUser.xp.toLocaleString()}</div>
            <Progress value={progressPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {xpNeeded.toLocaleString()} XP to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Posted</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileUser.issuesPosted}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.issuesPosted > 0 ? `+${monthlyStats.issuesPosted} this month` : 'None this month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileUser.issuesFixed}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.issuesFixed > 0 ? `+${monthlyStats.issuesFixed} this month` : 'None this month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounty Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${profileUser.bountyEarned}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.bountyEarned > 0 ? `+$${monthlyStats.bountyEarned} this month` : 'None this month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.skills && profileUser.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills listed yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityItems.length > 0 ? (
                <div className="space-y-4">
                  {activityItems.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                      <div className="flex-1">
                        <p className="text-sm">
                          {activity.title}: {" "}
                          <span className="font-medium">
                            {activity.description}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {userIssues.length > 0 ? (
            userIssues.map((issue) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewIssue && onViewIssue(issue.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(issue.status)}`} />
                        <Badge variant="outline" className="capitalize">
                          {issue.status.replace('-', ' ')}
                        </Badge>
                        {issue.bounty > 0 && (
                          <Badge className="bg-emerald-500">
                            ${issue.bounty}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex flex-wrap gap-2 my-2">
                        {issue.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {issue.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{issue.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                        <span>{issue.views} views</span>
                        <span>{issue.comments?.length || 0} comments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No issues posted yet</h3>
                {isOwnProfile && (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Share your coding challenges with the community
                    </p>
                    <Button onClick={() => onNavigate('post-issue')}>
                      Post Your First Issue
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {userIssues.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => onViewIssue && onNavigate('discover')}>
                View All Issues
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contributions" className="space-y-4">
          {userFixes.length > 0 ? (
            userFixes.map((fix) => (
              <Card key={fix.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewIssue && fix.issueId && onViewIssue(fix.issueId)}>
                <CardContent className="pt-6">
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
                      <h3 className="font-semibold">{fix.description || 'Fix for issue'}</h3>
                      {fix.codeSnippet && (
                        <p className="text-sm text-muted-foreground line-clamp-2 font-mono bg-muted p-2 rounded">
                          {fix.codeSnippet}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(fix.createdAt), { addSuffix: true })}</span>
                        <span>{fix.votes || 0} votes</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No contributions yet</h3>
                {isOwnProfile && (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Start helping other developers by providing solutions to their issues
                    </p>
                    <Button onClick={() => onNavigate('discover')}>
                      Browse Issues to Help
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {userFixes.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => onViewIssue && onNavigate('discover')}>
                View All Contributions
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {profileUser.badges && profileUser.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileUser.badges.map((badge) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${getBadgeColor(badge.rarity)} flex items-center justify-center mx-auto mb-4`}>
                      {getBadgeIcon(badge)}
                    </div>
                    <h3 className="font-semibold mb-2">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                    <Badge variant="outline" className="capitalize">
                      {badge.rarity}
                    </Badge>
                    {badge.unlockedAt && (
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
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No badges earned yet</h3>
                {isOwnProfile && (
                  <p className="text-muted-foreground">
                    Earn badges by participating in the community and helping others
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}