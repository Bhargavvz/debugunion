import { useState } from 'react';
import { Upload, Link, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PostIssuePageProps {
  onNavigate: (page: string) => void;
}

const categories = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'discussion', label: 'Discussion' },
];

const commonStacks = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Python', 'MongoDB', 'Docker', 'Express'];

export function PostIssuePage({ onNavigate }: PostIssuePageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedStack, setSelectedStack] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [bounty, setBounty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleStack = (stack: string) => {
    setSelectedStack(prev => 
      prev.includes(stack) 
        ? prev.filter(s => s !== stack)
        : [...prev, stack]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post an issue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const issueData = {
        title,
        description,
        category,
        tags: [...tags, ...selectedStack],
        stack: selectedStack,
        bounty: bounty ? parseFloat(bounty) : 0,
        priority: isUrgent ? 'high' : 'medium',
        githubRepo: githubRepo || undefined,
      };

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      await apiService.createIssue(issueData);
      
      toast({
        title: "Issue Posted!",
        description: "Your issue has been successfully posted to the community.",
      });
      
      onNavigate('discover');
    } catch (error: any) {
      console.error('Error posting issue:', error);
      
      // Handle specific error types
      if (error.response) {
        if (error.response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "You're posting too quickly. Please wait a moment and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.response.data?.message || "Failed to post issue. Please try again.",
            variant: "destructive",
          });
        }
      } else if (error.request) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to post issue. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Post a New Issue</h1>
        <p className="text-muted-foreground">
          Describe your problem in detail to get the best help from the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Briefly describe your issue..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your issue. Include error messages, expected behavior, and what you've already tried..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 min-h-[200px]"
                  />
                </div>

                <div>
                  <Label htmlFor="github">GitHub Repository (Optional)</Label>
                  <div className="relative mt-1">
                    <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="github"
                      placeholder="https://github.com/username/repository"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <Label>Select relevant technologies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonStacks.map((stack) => (
                    <Badge
                      key={stack}
                      variant={selectedStack.includes(stack) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => toggleStack(stack)}
                    >
                      {stack}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Priority & Bounty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="urgent"
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                  />
                  <Label htmlFor="urgent">Mark as urgent</Label>
                </div>

                <div>
                  <Label htmlFor="bounty">Bounty Amount (USD)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="bounty"
                      type="number"
                      placeholder="0"
                      value={bounty}
                      onChange={(e) => setBounty(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Offer a bounty to incentivize quick solutions
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop files or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Screenshots, logs, or code files
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Issue'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate('discover')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}