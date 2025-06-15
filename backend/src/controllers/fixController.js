import { dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

// Create new fix
export const createFix = catchAsync(async (req, res, next) => {
  const { uid: authorId } = req.user;
  const { issueId } = req.params;
  const { description, codeSnippet, githubPr } = req.body;

  // Check if issue exists
  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Check if issue is still open
  if (issueData.status === 'solved' || issueData.status === 'closed') {
    return next(new AppError('Cannot submit fix for solved or closed issue', 400, 'ISSUE_NOT_OPEN'));
  }

  // Check if user is trying to fix their own issue
  if (issueData.authorId === authorId) {
    return next(new AppError('You cannot submit a fix for your own issue', 400, 'SELF_FIX'));
  }

  // Check if user already has a pending fix for this issue
  const existingFixSnapshot = await dbRefs.fixes
    .orderByChild('issueId')
    .equalTo(issueId)
    .once('value');

  const existingFixes = existingFixSnapshot.val() || {};
  const userHasPendingFix = Object.values(existingFixes).some(fix =>
    fix.authorId === authorId && !fix.isAccepted
  );

  if (userHasPendingFix) {
    return next(new AppError('You already have a pending fix for this issue', 400, 'DUPLICATE_FIX'));
  }

  const fixId = uuidv4();
  const fixData = {
    id: fixId,
    issueId,
    authorId,
    description,
    codeSnippet: codeSnippet || '',
    githubPr: githubPr || '',
    attachments: [],
    createdAt: firebaseHelpers.getServerTimestamp(),
    updatedAt: firebaseHelpers.getServerTimestamp(),
    isAccepted: false,
    votes: 0,
    votedUsers: {},
    bountyAwarded: 0
  };

  // Save fix
  await dbRefs.fixes.child(fixId).set(fixData);

  // Update user's XP
  const userRef = dbRefs.users.child(authorId);
  await userRef.transaction((user) => {
    if (user) {
      user.xp = (user.xp || 0) + 15; // Award XP for submitting fix
    }
    return user;
  });

  // Update issue status to in-progress if it's still open
  if (issueData.status === 'open') {
    await dbRefs.issues.child(issueId).update({
      status: 'in-progress',
      updatedAt: firebaseHelpers.getServerTimestamp()
    });
  }

  // Notify issue author and followers
  const followers = issueData.followers || [];
  const notificationPromises = followers
    .filter(followerId => followerId !== authorId)
    .map(async (followerId) => {
      const notificationId = uuidv4();
      const notificationData = {
        id: notificationId,
        userId: followerId,
        type: 'fix_submitted',
        title: 'New Fix Submitted',
        message: `${req.user.username} submitted a fix for "${issueData.title}"`,
        isRead: false,
        createdAt: firebaseHelpers.getServerTimestamp(),
        actionUrl: `/issues/${issueId}`,
        metadata: {
          issueId,
          fixId,
          authorId
        }
      };

      return dbRefs.notifications.child(notificationId).set(notificationData);
    });

  await Promise.all(notificationPromises);

  // Get author information
  const authorSnapshot = await dbRefs.users.child(authorId).once('value');
  const author = authorSnapshot.val();

  const fixWithAuthor = {
    ...fixData,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    }
  };

  res.status(201).json({
    success: true,
    message: 'Fix submitted successfully',
    data: {
      fix: fixWithAuthor
    }
  });
});

// Get fixes for an issue
export const getFixesForIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;
  const { uid: currentUserId } = req.user || {};

  // Check if issue exists
  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  if (!issueSnapshot.exists()) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Get all fixes for the issue
  const fixesSnapshot = await dbRefs.fixes.orderByChild('issueId').equalTo(issueId).once('value');
  const fixes = fixesSnapshot.val() || {};
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

  // Get author information for each fix
  const fixesWithAuthors = await Promise.all(
    paginatedFixes.map(async (fix) => {
      const authorSnapshot = await dbRefs.users.child(fix.authorId).once('value');
      const author = authorSnapshot.val();

      return {
        ...fix,
        author: author ? {
          id: author.id,
          username: author.username,
          avatar: author.avatar,
          level: author.level
        } : null,
        userVote: currentUserId && fix.votedUsers ? fix.votedUsers[currentUserId] : null,
        canEdit: currentUserId === fix.authorId && !fix.isAccepted,
        canDelete: currentUserId === fix.authorId || req.user?.isAdmin
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      fixes: fixesWithAuthors,
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

// Get fix by ID
export const getFixById = catchAsync(async (req, res, next) => {
  const { fixId } = req.params;
  const { uid: currentUserId } = req.user || {};

  const fixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const fixData = fixSnapshot.val();

  if (!fixData) {
    return next(new AppError('Fix not found', 404, 'FIX_NOT_FOUND'));
  }

  // Get author information
  const authorSnapshot = await dbRefs.users.child(fixData.authorId).once('value');
  const author = authorSnapshot.val();

  // Get issue information
  const issueSnapshot = await dbRefs.issues.child(fixData.issueId).once('value');
  const issue = issueSnapshot.val();

  const fixWithDetails = {
    id: fixId,
    ...fixData,
    author: author ? {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level,
      bio: author.bio,
      xp: author.xp
    } : null,
    issue: issue ? {
      id: fixData.issueId,
      title: issue.title,
      status: issue.status,
      bounty: issue.bounty,
      authorId: issue.authorId
    } : null,
    userVote: currentUserId && fixData.votedUsers ? fixData.votedUsers[currentUserId] : null
  };

  res.status(200).json({
    success: true,
    data: {
      fix: fixWithDetails
    }
  });
});

// Update fix
export const updateFix = catchAsync(async (req, res, next) => {
  const { fixId } = req.params;
  const { uid: currentUserId } = req.user;
  const updates = req.body;

  const fixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const fixData = fixSnapshot.val();

  if (!fixData) {
    return next(new AppError('Fix not found', 404, 'FIX_NOT_FOUND'));
  }

  // Check if user is the author
  if (fixData.authorId !== currentUserId) {
    return next(new AppError('You can only update your own fixes', 403, 'UNAUTHORIZED'));
  }

  // Check if fix is already accepted
  if (fixData.isAccepted) {
    return next(new AppError('Cannot update accepted fix', 400, 'FIX_ACCEPTED'));
  }

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.issueId;
  delete updates.authorId;
  delete updates.createdAt;
  delete updates.isAccepted;
  delete updates.votes;
  delete updates.votedUsers;
  delete updates.bountyAwarded;

  // Update fix
  await dbRefs.fixes.child(fixId).update({
    ...updates,
    updatedAt: firebaseHelpers.getServerTimestamp()
  });

  // Get updated fix
  const updatedFixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const updatedFix = updatedFixSnapshot.val();

  // Get author information
  const authorSnapshot = await dbRefs.users.child(updatedFix.authorId).once('value');
  const author = authorSnapshot.val();

  const fixWithAuthor = {
    id: fixId,
    ...updatedFix,
    author: author ? {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    } : null
  };

  res.status(200).json({
    success: true,
    message: 'Fix updated successfully',
    data: {
      fix: fixWithAuthor
    }
  });
});

// Delete fix
export const deleteFix = catchAsync(async (req, res, next) => {
  const { fixId } = req.params;
  const { uid: currentUserId } = req.user;

  const fixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const fixData = fixSnapshot.val();

  if (!fixData) {
    return next(new AppError('Fix not found', 404, 'FIX_NOT_FOUND'));
  }

  // Check if user is the author or admin
  if (fixData.authorId !== currentUserId && !req.user.isAdmin) {
    return next(new AppError('You can only delete your own fixes', 403, 'UNAUTHORIZED'));
  }

  // Check if fix is already accepted
  if (fixData.isAccepted) {
    return next(new AppError('Cannot delete accepted fix', 400, 'FIX_ACCEPTED'));
  }

  // Delete fix
  await dbRefs.fixes.child(fixId).remove();

  res.status(200).json({
    success: true,
    message: 'Fix deleted successfully'
  });
});

// Accept fix (issue author only)
export const acceptFix = catchAsync(async (req, res, next) => {
  const { fixId } = req.params;
  const { uid: currentUserId } = req.user;
  const { bountyAwarded } = req.body;

  const fixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const fixData = fixSnapshot.val();

  if (!fixData) {
    return next(new AppError('Fix not found', 404, 'FIX_NOT_FOUND'));
  }

  // Get issue data
  const issueSnapshot = await dbRefs.issues.child(fixData.issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Check if user is the issue author
  if (issueData.authorId !== currentUserId) {
    return next(new AppError('Only issue author can accept fixes', 403, 'UNAUTHORIZED'));
  }

  // Check if fix is already accepted
  if (fixData.isAccepted) {
    return next(new AppError('Fix is already accepted', 400, 'FIX_ALREADY_ACCEPTED'));
  }

  // Validate bounty amount
  const bountyAmount = bountyAwarded || issueData.bounty || 0;
  if (bountyAmount > (issueData.bounty || 0)) {
    return next(new AppError('Bounty amount cannot exceed issue bounty', 400, 'INVALID_BOUNTY'));
  }

  // Update fix as accepted
  await dbRefs.fixes.child(fixId).update({
    isAccepted: true,
    bountyAwarded: bountyAmount,
    acceptedAt: firebaseHelpers.getServerTimestamp()
  });

  // Update issue status to solved
  await dbRefs.issues.child(fixData.issueId).update({
    status: 'solved',
    solvedAt: firebaseHelpers.getServerTimestamp(),
    acceptedFixId: fixId,
    updatedAt: firebaseHelpers.getServerTimestamp()
  });

  // Update fix author's stats and award bounty
  const fixAuthorRef = dbRefs.users.child(fixData.authorId);
  await fixAuthorRef.transaction((user) => {
    if (user) {
      user.issuesFixed = (user.issuesFixed || 0) + 1;
      user.bountyEarned = (user.bountyEarned || 0) + bountyAmount;
      user.xp = (user.xp || 0) + 50 + bountyAmount; // Bonus XP for accepted fix
    }
    return user;
  });

  // Notify fix author
  const notificationId = uuidv4();
  const notificationData = {
    id: notificationId,
    userId: fixData.authorId,
    type: 'bounty_awarded',
    title: 'Fix Accepted!',
    message: `Your fix for "${issueData.title}" was accepted${bountyAmount > 0 ? ` and you earned $${bountyAmount}` : ''}`,
    isRead: false,
    createdAt: firebaseHelpers.getServerTimestamp(),
    actionUrl: `/issues/${fixData.issueId}`,
    metadata: {
      issueId: fixData.issueId,
      fixId,
      bountyAmount
    }
  };

  await dbRefs.notifications.child(notificationId).set(notificationData);

  // Check for badge eligibility
  const fixAuthorSnapshot = await dbRefs.users.child(fixData.authorId).once('value');
  const fixAuthor = fixAuthorSnapshot.val();

  if (fixAuthor) {
    const newBadges = [];

    // First Fix badge
    if (fixAuthor.issuesFixed === 1) {
      newBadges.push('first-fix');
    }

    // Bug Slayer badge (10+ fixes)
    if (fixAuthor.issuesFixed >= 10) {
      newBadges.push('bug-slayer');
    }

    // Bounty Hunter badge ($500+ earned)
    if (fixAuthor.bountyEarned >= 500) {
      newBadges.push('bounty-hunter');
    }

    // Award new badges
    if (newBadges.length > 0) {
      const currentBadges = fixAuthor.badges || [];
      const updatedBadges = [...new Set([...currentBadges, ...newBadges])];

      await dbRefs.users.child(fixData.authorId).update({
        badges: updatedBadges
      });

      // Notify about new badges
      for (const badge of newBadges) {
        if (!currentBadges.includes(badge)) {
          const badgeNotificationId = uuidv4();
          const badgeNotificationData = {
            id: badgeNotificationId,
            userId: fixData.authorId,
            type: 'badge_earned',
            title: 'Badge Earned!',
            message: `You earned the "${badge.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}" badge`,
            isRead: false,
            createdAt: firebaseHelpers.getServerTimestamp(),
            metadata: {
              badge
            }
          };

          await dbRefs.notifications.child(badgeNotificationId).set(badgeNotificationData);
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Fix accepted successfully',
    data: {
      bountyAwarded: bountyAmount
    }
  });
});

// Vote on fix
export const voteFix = catchAsync(async (req, res, next) => {
  const { fixId } = req.params;
  const { uid: currentUserId } = req.user;
  const { type } = req.body; // 'upvote', 'downvote', or 'remove'

  const fixSnapshot = await dbRefs.fixes.child(fixId).once('value');
  const fixData = fixSnapshot.val();

  if (!fixData) {
    return next(new AppError('Fix not found', 404, 'FIX_NOT_FOUND'));
  }

  // Can't vote on own fix
  if (fixData.authorId === currentUserId) {
    return next(new AppError('You cannot vote on your own fix', 400, 'SELF_VOTE'));
  }

  const votedUsers = fixData.votedUsers || {};
  const currentVote = votedUsers[currentUserId];
  let votes = fixData.votes || 0;

  // Remove previous vote if exists
  if (currentVote === 'upvote') {
    votes -= 1;
  } else if (currentVote === 'downvote') {
    votes += 1;
  }

  // Apply new vote
  if (type === 'upvote' && currentVote !== 'upvote') {
    votes += 1;
    votedUsers[currentUserId] = 'upvote';
  } else if (type === 'downvote' && currentVote !== 'downvote') {
    votes -= 1;
    votedUsers[currentUserId] = 'downvote';
  } else if (type === 'remove') {
    delete votedUsers[currentUserId];
  }

  // Update fix
  await dbRefs.fixes.child(fixId).update({
    votes,
    votedUsers
  });

  // Award/deduct XP to fix author based on vote
  if (type === 'upvote' && currentVote !== 'upvote') {
    const authorRef = dbRefs.users.child(fixData.authorId);
    await authorRef.transaction((user) => {
      if (user) {
        user.xp = (user.xp || 0) + 2; // Award XP for receiving upvote
      }
      return user;
    });
  } else if (type === 'downvote' && currentVote !== 'downvote') {
    const authorRef = dbRefs.users.child(fixData.authorId);
    await authorRef.transaction((user) => {
      if (user) {
        user.xp = Math.max((user.xp || 0) - 1, 0); // Deduct XP for receiving downvote
      }
      return user;
    });
  }

  res.status(200).json({
    success: true,
    message: 'Vote updated successfully',
    data: {
      votes,
      userVote: votedUsers[currentUserId] || null
    }
  });
});

// Get user's fixes
export const getUserFixes = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

  // Check if user exists
  const userSnapshot = await dbRefs.users.child(userId).once('value');
  if (!userSnapshot.exists()) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Get user's fixes
  const fixesSnapshot = await dbRefs.fixes.orderByChild('authorId').equalTo(userId).once('value');
  const fixes = fixesSnapshot.val() || {};
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

// Get fix statistics
export const getFixStats = catchAsync(async (req, res, next) => {
  const fixesSnapshot = await dbRefs.fixes.once('value');
  const fixes = fixesSnapshot.val() || {};
  const fixesArray = Object.values(fixes);

  const stats = {
    total: fixesArray.length,
    accepted: fixesArray.filter(fix => fix.isAccepted).length,
    pending: fixesArray.filter(fix => !fix.isAccepted).length,
    totalBountyAwarded: fixesArray.reduce((sum, fix) => sum + (fix.bountyAwarded || 0), 0),
    averageBounty: fixesArray.length > 0 ?
      Math.round(fixesArray.reduce((sum, fix) => sum + (fix.bountyAwarded || 0), 0) / fixesArray.length * 100) / 100 : 0,
    totalVotes: fixesArray.reduce((sum, fix) => sum + Math.abs(fix.votes || 0), 0),
    averageVotes: fixesArray.length > 0 ?
      Math.round(fixesArray.reduce((sum, fix) => sum + (fix.votes || 0), 0) / fixesArray.length * 100) / 100 : 0,
    acceptanceRate: fixesArray.length > 0 ?
      Math.round((fixesArray.filter(fix => fix.isAccepted).length / fixesArray.length) * 100) : 0
  };

  res.status(200).json({
    success: true,
    data: {
      stats
    }
  });
});

export default {
  createFix,
  getFixesForIssue,
  getFixById,
  updateFix,
  deleteFix,
  acceptFix,
  voteFix,
  getUserFixes,
  getFixStats
};
