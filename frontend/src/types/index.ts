export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  location?: string;
  company?: string;
  xp: number;
  level: number;
  issuesPosted: number;
  issuesFixed: number;
  bountyEarned: number;
  badges: Badge[];
  joinedAt: Date;
  lastActive: Date;
  isOnline: boolean;
  skills: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  publicProfile: boolean;
  showEmail: boolean;
  language: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: Date;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  stack: string[];
  tags: string[];
  author: User;
  createdAt: Date;
  updatedAt: Date;
  status: "open" | "in-progress" | "solved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  bounty: number;
  githubRepo?: string;
  attachments: string[];
  fixes: Fix[];
  comments: Comment[];
  views: number;
  upvotes: number;
  downvotes: number;
  followers: string[];
}

export interface Fix {
  id: string;
  issueId: string;
  author: User;
  description: string;
  codeSnippet?: string;
  githubPr?: string;
  attachments: string[];
  createdAt: Date;
  isAccepted: boolean;
  votes: number;
  bountyAwarded?: number;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  parentId?: string;
  replies: Comment[];
  votes: number;
}

export interface Message {
  id: string;
  sender: User;
  recipient: User;
  content: string;
  createdAt: Date;
  isRead: boolean;
  issueId?: string;
  type: "direct" | "issue" | "system";
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "issue_comment"
    | "fix_submitted"
    | "bounty_awarded"
    | "badge_earned"
    | "message"
    | "follow";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  user: User;
  rank: number;
  score: number;
  change: number;
  category: "overall" | "weekly" | "monthly";
}

export type SortOption =
  | "newest"
  | "oldest"
  | "most-bountied"
  | "most-active"
  | "most-upvoted";
export type FilterCategory =
  | "all"
  | "bug"
  | "feature"
  | "question"
  | "discussion";
export type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password";
export type Page =
  | "landing"
  | "home"
  | "discover"
  | "post-issue"
  | "dashboard"
  | "messages"
  | "leaderboard"
  | "profile"
  | "settings"
  | "auth"
  | "not-found";
