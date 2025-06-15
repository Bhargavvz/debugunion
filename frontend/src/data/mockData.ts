import { User, Issue, Badge, Message, Conversation, Notification, LeaderboardEntry } from '@/types';

export const mockBadges: Badge[] = [
  { id: '1', name: 'Bug Slayer', description: 'Fixed 10+ bugs', icon: 'Bug', color: 'emerald', rarity: 'common' },
  { id: '2', name: 'Merge Master', description: 'Accepted 5+ PRs', icon: 'GitMerge', color: 'blue', rarity: 'rare' },
  { id: '3', name: 'Helper', description: 'Helped 50+ developers', icon: 'Heart', color: 'rose', rarity: 'epic' },
  { id: '4', name: 'Code Wizard', description: 'Earned 5000+ XP', icon: 'Zap', color: 'purple', rarity: 'legendary' },
  { id: '5', name: 'First Fix', description: 'Submitted your first fix', icon: 'Award', color: 'yellow', rarity: 'common' },
  { id: '6', name: 'Bounty Hunter', description: 'Earned $500+ in bounties', icon: 'DollarSign', color: 'green', rarity: 'rare' },
];

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'alexdev',
    email: 'alex@example.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    bio: 'Full-stack developer passionate about React and Node.js. Love solving complex problems and helping fellow developers.',
    githubUrl: 'https://github.com/alexdev',
    websiteUrl: 'https://alexdev.io',
    location: 'San Francisco, CA',
    company: 'TechCorp',
    xp: 2500,
    level: 12,
    issuesPosted: 15,
    issuesFixed: 42,
    bountyEarned: 1250,
    badges: [mockBadges[0], mockBadges[1], mockBadges[4]],
    joinedAt: new Date('2024-01-15'),
    lastActive: new Date(),
    isOnline: true,
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    preferences: {
      theme: 'dark',
      emailNotifications: true,
      pushNotifications: true,
      publicProfile: true,
      showEmail: false,
      language: 'en'
    }
  },
  {
    id: '2',
    username: 'sarahcode',
    email: 'sarah@example.com',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    bio: 'Frontend specialist and UI/UX enthusiast. Creating beautiful and accessible web experiences.',
    githubUrl: 'https://github.com/sarahcode',
    location: 'New York, NY',
    company: 'DesignLab',
    xp: 1800,
    level: 9,
    issuesPosted: 8,
    issuesFixed: 28,
    bountyEarned: 890,
    badges: [mockBadges[2], mockBadges[4]],
    joinedAt: new Date('2024-02-20'),
    lastActive: new Date(Date.now() - 1000 * 60 * 30),
    isOnline: false,
    skills: ['React', 'CSS', 'JavaScript', 'Figma'],
    preferences: {
      theme: 'light',
      emailNotifications: true,
      pushNotifications: false,
      publicProfile: true,
      showEmail: true,
      language: 'en'
    }
  },
  {
    id: '3',
    username: 'mikebyte',
    email: 'mike@example.com',
    avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    bio: 'Backend architect and DevOps expert. Scaling applications and optimizing infrastructure.',
    githubUrl: 'https://github.com/mikebyte',
    location: 'Austin, TX',
    company: 'CloudTech',
    xp: 3200,
    level: 15,
    issuesPosted: 22,
    issuesFixed: 51,
    bountyEarned: 1650,
    badges: [mockBadges[0], mockBadges[1], mockBadges[2], mockBadges[3]],
    joinedAt: new Date('2023-11-10'),
    lastActive: new Date(Date.now() - 1000 * 60 * 5),
    isOnline: true,
    skills: ['Node.js', 'Docker', 'AWS', 'Python'],
    preferences: {
      theme: 'dark',
      emailNotifications: true,
      pushNotifications: true,
      publicProfile: true,
      showEmail: false,
      language: 'en'
    }
  },
];

export const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'React component state not updating after API call',
    description: 'I have a React component that fetches data from an API, but the state is not updating properly. The API call is successful (I can see the data in console.log), but the component doesn\'t re-render with the new data. I\'ve tried using useEffect with proper dependencies but still facing issues.',
    category: 'bug',
    stack: ['React', 'JavaScript', 'REST API'],
    tags: ['react', 'state', 'api', 'hooks'],
    author: mockUsers[0],
    createdAt: new Date('2024-12-20T10:30:00'),
    updatedAt: new Date('2024-12-20T10:30:00'),
    status: 'open',
    priority: 'high',
    bounty: 50,
    githubRepo: 'https://github.com/alexdev/react-issue-demo',
    attachments: [],
    fixes: [],
    comments: [],
    views: 45,
    upvotes: 8,
    downvotes: 1,
    followers: ['2', '3'],
  },
  {
    id: '2',
    title: 'Node.js MongoDB connection timing out',
    description: 'My Node.js application keeps timing out when trying to connect to MongoDB Atlas. The connection works locally but fails in production. I\'ve checked the network access settings and they seem correct.',
    category: 'bug',
    stack: ['Node.js', 'MongoDB', 'Express'],
    tags: ['nodejs', 'mongodb', 'connection', 'timeout'],
    author: mockUsers[1],
    createdAt: new Date('2024-12-20T09:15:00'),
    updatedAt: new Date('2024-12-20T09:15:00'),
    status: 'in-progress',
    priority: 'medium',
    bounty: 75,
    githubRepo: 'https://github.com/sarahcode/node-mongo-issue',
    attachments: [],
    fixes: [],
    comments: [],
    views: 32,
    upvotes: 5,
    downvotes: 0,
    followers: ['1'],
  },
  {
    id: '3',
    title: 'CSS Grid layout breaking on mobile devices',
    description: 'My CSS Grid layout looks perfect on desktop but completely breaks on mobile. The grid items overlap and the responsive behavior isn\'t working as expected. I\'ve tried various media queries but can\'t get it right.',
    category: 'bug',
    stack: ['CSS', 'HTML', 'Responsive Design'],
    tags: ['css', 'grid', 'responsive', 'mobile'],
    author: mockUsers[2],
    createdAt: new Date('2024-12-20T08:45:00'),
    updatedAt: new Date('2024-12-20T08:45:00'),
    status: 'open',
    priority: 'low',
    bounty: 30,
    attachments: [],
    fixes: [],
    comments: [],
    views: 28,
    upvotes: 3,
    downvotes: 0,
    followers: [],
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    sender: mockUsers[1],
    recipient: mockUsers[0],
    content: 'Hey! I saw your React issue. I think I might have a solution for you.',
    createdAt: new Date('2024-12-20T11:00:00'),
    isRead: false,
    issueId: '1',
    type: 'issue'
  },
  {
    id: '2',
    sender: mockUsers[0],
    recipient: mockUsers[1],
    content: 'That would be amazing! What do you think might be causing it?',
    createdAt: new Date('2024-12-20T11:05:00'),
    isRead: true,
    issueId: '1',
    type: 'issue'
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: mockMessages[1],
    unreadCount: 1,
    createdAt: new Date('2024-12-20T11:00:00'),
    updatedAt: new Date('2024-12-20T11:05:00'),
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'fix_submitted',
    title: 'New Fix Submitted',
    message: 'sarahcode submitted a fix for your React issue',
    isRead: false,
    createdAt: new Date('2024-12-20T10:45:00'),
    actionUrl: '/issue/1'
  },
  {
    id: '2',
    userId: '1',
    type: 'badge_earned',
    title: 'Badge Earned!',
    message: 'You earned the "Bug Slayer" badge',
    isRead: false,
    createdAt: new Date('2024-12-20T09:30:00'),
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    user: mockUsers[2],
    rank: 1,
    score: 3200,
    change: 2,
    category: 'overall'
  },
  {
    user: mockUsers[0],
    rank: 2,
    score: 2500,
    change: 0,
    category: 'overall'
  },
  {
    user: mockUsers[1],
    rank: 3,
    score: 1800,
    change: -1,
    category: 'overall'
  }
];

export const trendingTags = [
  { name: 'React', count: 156 },
  { name: 'Node.js', count: 142 },
  { name: 'TypeScript', count: 98 },
  { name: 'CSS', count: 87 },
  { name: 'JavaScript', count: 134 },
  { name: 'API', count: 76 },
  { name: 'MongoDB', count: 65 },
  { name: 'Docker', count: 54 },
];