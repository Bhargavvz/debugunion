import { dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

// Create new issue
export const createIssue = catchAsync(async (req, res, next) => {
  const { uid: authorId } = req.user;
  const {
    title,
    description,
    category,
    stack,
    tags,
    priority = 'medium',
    bounty = 0,
    githubRepo
  } = req.body;

  const issueId = uuidv4();
  const issueData = {
    id: issueId,
    title,
    description,
    category,
    stack,
    tags,
    authorId,
    createdAt: firebaseHelpers.getServerTimestamp(),
    updatedAt: firebaseHelpers.getServerTimestamp(),
    status: 'open',
    priority,
    bounty,
    githubRepo: githubRepo || '',
    attachments: [],
    fixes: [],
    comments: [],
    views: 0,
    upvotes: 0,
    downvotes: 0,
    followers: [authorId], // Author automatically follows their issue
    votedUsers: {}
  };

  // Save issue
  await dbRefs.issues.child(issueId).set(issueData);

  // Update user's issues count
  const userRef = dbRefs.users.child(authorId);
  await userRef.transaction((user) => {
    if (user) {
      user.issuesPosted = (user.issuesPosted || 0) + 1;
      user.xp = (user.xp || 0) + 10; // Award XP for posting issue
    }
    return user;
  });

  // Get author information
  const authorSnapshot = await dbRefs.users.child(authorId).once('value');
  const author = authorSnapshot.val();

  const issueWithAuthor = {
    ...issueData,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    }
  };

  res.status(201).json({
    success: true,
    message: 'Issue created successfully',
    data: {
      issue: issueWithAuthor
    }
  });
});

// Get all issues with filtering and pagination
export const getIssues = catchAsync(async (req, res, next) => {
  const {
    category = 'all',
    status = 'all',
    priority = 'all',
    sortBy = 'newest',
    tags,
    minBounty,
    maxBounty,
    q,
    page = 1,
    limit = 20
  } = req.query;

  let issuesSnapshot = await dbRefs.issues.once('value');
  let issues = issuesSnapshot.val() || {};
  let issuesArray = Object.entries(issues).map(([id, issue]) => ({
    id,
    ...issue
  }));

  // Filter by category
  if (category !== 'all') {
    issuesArray = issuesArray.filter(issue => issue.category === category);
  }

  // Filter by status
  if (status !== 'all') {
    issuesArray = issuesArray.filter(issue => issue.status === status);
  }

  // Filter by priority
  if (priority !== 'all') {
    issuesArray = issuesArray.filter(issue => issue.priority === priority);
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    issuesArray = issuesArray.filter(issue =>
      issue.tags && tagsArray.some(tag =>
        issue.tags.some(issueTag =>
          issueTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  // Filter by bounty range
  if (minBounty) {
    issuesArray = issuesArray.filter(issue => (issue.bounty || 0) >= parseInt(minBounty));
  }
  if (maxBounty) {
    issuesArray = issuesArray.filter(issue => (issue.bounty || 0) <= parseInt(maxBounty));
  }

  // Filter by search query
  if (q) {
    const searchTerm = q.toLowerCase();
    issuesArray = issuesArray.filter(issue =>
      issue.title?.toLowerCase().includes(searchTerm) ||
      issue.description?.toLowerCase().includes(searchTerm) ||
      issue.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      issue.stack?.some(tech => tech.toLowerCase().includes(searchTerm))
    );
  }

  // Sort issues
  issuesArray.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'most-bountied':
        return (b.bounty || 0) - (a.bounty || 0);
      case 'most-active':
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      case 'most-upvoted':
        return (b.upvotes || 0) - (a.upvotes || 0);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedIssues = issuesArray.slice(startIndex, endIndex);

  // Get author information for each issue
  const issuesWithAuthors = await Promise.all(
    paginatedIssues.map(async (issue) => {
      const authorSnapshot = await dbRefs.users.child(issue.authorId).once('value');
      const author = authorSnapshot.val();

      return {
        ...issue,
        author: author ? {
          id: author.id,
          username: author.username,
          avatar: author.avatar,
          level: author.level
        } : null
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      issues: issuesWithAuthors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(issuesArray.length / limit),
        totalItems: issuesArray.length,
        hasNext: endIndex < issuesArray.length,
        hasPrev: page > 1
      }
    }
  });
});

// Get issue by ID
export const getIssueById = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { uid: currentUserId } = req.user || {};

  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Increment view count if not the author
  if (currentUserId && currentUserId !== issueData.authorId) {
    await dbRefs.issues.child(issueId).update({
      views: (issueData.views || 0) + 1
    });
    issueData.views = (issueData.views || 0) + 1;
  }

  // Get author information
  const authorSnapshot = await dbRefs.users.child(issueData.authorId).once('value');
  const author = authorSnapshot.val();

  // Get comments with author information
  const commentsSnapshot = await dbRefs.comments.orderByChild('issueId').equalTo(issueId).once('value');
  const comments = commentsSnapshot.val() || {};
  const commentsArray = await Promise.all(
    Object.entries(comments).map(async ([commentId, comment]) => {
      const commentAuthorSnapshot = await dbRefs.users.child(comment.authorId).once('value');
      const commentAuthor = commentAuthorSnapshot.val();

      return {
        id: commentId,
        ...comment,
        author: commentAuthor ? {
          id: commentAuthor.id,
          username: commentAuthor.username,
          avatar: commentAuthor.avatar,
          level: commentAuthor.level
        } : null
      };
    })
  );

  // Get fixes with author information
  const fixesSnapshot = await dbRefs.fixes.orderByChild('issueId').equalTo(issueId).once('value');
  const fixes = fixesSnapshot.val() || {};
  const fixesArray = await Promise.all(
    Object.entries(fixes).map(async ([fixId, fix]) => {
      const fixAuthorSnapshot = await dbRefs.users.child(fix.authorId).once('value');
      const fixAuthor = fixAuthorSnapshot.val();

      return {
        id: fixId,
        ...fix,
        author: fixAuthor ? {
          id: fixAuthor.id,
          username: fixAuthor.username,
          avatar: fixAuthor.avatar,
          level: fixAuthor.level
        } : null
      };
    })
  );

  const issueWithDetails = {
    id: issueId,
    ...issueData,
    author: author ? {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level,
      bio: author.bio,
      xp: author.xp
    } : null,
    comments: commentsArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    fixes: fixesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    isFollowing: currentUserId ? (issueData.followers || []).includes(currentUserId) : false,
    userVote: currentUserId && issueData.votedUsers ? issueData.votedUsers[currentUserId] : null
  };

  res.status(200).json({
    success: true,
    data: {
      issue: issueWithDetails
    }
  });
});

// Update issue
export const updateIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { uid: currentUserId } = req.user;
  const updates = req.body;

  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Check if user is the author or admin
  if (issueData.authorId !== currentUserId && !req.user.isAdmin) {
    return next(new AppError('You can only update your own issues', 403, 'UNAUTHORIZED'));
  }

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.authorId;
  delete updates.createdAt;
  delete updates.views;
  delete updates.upvotes;
  delete updates.downvotes;
  delete updates.followers;
  delete updates.votedUsers;

  // Update issue
  await dbRefs.issues.child(issueId).update({
    ...updates,
    updatedAt: firebaseHelpers.getServerTimestamp()
  });

  // Get updated issue
  const updatedIssueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const updatedIssue = updatedIssueSnapshot.val();

  // Get author information
  const authorSnapshot = await dbRefs.users.child(updatedIssue.authorId).once('value');
  const author = authorSnapshot.val();

  const issueWithAuthor = {
    id: issueId,
    ...updatedIssue,
    author: author ? {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    } : null
  };

  res.status(200).json({
    success: true,
    message: 'Issue updated successfully',
    data: {
      issue: issueWithAuthor
    }
  });
});

// Delete issue
export const deleteIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { uid: currentUserId } = req.user;

  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Check if user is the author or admin
  if (issueData.authorId !== currentUserId && !req.user.isAdmin) {
    return next(new AppError('You can only delete your own issues', 403, 'UNAUTHORIZED'));
  }

  // Delete related data
  const batch = {};

  // Delete issue
  batch[`issues/${issueId}`] = null;

  // Delete comments
  const commentsSnapshot = await dbRefs.comments.orderByChild('issueId').equalTo(issueId).once('value');
  const comments = commentsSnapshot.val() || {};
  Object.keys(comments).forEach(commentId => {
    batch[`comments/${commentId}`] = null;
  });

  // Delete fixes
  const fixesSnapshot = await dbRefs.fixes.orderByChild('issueId').equalTo(issueId).once('value');
  const fixes = fixesSnapshot.val() || {};
  Object.keys(fixes).forEach(fixId => {
    batch[`fixes/${fixId}`] = null;
  });

  // Execute batch delete
  await firebaseHelpers.createBatchUpdate(batch);

  // Update user's issues count
  const userRef = dbRefs.users.child(issueData.authorId);
  await userRef.transaction((user) => {
    if (user) {
      user.issuesPosted = Math.max((user.issuesPosted || 1) - 1, 0);
    }
    return user;
  });

  res.status(200).json({
    success: true,
    message: 'Issue deleted successfully'
  });
});

// Vote on issue (upvote/downvote)
export const voteIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { uid: currentUserId } = req.user;
  const { type } = req.body; // 'upvote', 'downvote', or 'remove'

  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Can't vote on own issue
  if (issueData.authorId === currentUserId) {
    return next(new AppError('You cannot vote on your own issue', 400, 'SELF_VOTE'));
  }

  const votedUsers = issueData.votedUsers || {};
  const currentVote = votedUsers[currentUserId];
  let upvotes = issueData.upvotes || 0;
  let downvotes = issueData.downvotes || 0;

  // Remove previous vote if exists
  if (currentVote === 'upvote') {
    upvotes = Math.max(upvotes - 1, 0);
  } else if (currentVote === 'downvote') {
    downvotes = Math.max(downvotes - 1, 0);
  }

  // Apply new vote
  if (type === 'upvote' && currentVote !== 'upvote') {
    upvotes += 1;
    votedUsers[currentUserId] = 'upvote';
  } else if (type === 'downvote' && currentVote !== 'downvote') {
    downvotes += 1;
    votedUsers[currentUserId] = 'downvote';
  } else if (type === 'remove') {
    delete votedUsers[currentUserId];
  }

  // Update issue
  await dbRefs.issues.child(issueId).update({
    upvotes,
    downvotes,
    votedUsers
  });

  res.status(200).json({
    success: true,
    message: 'Vote updated successfully',
    data: {
      upvotes,
      downvotes,
      userVote: votedUsers[currentUserId] || null
    }
  });
});

// Follow/unfollow issue
export const toggleFollowIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { uid: currentUserId } = req.user;

  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  const followers = issueData.followers || [];
  const isFollowing = followers.includes(currentUserId);

  let updatedFollowers;
  let message;

  if (isFollowing) {
    // Unfollow
    updatedFollowers = followers.filter(id => id !== currentUserId);
    message = 'Issue unfollowed successfully';
  } else {
    // Follow
    updatedFollowers = [...followers, currentUserId];
    message = 'Issue followed successfully';
  }

  await dbRefs.issues.child(issueId).update({
    followers: updatedFollowers
  });

  res.status(200).json({
    success: true,
    message,
    data: {
      isFollowing: !isFollowing,
      followersCount: updatedFollowers.length
    }
  });
});

// Get trending issues
export const getTrendingIssues = catchAsync(async (req, res, next) => {
  const { limit = 10, timeframe = 'week' } = req.query;

  const issuesSnapshot = await dbRefs.issues.once('value');
  let issues = issuesSnapshot.val() || {};
  let issuesArray = Object.entries(issues).map(([id, issue]) => ({
    id,
    ...issue
  }));

  // Filter by timeframe
  const now = new Date();
  let timeLimit;

  switch (timeframe) {
    case 'day':
      timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'month':
      timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'week':
    default:
      timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  issuesArray = issuesArray.filter(issue =>
    new Date(issue.createdAt) >= timeLimit && issue.status === 'open'
  );

  // Calculate trending score (views + upvotes + comments + bounty weight)
  issuesArray = issuesArray.map(issue => ({
    ...issue,
    trendingScore: (issue.views || 0) +
                   (issue.upvotes || 0) * 2 +
                   (issue.comments?.length || 0) * 3 +
                   (issue.bounty || 0) * 0.1
  }));

  // Sort by trending score
  issuesArray.sort((a, b) => b.trendingScore - a.trendingScore);

  // Limit results
  const trendingIssues = issuesArray.slice(0, parseInt(limit));

  // Get author information
  const issuesWithAuthors = await Promise.all(
    trendingIssues.map(async (issue) => {
      const authorSnapshot = await dbRefs.users.child(issue.authorId).once('value');
      const author = authorSnapshot.val();

      return {
        ...issue,
        author: author ? {
          id: author.id,
          username: author.username,
          avatar: author.avatar,
          level: author.level
        } : null
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      issues: issuesWithAuthors
    }
  });
});

// Get issue statistics
export const getIssueStats = catchAsync(async (req, res, next) => {
  const issuesSnapshot = await dbRefs.issues.once('value');
  const issues = issuesSnapshot.val() || {};
  const issuesArray = Object.values(issues);

  const stats = {
    total: issuesArray.length,
    open: issuesArray.filter(issue => issue.status === 'open').length,
    inProgress: issuesArray.filter(issue => issue.status === 'in-progress').length,
    solved: issuesArray.filter(issue => issue.status === 'solved').length,
    closed: issuesArray.filter(issue => issue.status === 'closed').length,
    totalBounty: issuesArray.reduce((sum, issue) => sum + (issue.bounty || 0), 0),
    averageBounty: issuesArray.length > 0 ?
      Math.round(issuesArray.reduce((sum, issue) => sum + (issue.bounty || 0), 0) / issuesArray.length) : 0,
    categoryCounts: {
      bug: issuesArray.filter(issue => issue.category === 'bug').length,
      feature: issuesArray.filter(issue => issue.category === 'feature').length,
      question: issuesArray.filter(issue => issue.category === 'question').length,
      discussion: issuesArray.filter(issue => issue.category === 'discussion').length
    },
    priorityCounts: {
      low: issuesArray.filter(issue => issue.priority === 'low').length,
      medium: issuesArray.filter(issue => issue.priority === 'medium').length,
      high: issuesArray.filter(issue => issue.priority === 'high').length,
      urgent: issuesArray.filter(issue => issue.priority === 'urgent').length
    }
  };

  res.status(200).json({
    success: true,
    data: {
      stats
    }
  });
});

export default {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
  toggleFollowIssue,
  getTrendingIssues,
  getIssueStats
};
