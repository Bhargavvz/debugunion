import { dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

// Create new comment
export const createComment = catchAsync(async (req, res, next) => {
  const { uid: authorId } = req.user;
  const { issueId } = req.params;
  const { content, parentId } = req.body;

  // Check if issue exists
  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  const issueData = issueSnapshot.val();

  if (!issueData) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // If parentId is provided, check if parent comment exists
  if (parentId) {
    const parentSnapshot = await dbRefs.comments.child(parentId).once('value');
    const parentComment = parentSnapshot.val();

    if (!parentComment || parentComment.issueId !== issueId) {
      return next(new AppError('Parent comment not found', 404, 'PARENT_COMMENT_NOT_FOUND'));
    }
  }

  const commentId = uuidv4();
  const commentData = {
    id: commentId,
    issueId,
    authorId,
    content,
    parentId: parentId || null,
    createdAt: firebaseHelpers.getServerTimestamp(),
    updatedAt: firebaseHelpers.getServerTimestamp(),
    votes: 0,
    votedUsers: {},
    isEdited: false
  };

  // Save comment
  await dbRefs.comments.child(commentId).set(commentData);

  // Update user's XP
  const userRef = dbRefs.users.child(authorId);
  await userRef.transaction((user) => {
    if (user) {
      user.xp = (user.xp || 0) + 2; // Award XP for commenting
    }
    return user;
  });

  // Notify issue followers (except the commenter)
  const followers = issueData.followers || [];
  const notificationPromises = followers
    .filter(followerId => followerId !== authorId)
    .map(async (followerId) => {
      const notificationId = uuidv4();
      const notificationData = {
        id: notificationId,
        userId: followerId,
        type: 'issue_comment',
        title: 'New Comment',
        message: `${req.user.username} commented on "${issueData.title}"`,
        isRead: false,
        createdAt: firebaseHelpers.getServerTimestamp(),
        actionUrl: `/issues/${issueId}`,
        metadata: {
          issueId,
          commentId,
          authorId
        }
      };

      return dbRefs.notifications.child(notificationId).set(notificationData);
    });

  await Promise.all(notificationPromises);

  // Get author information
  const authorSnapshot = await dbRefs.users.child(authorId).once('value');
  const author = authorSnapshot.val();

  const commentWithAuthor = {
    ...commentData,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    }
  };

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: {
      comment: commentWithAuthor
    }
  });
});

// Get comments for an issue
export const getComments = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  const { page = 1, limit = 20, sortBy = 'oldest' } = req.query;
  const { uid: currentUserId } = req.user || {};

  // Check if issue exists
  const issueSnapshot = await dbRefs.issues.child(issueId).once('value');
  if (!issueSnapshot.exists()) {
    return next(new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND'));
  }

  // Get all comments for the issue
  const commentsSnapshot = await dbRefs.comments.orderByChild('issueId').equalTo(issueId).once('value');
  const comments = commentsSnapshot.val() || {};
  let commentsArray = Object.entries(comments).map(([id, comment]) => ({
    id,
    ...comment
  }));

  // Sort comments
  commentsArray.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'most-voted':
        return (b.votes || 0) - (a.votes || 0);
      case 'oldest':
      default:
        return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  // Separate parent comments and replies
  const parentComments = commentsArray.filter(comment => !comment.parentId);
  const replies = commentsArray.filter(comment => comment.parentId);

  // Group replies by parent comment
  const repliesMap = {};
  replies.forEach(reply => {
    if (!repliesMap[reply.parentId]) {
      repliesMap[reply.parentId] = [];
    }
    repliesMap[reply.parentId].push(reply);
  });

  // Pagination for parent comments only
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedParentComments = parentComments.slice(startIndex, endIndex);

  // Get author information and attach replies
  const commentsWithDetails = await Promise.all(
    paginatedParentComments.map(async (comment) => {
      const authorSnapshot = await dbRefs.users.child(comment.authorId).once('value');
      const author = authorSnapshot.val();

      // Get replies with author information
      const commentReplies = repliesMap[comment.id] || [];
      const repliesWithAuthors = await Promise.all(
        commentReplies.map(async (reply) => {
          const replyAuthorSnapshot = await dbRefs.users.child(reply.authorId).once('value');
          const replyAuthor = replyAuthorSnapshot.val();

          return {
            ...reply,
            author: replyAuthor ? {
              id: replyAuthor.id,
              username: replyAuthor.username,
              avatar: replyAuthor.avatar,
              level: replyAuthor.level
            } : null,
            userVote: currentUserId && reply.votedUsers ? reply.votedUsers[currentUserId] : null,
            canEdit: currentUserId === reply.authorId,
            canDelete: currentUserId === reply.authorId || req.user?.isAdmin
          };
        })
      );

      return {
        ...comment,
        author: author ? {
          id: author.id,
          username: author.username,
          avatar: author.avatar,
          level: author.level
        } : null,
        replies: repliesWithAuthors.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        userVote: currentUserId && comment.votedUsers ? comment.votedUsers[currentUserId] : null,
        canEdit: currentUserId === comment.authorId,
        canDelete: currentUserId === comment.authorId || req.user?.isAdmin
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      comments: commentsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(parentComments.length / limit),
        totalItems: parentComments.length,
        hasNext: endIndex < parentComments.length,
        hasPrev: page > 1
      },
      totalComments: commentsArray.length
    }
  });
});

// Get comment by ID
export const getCommentById = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { uid: currentUserId } = req.user || {};

  const commentSnapshot = await dbRefs.comments.child(commentId).once('value');
  const commentData = commentSnapshot.val();

  if (!commentData) {
    return next(new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND'));
  }

  // Get author information
  const authorSnapshot = await dbRefs.users.child(commentData.authorId).once('value');
  const author = authorSnapshot.val();

  // Get replies if this is a parent comment
  const repliesSnapshot = await dbRefs.comments.orderByChild('parentId').equalTo(commentId).once('value');
  const replies = repliesSnapshot.val() || {};
  const repliesArray = Object.entries(replies).map(([id, reply]) => ({
    id,
    ...reply
  }));

  // Get author information for replies
  const repliesWithAuthors = await Promise.all(
    repliesArray.map(async (reply) => {
      const replyAuthorSnapshot = await dbRefs.users.child(reply.authorId).once('value');
      const replyAuthor = replyAuthorSnapshot.val();

      return {
        ...reply,
        author: replyAuthor ? {
          id: replyAuthor.id,
          username: replyAuthor.username,
          avatar: replyAuthor.avatar,
          level: replyAuthor.level
        } : null,
        userVote: currentUserId && reply.votedUsers ? reply.votedUsers[currentUserId] : null
      };
    })
  );

  const commentWithDetails = {
    id: commentId,
    ...commentData,
    author: author ? {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    } : null,
    replies: repliesWithAuthors.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    userVote: currentUserId && commentData.votedUsers ? commentData.votedUsers[currentUserId] : null
  };

  res.status(200).json({
    success: true,
    data: {
      comment: commentWithDetails
    }
  });
});

// Update comment
export const updateComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { uid: currentUserId } = req.user;
  const { content } = req.body;

  const commentSnapshot = await dbRefs.comments.child(commentId).once('value');
  const commentData = commentSnapshot.val();

  if (!commentData) {
    return next(new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND'));
  }

  // Check if user is the author
  if (commentData.authorId !== currentUserId) {
    return next(new AppError('You can only update your own comments', 403, 'UNAUTHORIZED'));
  }

  // Update comment
  await dbRefs.comments.child(commentId).update({
    content,
    updatedAt: firebaseHelpers.getServerTimestamp(),
    isEdited: true
  });

  // Get updated comment with author information
  const updatedCommentSnapshot = await dbRefs.comments.child(commentId).once('value');
  const updatedComment = updatedCommentSnapshot.val();

  const authorSnapshot = await dbRefs.users.child(updatedComment.authorId).once('value');
  const author = authorSnapshot.val();

  const commentWithAuthor = {
    id: commentId,
    ...updatedComment,
    author: {
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      level: author.level
    }
  };

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: {
      comment: commentWithAuthor
    }
  });
});

// Delete comment
export const deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { uid: currentUserId } = req.user;

  const commentSnapshot = await dbRefs.comments.child(commentId).once('value');
  const commentData = commentSnapshot.val();

  if (!commentData) {
    return next(new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND'));
  }

  // Check if user is the author or admin
  if (commentData.authorId !== currentUserId && !req.user.isAdmin) {
    return next(new AppError('You can only delete your own comments', 403, 'UNAUTHORIZED'));
  }

  // Get all replies to this comment
  const repliesSnapshot = await dbRefs.comments.orderByChild('parentId').equalTo(commentId).once('value');
  const replies = repliesSnapshot.val() || {};

  // Create batch delete for comment and all its replies
  const batch = {};
  batch[`comments/${commentId}`] = null;

  Object.keys(replies).forEach(replyId => {
    batch[`comments/${replyId}`] = null;
  });

  // Execute batch delete
  await firebaseHelpers.createBatchUpdate(batch);

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// Vote on comment
export const voteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { uid: currentUserId } = req.user;
  const { type } = req.body; // 'upvote', 'downvote', or 'remove'

  const commentSnapshot = await dbRefs.comments.child(commentId).once('value');
  const commentData = commentSnapshot.val();

  if (!commentData) {
    return next(new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND'));
  }

  // Can't vote on own comment
  if (commentData.authorId === currentUserId) {
    return next(new AppError('You cannot vote on your own comment', 400, 'SELF_VOTE'));
  }

  const votedUsers = commentData.votedUsers || {};
  const currentVote = votedUsers[currentUserId];
  let votes = commentData.votes || 0;

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

  // Update comment
  await dbRefs.comments.child(commentId).update({
    votes,
    votedUsers
  });

  // Award/deduct XP to comment author based on vote
  if (type === 'upvote' && currentVote !== 'upvote') {
    const authorRef = dbRefs.users.child(commentData.authorId);
    await authorRef.transaction((user) => {
      if (user) {
        user.xp = (user.xp || 0) + 1; // Award XP for receiving upvote
      }
      return user;
    });
  } else if (type === 'downvote' && currentVote !== 'downvote') {
    const authorRef = dbRefs.users.child(commentData.authorId);
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

// Get user's comments
export const getUserComments = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

  // Check if user exists
  const userSnapshot = await dbRefs.users.child(userId).once('value');
  if (!userSnapshot.exists()) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Get user's comments
  const commentsSnapshot = await dbRefs.comments.orderByChild('authorId').equalTo(userId).once('value');
  const comments = commentsSnapshot.val() || {};
  let commentsArray = Object.entries(comments).map(([id, comment]) => ({
    id,
    ...comment
  }));

  // Sort comments
  commentsArray.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'most-voted':
        return (b.votes || 0) - (a.votes || 0);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedComments = commentsArray.slice(startIndex, endIndex);

  // Get issue information for each comment
  const commentsWithIssues = await Promise.all(
    paginatedComments.map(async (comment) => {
      const issueSnapshot = await dbRefs.issues.child(comment.issueId).once('value');
      const issue = issueSnapshot.val();

      return {
        ...comment,
        issue: issue ? {
          id: comment.issueId,
          title: issue.title,
          status: issue.status
        } : null
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      comments: commentsWithIssues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(commentsArray.length / limit),
        totalItems: commentsArray.length,
        hasNext: endIndex < commentsArray.length,
        hasPrev: page > 1
      }
    }
  });
});

// Get comment statistics
export const getCommentStats = catchAsync(async (req, res, next) => {
  const commentsSnapshot = await dbRefs.comments.once('value');
  const comments = commentsSnapshot.val() || {};
  const commentsArray = Object.values(comments);

  const stats = {
    total: commentsArray.length,
    totalVotes: commentsArray.reduce((sum, comment) => sum + Math.abs(comment.votes || 0), 0),
    averageVotes: commentsArray.length > 0 ?
      Math.round(commentsArray.reduce((sum, comment) => sum + (comment.votes || 0), 0) / commentsArray.length * 100) / 100 : 0,
    parentComments: commentsArray.filter(comment => !comment.parentId).length,
    replies: commentsArray.filter(comment => comment.parentId).length,
    editedComments: commentsArray.filter(comment => comment.isEdited).length
  };

  res.status(200).json({
    success: true,
    data: {
      stats
    }
  });
});

export default {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  voteComment,
  getUserComments,
  getCommentStats
};
