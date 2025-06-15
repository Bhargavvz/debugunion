import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { auth } from '@/lib/firebase';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const user = auth.currentUser;
          console.log('API Request - Current user:', user?.uid);
          if (user) {
            const token = await user.getIdToken();
            console.log('API Request - Got token:', token.substring(0, 50) + '...');
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            console.log('API Request - No current user');
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          console.error('Unauthorized access - redirecting to login');
          // You can add redirect logic here
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: any) {
    const response = await this.api.patch('/auth/profile', profileData);
    return response.data;
  }

  // Issue endpoints
  async getIssues(params?: {
    category?: string;
    status?: string;
    priority?: string;
    sortBy?: string;
    tags?: string[];
    minBounty?: number;
    maxBounty?: number;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get('/issues', { params });
    return response.data;
  }

  async getIssueById(issueId: string) {
    const response = await this.api.get(`/issues/${issueId}`);
    return response.data;
  }

  async createIssue(issueData: {
    title: string;
    description: string;
    category: string;
    stack: string[];
    tags: string[];
    priority?: string;
    bounty?: number;
    githubRepo?: string;
  }) {
    const response = await this.api.post('/issues', issueData);
    return response.data;
  }

  async updateIssue(issueId: string, updates: any) {
    const response = await this.api.patch(`/issues/${issueId}`, updates);
    return response.data;
  }

  async deleteIssue(issueId: string) {
    const response = await this.api.delete(`/issues/${issueId}`);
    return response.data;
  }

  async voteIssue(issueId: string, type: 'upvote' | 'downvote' | 'remove') {
    const response = await this.api.post(`/issues/${issueId}/vote`, { type });
    return response.data;
  }

  async followIssue(issueId: string) {
    const response = await this.api.post(`/issues/${issueId}/follow`);
    return response.data;
  }

  async getTrendingIssues(params?: { limit?: number; timeframe?: string }) {
    const response = await this.api.get('/issues/trending', { params });
    return response.data;
  }

  // Comment endpoints
  async getComments(issueId: string) {
    const response = await this.api.get(`/comments?issueId=${issueId}`);
    return response.data;
  }

  async createComment(commentData: {
    issueId: string;
    content: string;
    parentId?: string;
  }) {
    const response = await this.api.post('/comments', commentData);
    return response.data;
  }

  async updateComment(commentId: string, content: string) {
    const response = await this.api.patch(`/comments/${commentId}`, { content });
    return response.data;
  }

  async deleteComment(commentId: string) {
    const response = await this.api.delete(`/comments/${commentId}`);
    return response.data;
  }

  async voteComment(commentId: string, type: 'upvote' | 'downvote' | 'remove') {
    const response = await this.api.post(`/comments/${commentId}/vote`, { type });
    return response.data;
  }

  // Fix endpoints
  async createFix(issueId: string, fixData: {
    content: string;
    codeExample?: string;
    explanation?: string;
  }) {
    const response = await this.api.post(`/fixes/issue/${issueId}`, fixData);
    return response.data;
  }

  async getFixes(params?: {
    issueId?: string;
    userId?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get('/fixes', { params });
    return response.data;
  }

  async getFixesByIssue(issueId: string, params?: {
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get(`/fixes/issue/${issueId}`, { params });
    return response.data;
  }

  async updateFix(fixId: string, updates: any) {
    const response = await this.api.patch(`/fixes/${fixId}`, updates);
    return response.data;
  }

  async deleteFix(fixId: string) {
    const response = await this.api.delete(`/fixes/${fixId}`);
    return response.data;
  }

  async acceptFix(fixId: string, bountyAwarded?: number) {
    const response = await this.api.post(`/fixes/${fixId}/accept`, { bountyAwarded });
    return response.data;
  }

  async voteFix(fixId: string, type: 'upvote' | 'downvote' | 'remove') {
    const response = await this.api.post(`/fixes/${fixId}/vote`, { type });
    return response.data;
  }

  // User endpoints
  async getUsers(params?: {
    q?: string;
    skills?: string[];
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async getLeaderboard(category?: string) {
    const response = await this.api.get('/users/leaderboard', {
      params: { category },
    });
    return response.data;
  }

  // Message endpoints
  async getConversations() {
    const response = await this.api.get('/messages/conversations');
    return response.data;
  }

  async getMessages(conversationId: string) {
    const response = await this.api.get(`/messages/${conversationId}`);
    return response.data;
  }

  async sendMessage(messageData: {
    recipientId: string;
    content: string;
    issueId?: string;
    type?: string;
  }) {
    const response = await this.api.post('/messages', messageData);
    return response.data;
  }

  // Notification endpoints
  async getNotifications() {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationsAsRead(notificationIds: string[]) {
    const response = await this.api.patch('/notifications/mark-read', {
      notificationIds,
    });
    return response.data;
  }

  // Dashboard stats
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getRecentIssues(params?: { limit?: number }) {
    const response = await this.api.get('/dashboard/recent-issues', { params });
    return response.data;
  }

  async getRecentFixes(params?: { limit?: number }) {
    const response = await this.api.get('/dashboard/recent-fixes', { params });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
