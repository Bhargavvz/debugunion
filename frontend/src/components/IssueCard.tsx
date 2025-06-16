import { Clock, DollarSign, Eye, GitBranch, MessageSquare, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface IssueCardProps {
  issue: Issue;
  onViewIssue: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

export function IssueCard({ issue, onViewIssue, onViewProfile }: IssueCardProps) {
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

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewProfile && issue.author?.id) {
      onViewProfile(issue.author.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => onViewIssue(issue.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(issue.status)}`} />
            <Badge variant={getCategoryColor(issue.category)} className="capitalize">
              {issue.category}
            </Badge>
            {issue.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
          {issue.bounty > 0 && (
            <div className="flex items-center text-emerald-600 font-semibold">
              <DollarSign className="w-4 h-4 mr-1" />
              ${issue.bounty}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {issue.title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {issue.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
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
        
        {/* Stack */}
        <div className="flex flex-wrap gap-1 mb-4">
          {issue.stack.slice(0, 3).map((tech) => (
            <Badge key={tech} className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
              {tech}
            </Badge>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors"
              onClick={handleAuthorClick}
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={issue.author?.avatar} />
                <AvatarFallback className="text-xs">
                  {issue.author?.username ? issue.author.username.slice(0, 2).toUpperCase() : 'UN'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{issue.author?.username || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{issue.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span className="text-xs">{issue.comments?.length || 0}</span>
            </div>
            {issue.githubRepo && <GitBranch className="w-3 h-3" />}
          </div>
        </div>
        
        <Button className="w-full mt-4" onClick={(e) => { e.stopPropagation(); onViewIssue(issue.id); }}>
          View Issue
        </Button>
      </CardContent>
    </Card>
  );
}