import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, Eye, GitBranch, Heart, MessageSquare, Share, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface IssueDetailPageProps {
  issueId: string;
  onNavigate: (page: string, params?: any) => void;
  onViewProfile?: (id: string) => void;
}

export function IssueDetailPage({ issueId, onNavigate, onViewProfile }: IssueDetailPageProps) {
  const [newFix, setNewFix] = useState('');
  const [isSubmittingFix, setIsSubmittingFix] = useState(false);
  const [issue, setIssue] = useState<any>(null);
  const [fixes, setFixes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchIssueData = async () => {
      try {
        setLoading(true);
        const [issueRes, commentsRes, fixesRes] = await Promise.all([
          apiService.getIssueById(issueId),
          apiService.getComments(issueId),
          apiService.getFixesByIssue(issueId)
        ]);

        setIssue(issueRes.data.issue);
        setComments(commentsRes.data.comments || []);
        setFixes(fixesRes.data.fixes || []);
      } catch (error) {
        console.error('Error fetching issue data:', error);
        toast({
          title: "Error",
          description: "Failed to load issue details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIssueData();
  }, [issueId, toast]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Issue Not Found</h2>
        <Button onClick={() => onNavigate('discover')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discover
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      case 'solved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'destructive';
      case 'feature': return 'secondary';
      case 'question': return 'outline';
      default: return 'secondary';
    }
  };

  const submitFix = async () => {
    if (!newFix.trim()) return;

    if (!userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a fix.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFix(true);
    
    try {
      await apiService.createFix(issueId, {
        content: newFix,
        explanation: "User-submitted fix"
      });

      toast({
        title: "Fix Submitted!",
        description: "Your solution has been submitted and the issue author has been notified.",
      });
      
      setNewFix('');
      
      // Refresh fixes
      const fixesRes = await apiService.getFixesByIssue(issueId);
      setFixes(fixesRes.data.fixes || []);
    } catch (error) {
      console.error('Error submitting fix:', error);
      toast({
        title: "Error",
        description: "Failed to submit fix. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFix(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => onNavigate('discover')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Issues
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Issue Header */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(issue.status)}`} />
                  <Badge variant={getCategoryColor(issue.category)} className="capitalize">
                    {issue.category}
                  </Badge>
                  {issue.isUrgent && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    12
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4 mr-1" />
                    8
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bold">{issue.title}</h1>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={issue.author.avatar} />
                    <AvatarFallback>
                      {issue.author.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{issue.author.username}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(issue.createdAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{issue.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{issue.comments.length} comments</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <p>{issue.description}</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <h4 className="font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {issue.tags?.map((tag: any) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stack */}
              <div className="space-y-2">
                <h4 className="font-medium">Technology Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {issue.stack?.map((tech: any) => (
                    <Badge key={tech} className="bg-primary/10 text-primary hover:bg-primary/20">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* GitHub Link */}
              {issue.githubRepo && (
                <div className="space-y-2">
                  <h4 className="font-medium">Repository</h4>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4" />
                    <a 
                      href={issue.githubRepo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {issue.githubRepo}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Fix */}
          <Card>
            <CardHeader>
              <CardTitle>Submit a Fix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe your solution, provide code snippets, or link to a PR..."
                value={newFix}
                onChange={(e) => setNewFix(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Support markdown formatting and code blocks
                </p>
                <Button onClick={submitFix} disabled={!newFix.trim() || isSubmittingFix}>
                  {isSubmittingFix ? 'Submitting...' : 'Submit Fix'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fixes & Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Solutions & Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No solutions submitted yet. Be the first to help!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bounty */}
          {issue.bounty > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-600">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Bounty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">${issue.bounty}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reward for accepted solution
                </p>
              </CardContent>
            </Card>
          )}

          {/* Author */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Author</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={issue.author.avatar} />
                  <AvatarFallback>
                    {issue.author.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{issue.author.username}</h4>
                  <p className="text-sm text-muted-foreground">{issue.author.xp.toLocaleString()} XP</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-semibold">{issue.author.issuesPosted}</div>
                  <div className="text-muted-foreground">Issues</div>
                </div>
                <div>
                  <div className="font-semibold">{issue.author.issuesFixed}</div>
                  <div className="text-muted-foreground">Fixed</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {issue.author?.badges?.slice(0, 2).map((badge: any) => (
                  <Badge key={badge.id} variant="outline" className="text-xs">
                    {badge.name}
                  </Badge>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => onViewProfile ? onViewProfile(issue.author.id) : onNavigate('profile', { userId: issue.author.id })}
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                Follow Issue
              </Button>
              <Button variant="outline" className="w-full">
                Report Issue
              </Button>
              {issue.status === 'open' && (
                <Button className="w-full">
                  Mark as Solved
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}