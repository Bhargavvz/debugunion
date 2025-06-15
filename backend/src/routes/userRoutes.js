import express from 'express';
import userController from '../controllers/userController.js';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = express.Router();

// Rate limiting for user endpoints
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Parameter validation schemas
const userIdSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required',
    'string.empty': 'User ID cannot be empty'
  })
});

const searchUsersSchema = Joi.object({
  q: Joi.string().max(100).optional(),
  skills: Joi.array().items(Joi.string().max(30)).max(5).optional(),
  sortBy: Joi.string().valid('newest', 'xp', 'issues-fixed', 'bounty-earned').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getUserIssuesSchema = Joi.object({
  status: Joi.string().valid('all', 'open', 'in-progress', 'solved', 'closed').default('all'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-bountied', 'most-active', 'most-upvoted').default('newest')
});

const getUserFixesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-voted', 'accepted').default('newest')
});

const getFollowersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

// Apply rate limiting to all routes
router.use(userRateLimit);

// Public routes (optional authentication)
router.get('/search',
  optionalAuth,
  validateQuery(searchUsersSchema),
  userController.searchUsers
);

router.get('/:userId',
  optionalAuth,
  validateParams(userIdSchema),
  userController.getUserProfile
);

router.get('/:userId/stats',
  optionalAuth,
  validateParams(userIdSchema),
  userController.getUserStats
);

router.get('/:userId/issues',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getUserIssuesSchema),
  userController.getUserIssues
);

router.get('/:userId/fixes',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getUserFixesSchema),
  userController.getUserFixes
);

router.get('/:userId/followers',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getFollowersSchema),
  userController.getUserFollowers
);

router.get('/:userId/following',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getFollowersSchema),
  userController.getUserFollowing
);

// Protected routes (authentication required)
router.use(verifyFirebaseToken);

router.post('/:userId/follow',
  validateParams(userIdSchema),
  userController.toggleFollowUser
);

export default router;
