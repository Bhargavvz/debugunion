import { dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';

// Get user profile by ID
export const getUserProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  const userData = userSnapshot.val();

  if (!userData) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Remove sensitive information if not the user's own profile
  if (req.user?.uid !== userId) {
    delete userData.email;
    delete userData.preferences;
    if (!userData.preferences?.showEmail) {
      delete userData.email;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      user: userData
    }
  });
});

// Get user statistics
export const getUserStats = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  const userData = userSnapshot.val();

  if (!userData) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Get user's issues
  const issuesSnapshot = await dbRefs.issues.orderByChild('authorId').equalTo(userId).once('value');
  const issues = issuesSnapshot.val() || {};
  const issuesArray = Object.values(issues);

  // Get user's fixes
  const fixesSnapshot = await dbRefs.fixes.orderByChild('authorId').equalTo(userId).once('value');
  const fixes = fixesSnapshot.val() || {};
  const fixesArray = Object.values(fixes);

  // Calculate statistics
  const stats = {
    totalIssues: issuesArray.length,
    openIssues: issuesArray.filter(issue => issue.status === 'open').length,
    solvedIssues: issuesArray.filter(issue => issue.status === 'solved').length,
    totalFixes: fixesArray.length,
    acceptedFixes: fixesArray.filter(fix => fix.isAccepted).length,
    totalBountyEarned: fixesArray.reduce((sum, fix) => sum + (fix.bountyAwarded || 0), 0),
    totalBountyOffered: issuesArray.reduce((sum, issue) => sum + (issue.bounty || 0), 0),
    averageIssueViews: issuesArray.length > 0 ?
      Math.round(issuesArray.reduce((sum, issue) => sum + (issue.views || 0), 0) / issuesArray.length) : 0,
    mostUsedTags: getMostUsedTags(issuesArray),
    recentActivity: await getRecentActivity(userId)
  };

  res.status(200).json({
    success: true,
    data: {
      stats
    }
  });
});

// Get user's issues
export const getUserIssues = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status = 'all', page = 1, limit = 20, sortBy = 'newest' } = req.query;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  if (!userSnapshot.exists()) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  let issuesQuery = dbRefs.issues.orderByChild('authorId').equalTo(userId);

  const issuesSnapshot = await issuesQuery.once('value');
  let issues = issuesSnapshot.val() || {};
  let issuesArray = Object.entries(issues).map(([id, issue]) => ({
    id,
    ...issue
  }));

  // Filter by status
  if (status !== 'all') {
    issuesArray = issuesArray.filter(issue => issue.status === status);
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

// Get user's fixes
export const getUserFixes = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  if (!userSnapshot.exists()) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const fixesSnapshot = await dbRefs.fixes.orderByChild('authorId').equalTo(userId).once('value');
  let fixes = fixesSnapshot.val() || {};
  let fixesArray = Object.entries(fixes).map(([id, fix]) => ({
    id,
    ...fix
  }));

  // Sort fixes
  fixesArray.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'most-voted':
        return (b.votes || 0) - (a.votes || 0);
      case 'accepted':
        return b.isAccepted - a.isAccepted;
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedFixes = fixesArray.slice(startIndex, endIndex);

  // Get issue information for each fix
  const fixesWithIssues = await Promise.all(
    paginatedFixes.map(async (fix) => {
      const issueSnapshot = await dbRefs.issues.child(fix.issueId).once('value');
      const issue = issueSnapshot.val();

      return {
        ...fix,
        issue: issue ? {
          id: fix.issueId,
          title: issue.title,
          status: issue.status,
          bounty: issue.bounty
        } : null
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      fixes: fixesWithIssues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(fixesArray.length / limit),
        totalItems: fixesArray.length,
        hasNext: endIndex < fixesArray.length,
        hasPrev: page > 1
      }
    }
  });
});

// Follow/unfollow user
export const toggleFollowUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { uid: currentUserId } = req.user;

  if (userId === currentUserId) {
    return next(new AppError('You cannot follow yourself', 400, 'SELF_FOLLOW'));
  }

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  if (!userSnapshot.exists()) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const currentUserSnapshot = await dbRefs.users.child(currentUserId).once('value');
  const currentUser = currentUserSnapshot.val();

  const following = currentUser.following || [];
  const isFollowing = following.includes(userId);

  let updatedFollowing;
  let message;

  if (isFollowing) {
    // Unfollow
    updatedFollowing = following.filter(id => id !== userId);
    message = 'User unfollowed successfully';
  } else {
    // Follow
    updatedFollowing = [...following, userId];
    message = 'User followed successfully';
  }

  // Update current user's following list
  await dbRefs.users.child(currentUserId).update({
    following: updatedFollowing
  });

  // Update target user's followers count
  const targetUser = userSnapshot.val();
  const followers = targetUser.followers || [];
  let updatedFollowers;

  if (isFollowing) {
    updatedFollowers = followers.filter(id => id !== currentUserId);
  } else {
    updatedFollowers = [...followers, currentUserId];
  }

  await dbRefs.users.child(userId).update({
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

// Get user's followers
export const getUserFollowers = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  const userData = userSnapshot.val();

  if (!userData) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const followers = userData.followers || [];

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedFollowers = followers.slice(startIndex, endIndex);

  // Get follower details
  const followersDetails = await Promise.all(
    paginatedFollowers.map(async (followerId) => {
      const followerSnapshot = await dbRefs.users.child(followerId).once('value');
      const follower = followerSnapshot.val();

      return follower ? {
        id: followerId,
        username: follower.username,
        avatar: follower.avatar,
        level: follower.level,
        xp: follower.xp
      } : null;
    })
  );

  // Filter out null values
  const validFollowers = followersDetails.filter(follower => follower !== null);

  res.status(200).json({
    success: true,
    data: {
      followers: validFollowers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(followers.length / limit),
        totalItems: followers.length,
        hasNext: endIndex < followers.length,
        hasPrev: page > 1
      }
    }
  });
});

// Get user's following
export const getUserFollowing = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const userSnapshot = await dbRefs.users.child(userId).once('value');
  const userData = userSnapshot.val();

  if (!userData) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const following = userData.following || [];

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedFollowing = following.slice(startIndex, endIndex);

  // Get following details
  const followingDetails = await Promise.all(
    paginatedFollowing.map(async (followingId) => {
      const followingSnapshot = await dbRefs.users.child(followingId).once('value');
      const followingUser = followingSnapshot.val();

      return followingUser ? {
        id: followingId,
        username: followingUser.username,
        avatar: followingUser.avatar,
        level: followingUser.level,
        xp: followingUser.xp
      } : null;
    })
  );

  // Filter out null values
  const validFollowing = followingDetails.filter(user => user !== null);

  res.status(200).json({
    success: true,
    data: {
      following: validFollowing,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(following.length / limit),
        totalItems: following.length,
        hasNext: endIndex < following.length,
        hasPrev: page > 1
      }
    }
  });
});

// Search users
export const searchUsers = catchAsync(async (req, res, next) => {
  const { q, skills, sortBy = 'newest', page = 1, limit = 20 } = req.query;

  let usersSnapshot = await dbRefs.users.once('value');
  let users = usersSnapshot.val() || {};
  let usersArray = Object.entries(users).map(([id, user]) => ({
    id,
    ...user
  }));

  // Filter by search query
  if (q) {
    const searchTerm = q.toLowerCase();
    usersArray = usersArray.filter(user =>
      user.username?.toLowerCase().includes(searchTerm) ||
      user.bio?.toLowerCase().includes(searchTerm) ||
      user.company?.toLowerCase().includes(searchTerm) ||
      user.location?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by skills
  if (skills && skills.length > 0) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    usersArray = usersArray.filter(user =>
      user.skills && skillsArray.some(skill =>
        user.skills.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
  }

  // Sort users
  usersArray.sort((a, b) => {
    switch (sortBy) {
      case 'xp':
        return (b.xp || 0) - (a.xp || 0);
      case 'issues-fixed':
        return (b.issuesFixed || 0) - (a.issuesFixed || 0);
      case 'bounty-earned':
        return (b.bountyEarned || 0) - (a.bountyEarned || 0);
      case 'newest':
      default:
        return new Date(b.joinedAt) - new Date(a.joinedAt);
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedUsers = usersArray.slice(startIndex, endIndex);

  // Remove sensitive information
  const sanitizedUsers = paginatedUsers.map(user => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    company: user.company,
    xp: user.xp,
    level: user.level,
    issuesFixed: user.issuesFixed,
    bountyEarned: user.bountyEarned,
    skills: user.skills,
    badges: user.badges,
    isOnline: user.isOnline,
    lastActive: user.lastActive
  }));

  res.status(200).json({
    success: true,
    data: {
      users: sanitizedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(usersArray.length / limit),
        totalItems: usersArray.length,
        hasNext: endIndex < usersArray.length,
        hasPrev: page > 1
      }
    }
  });
});

// Helper function to get most used tags
const getMostUsedTags = (issues) => {
  const tagCount = {};
  issues.forEach(issue => {
    if (issue.tags) {
      issue.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
};

// Helper function to get recent activity
const getRecentActivity = async (userId) => {
  const activities = [];

  // Get recent issues
  const issuesSnapshot = await dbRefs.issues
    .orderByChild('authorId')
    .equalTo(userId)
    .limitToLast(3)
    .once('value');

  const issues = issuesSnapshot.val() || {};
  Object.entries(issues).forEach(([id, issue]) => {
    activities.push({
      type: 'issue',
      id,
      title: issue.title,
      createdAt: issue.createdAt
    });
  });

  // Get recent fixes
  const fixesSnapshot = await dbRefs.fixes
    .orderByChild('authorId')
    .equalTo(userId)
    .limitToLast(3)
    .once('value');

  const fixes = fixesSnapshot.val() || {};
  for (const [id, fix] of Object.entries(fixes)) {
    const issueSnapshot = await dbRefs.issues.child(fix.issueId).once('value');
    const issue = issueSnapshot.val();

    activities.push({
      type: 'fix',
      id,
      issueTitle: issue?.title,
      createdAt: fix.createdAt
    });
  }

  // Sort by date and return most recent
  return activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
};

export default {
  getUserProfile,
  getUserStats,
  getUserIssues,
  getUserFixes,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  searchUsers
};
