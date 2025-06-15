import { useState } from 'react';
import { Edit, Github, Globe, MapPin, Building, Calendar, Star, Award, Code, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { mockUsers, mockIssues } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [isOwnProfile] = useState(true);
  const currentUser = mockUsers[0]; // Simulate current user
  const userIssues = mockIssues.filter(issue => issue.author.id === currentUser.id);

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-purple-500';
      case 'epic': return 'bg-blue-500';
      case 'rare': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="text-2xl">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{currentUser.username}</h1>
                {currentUser.isOnline && (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                )}
                <Badge className="bg-primary/10 text-primary">
                  Level {currentUser.level}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4">{currentUser.bio}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {currentUser.company && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {currentUser.company}
                  </div>
                )}
                {currentUser.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {currentUser.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {formatDistanceToNow(currentUser.joinedAt, { addSuffix: true })}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-4">
                {currentUser.githubUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={currentUser.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                {currentUser.websiteUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={currentUser.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {isOwnProfile && (
                  <Button onClick={() => onNavigate('settings')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
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
            <div className="text-2xl font-bold">{currentUser.xp.toLocaleString()}</div>
            <Progress value={72} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              750 XP to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Posted</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.issuesPosted}</div>
            <p className="text-xs text-muted-foreground">
              +2 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUser.issuesFixed}</div>
            <p className="text-xs text-muted-foreground">
              +8 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounty Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentUser.bountyEarned}</div>
            <p className="text-xs text-muted-foreground">
              +$125 this month
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
              <div className="flex flex-wrap gap-2">
                {currentUser.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">Posted a new issue: "React component state not updating"</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">Earned 50 XP for helping with TypeScript issue</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">Achieved "Bug Slayer" badge</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {userIssues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="pt-6">
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
                    <h3 className="font-semibold">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(issue.createdAt, { addSuffix: true })}</span>
                      <span>{issue.views} views</span>
                      <span>{issue.comments.length} comments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No contributions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start helping other developers by providing solutions to their issues
              </p>
              <Button onClick={() => onNavigate('discover')}>
                Browse Issues to Help
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.badges.map((badge) => (
              <Card key={badge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className={`w-16 h-16 rounded-full ${getBadgeColor(badge.rarity)} flex items-center justify-center mx-auto mb-4`}>
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                  <Badge variant="outline" className="capitalize">
                    {badge.rarity}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}