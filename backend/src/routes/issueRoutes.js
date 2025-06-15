import express from 'express';
import issueController from '../controllers/issueController.js';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import { validateIssue, validateQuery, validateParams, validateVote } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = express.Router();

// Rate limiting for issue endpoints
const issueRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const createIssueRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 issue creations per hour
  message: {
    success: false,
    message: 'Too many issues created, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Parameter validation schemas
const issueIdSchema = Joi.object({
  issueId: Joi.string().required().messages({
    'any.required': 'Issue ID is required',
    'string.empty': 'Issue ID cannot be empty'
  })
});

const getIssuesSchema = Joi.object({
  category: Joi.string().valid('all', 'bug', 'feature', 'question', 'discussion').default('all'),
  status: Joi.string().valid('all', 'open', 'in-progress', 'solved', 'closed').default('all'),
  priority: Joi.string().valid('all', 'low', 'medium', 'high', 'urgent').default('all'),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-bountied', 'most-active', 'most-upvoted').default('newest'),
  tags: Joi.array().items(Joi.string().max(30)).max(5).optional(),
  minBounty: Joi.number().min(0).optional(),
  maxBounty: Joi.number().min(0).optional(),
  q: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getTrendingSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
  timeframe: Joi.string().valid('day', 'week', 'month').default('week')
});

// Apply rate limiting to all routes
router.use(issueRateLimit);

// Public routes (optional authentication)
router.get('/',
  optionalAuth,
  validateQuery(getIssuesSchema),
  issueController.getIssues
);

router.get('/trending',
  optionalAuth,
  validateQuery(getTrendingSchema),
  issueController.getTrendingIssues
);

router.get('/stats',
  optionalAuth,
  issueController.getIssueStats
);

router.get('/:issueId',
  optionalAuth,
  validateParams(issueIdSchema),
  issueController.getIssueById
);

// Protected routes (authentication required)
router.use(verifyFirebaseToken);

router.post('/',
  createIssueRateLimit,
  validateIssue.create,
  issueController.createIssue
);

router.patch('/:issueId',
  validateParams(issueIdSchema),
  validateIssue.update,
  issueController.updateIssue
);

router.delete('/:issueId',
  validateParams(issueIdSchema),
  issueController.deleteIssue
);

router.post('/:issueId/vote',
  validateParams(issueIdSchema),
  validateVote.vote,
  issueController.voteIssue
);

router.post('/:issueId/follow',
  validateParams(issueIdSchema),
  issueController.toggleFollowIssue
);

export default router;
