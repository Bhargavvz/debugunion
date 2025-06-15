import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IssueCard } from './IssueCard';
import { apiService } from '@/lib/api';
import { SortOption, FilterCategory } from '@/types';

interface DiscoverPageProps {
  onViewIssue: (id: string) => void;
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-bountied', label: 'Highest Bounty' },
  { value: 'most-active', label: 'Most Active' },
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'bug', label: 'Bug Reports' },
  { value: 'feature', label: 'Feature Requests' },
  { value: 'question', label: 'Questions' },
  { value: 'discussion', label: 'Discussions' },
];

export function DiscoverPage({ onViewIssue }: DiscoverPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const allStacks = ['React', 'Node.js', 'TypeScript', 'CSS', 'JavaScript', 'MongoDB', 'Docker', 'Python'];

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const [issuesResponse, trendingResponse] = await Promise.all([
          apiService.getIssues({
            limit: 50,
            category: category !== 'all' ? category : undefined,
            q: searchTerm.trim() || undefined,
            sortBy: sortBy,
            tags: selectedTags.length > 0 ? selectedTags : undefined
          }),
          apiService.getTrendingIssues({ limit: 10 })
        ]);

        setIssues(issuesResponse.data.issues || []);
        
        // Extract tags from trending issues
        const tags = (trendingResponse.data.issues || []).reduce((acc: any[], issue: any) => {
          issue.tags?.forEach((tag: string) => {
            const existing = acc.find(t => t.name === tag);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ name: tag, count: 1 });
            }
          });
          return acc;
        }, []).slice(0, 12);
        setTrendingTags(tags);
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [searchTerm, sortBy, category, selectedTags]);

  const filteredIssues = issues.filter((issue) => {
    const matchesStack = selectedStacks.length === 0 || selectedStacks.some(stack => 
      issue.stack?.includes(stack) || issue.tags?.includes(stack.toLowerCase())
    );
    return matchesStack;
  });

  // The issues are already sorted by the API, but we can apply additional client-side sorting if needed
  const sortedIssues = filteredIssues;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleStack = (stack: string) => {
    setSelectedStacks(prev => 
      prev.includes(stack) 
        ? prev.filter(s => s !== stack)
        : [...prev, stack]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Discover Issues</h1>
        <p className="text-muted-foreground">
          Find interesting problems to solve and help fellow developers
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          <Select value={category} onValueChange={(value) => setCategory(value as FilterCategory)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Technologies ({selectedStacks.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {allStacks.map((stack) => (
                <DropdownMenuCheckboxItem
                  key={stack}
                  checked={selectedStacks.includes(stack)}
                  onCheckedChange={() => toggleStack(stack)}
                >
                  {stack}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trending Tags */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.slice(0, 8).map((tag) => (
              <Badge
                key={tag.name}
                variant={selectedTags.includes(tag.name.toLowerCase()) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => toggleTag(tag.name.toLowerCase())}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(selectedTags.length > 0 || selectedStacks.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(tag)}>
                #{tag} ×
              </Badge>
            ))}
            {selectedStacks.map((stack) => (
              <Badge key={stack} variant="secondary" className="cursor-pointer" onClick={() => toggleStack(stack)}>
                {stack} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sortedIssues.length} issue{sortedIssues.length !== 1 ? 's' : ''} found
          </p>
          <Button variant="ghost" size="sm">
            <SortAsc className="h-4 w-4 mr-2" />
            {sortOptions.find(opt => opt.value === sortBy)?.label}
          </Button>
        </div>

        {sortedIssues.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedIssues.map((issue: any) => (
              <IssueCard key={issue.id} issue={issue} onViewIssue={onViewIssue} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              No issues found matching your criteria.
            </div>
            <Button variant="outline" className="mt-4" onClick={() => {
              setSearchTerm('');
              setCategory('all');
              setSelectedTags([]);
              setSelectedStacks([]);
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}