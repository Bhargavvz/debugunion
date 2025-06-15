import { dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';

// Get dashboard statistics
export const getDashboardStats = catchAsync(async (req, res, next) => {
  const { uid: currentUserId } = req.user;

  try {
    // Get user's own stats
    const userSnapshot = await dbRefs.users.child(currentUserId).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Get user's issues
    const userIssuesSnapshot = await dbRefs.issues.orderByChild('authorId').equalTo(currentUserId).once('value');
    const userIssues = userIssuesSnapshot.val() || {};
    const userIssuesArray = Object.values(userIssues);

    // Get user's fixes
    const userFixesSnapshot = await dbRefs.fixes.orderByChild('authorId').equalTo(currentUserId).once('value');
    const userFixes = userFixesSnapshot.val() || {};
    const userFixesArray = Object.values(userFixes);

    // Get user's comments
    const userCommentsSnapshot = await dbRefs.comments.orderByChild('authorId').equalTo(currentUserId).once('value');
    const userComments = userCommentsSnapshot.val() || {};
    const userCommentsArray = Object.values(userComments);

    // Calculate statistics
    const stats = {
      user: {
        xp: userData.xp || 0,
        level: userData.level || 1,
        issuesPosted: userIssuesArray.length,
        issuesFixed: userFixesArray.filter(fix => fix.isAccepted).length,
        bountyEarned: userData.bountyEarned || 0,
        badges: userData.badges || []
      },
      issues: {
        total: userIssuesArray.length,
        open: userIssuesArray.filter(issue => issue.status === 'open').length,
        inProgress: userIssuesArray.filter(issue => issue.status === 'in-progress').length,
        solved: userIssuesArray.filter(issue => issue.status === 'solved').length,
        totalViews: userIssuesArray.reduce((sum, issue) => sum + (issue.views || 0), 0),
        totalUpvotes: userIssuesArray.reduce((sum, issue) => sum + (issue.upvotes || 0), 0)
      },
      fixes: {
        total: userFixesArray.length,
        accepted: userFixesArray.filter(fix => fix.isAccepted).length,
        pending: userFixesArray.filter(fix => !fix.isAccepted).length,
        totalVotes: userFixesArray.reduce((sum, fix) => sum + (fix.votes || 0), 0)
      },
      comments: {
        total: userCommentsArray.length,
        totalVotes: userCommentsArray.reduce((sum, comment) => sum + (comment.votes || 0), 0)
      }
    };

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentIssues = userIssuesArray.filter(issue => 
      new Date(issue.createdAt) >= sevenDaysAgo
    );
    
    const recentFixes = userFixesArray.filter(fix => 
      new Date(fix.createdAt) >= sevenDaysAgo
    );
    
    const recentComments = userCommentsArray.filter(comment => 
      new Date(comment.createdAt) >= sevenDaysAgo
    );

    const recentActivity = {
      issues: recentIssues.length,
      fixes: recentFixes.length,
      comments: recentComments.length,
      xpGained: (recentIssues.length * 10) + (recentFixes.length * 15) + (recentComments.length * 2)
    };

    // Get leaderboard position
    const allUsersSnapshot = await dbRefs.users.once('value');
    const allUsers = allUsersSnapshot.val() || {};
    const usersArray = Object.values(allUsers).sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const userRank = usersArray.findIndex(user => user.id === currentUserId) + 1;

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentActivity,
        userRank,
        totalUsers: usersArray.length
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return next(new AppError('Failed to fetch dashboard stats', 500, 'DASHBOARD_ERROR'));
  }
});

// Get user's recent issues
export const getRecentIssues = catchAsync(async (req, res, next) => {
  const { uid: currentUserId } = req.user;
  const { limit = 5 } = req.query;

  const userIssuesSnapshot = await dbRefs.issues.orderByChild('authorId').equalTo(currentUserId).once('value');
  const userIssues = userIssuesSnapshot.val() || {};
  
  let issuesArray = Object.entries(userIssues).map(([id, issue]) => ({
    id,
    ...issue
  }));

  // Sort by creation date (newest first)
  issuesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Limit results
  issuesArray = issuesArray.slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      issues: issuesArray
    }
  });
});

// Get user's recent fixes
export const getRecentFixes = catchAsync(async (req, res, next) => {
  const { uid: currentUserId } = req.user;
  const { limit = 5 } = req.query;

  const userFixesSnapshot = await dbRefs.fixes.orderByChild('authorId').equalTo(currentUserId).once('value');
  const userFixes = userFixesSnapshot.val() || {};
  
  let fixesArray = Object.entries(userFixes).map(([id, fix]) => ({
    id,
    ...fix
  }));

  // Sort by creation date (newest first)
  fixesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Limit results
  fixesArray = fixesArray.slice(0, parseInt(limit));

  // Get issue details for each fix
  const fixesWithIssues = await Promise.all(
    fixesArray.map(async (fix) => {
      const issueSnapshot = await dbRefs.issues.child(fix.issueId).once('value');
      const issue = issueSnapshot.val();
      
      return {
        ...fix,
        issue: issue ? {
          id: fix.issueId,
          title: issue.title,
          category: issue.category
        } : null
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      fixes: fixesWithIssues
    }
  });
});

// Get trending issues (for dashboard)
export const getTrendingIssuesForDashboard = catchAsync(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const issuesSnapshot = await dbRefs.issues.once('value');
  const issues = issuesSnapshot.val() || {};
  let issuesArray = Object.entries(issues).map(([id, issue]) => ({
    id,
    ...issue
  }));

  // Filter open issues only
  issuesArray = issuesArray.filter(issue => issue.status === 'open');

  // Calculate trending score
  issuesArray = issuesArray.map(issue => ({
    ...issue,
    trendingScore: (issue.views || 0) + (issue.upvotes || 0) * 2 + (issue.comments?.length || 0) * 3
  }));

  // Sort by trending score
  issuesArray.sort((a, b) => b.trendingScore - a.trendingScore);

  // Limit results
  issuesArray = issuesArray.slice(0, parseInt(limit));

  // Get author information
  const issuesWithAuthors = await Promise.all(
    issuesArray.map(async (issue) => {
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

export default {
  getDashboardStats,
  getRecentIssues,
  getRecentFixes,
  getTrendingIssuesForDashboard
};
