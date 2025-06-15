import express from 'express';
import commentController from '../controllers/commentController.js';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import { validateComment, validateQuery, validateParams, validateVote } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = express.Router();

// Rate limiting for comment endpoints
const commentRateLimit = rateLimit({
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

const createCommentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 comment creations per 5 minutes
  message: {
    success: false,
    message: 'Too many comments created, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Parameter validation schemas
const commentIdSchema = Joi.object({
  commentId: Joi.string().required().messages({
    'any.required': 'Comment ID is required',
    'string.empty': 'Comment ID cannot be empty'
  })
});

const issueIdSchema = Joi.object({
  issueId: Joi.string().required().messages({
    'any.required': 'Issue ID is required',
    'string.empty': 'Issue ID cannot be empty'
  })
});

const userIdSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required',
    'string.empty': 'User ID cannot be empty'
  })
});

const getCommentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('oldest', 'newest', 'most-voted').default('oldest')
});

const getUserCommentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-voted').default('newest')
});

// Apply rate limiting to all routes
router.use(commentRateLimit);

// Public routes (optional authentication)
router.get('/stats',
  optionalAuth,
  commentController.getCommentStats
);

router.get('/:commentId',
  optionalAuth,
  validateParams(commentIdSchema),
  commentController.getCommentById
);

router.get('/user/:userId',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getUserCommentsSchema),
  commentController.getUserComments
);

// Issue-specific comment routes
router.get('/issue/:issueId',
  optionalAuth,
  validateParams(issueIdSchema),
  validateQuery(getCommentsSchema),
  commentController.getComments
);

// Protected routes (authentication required)
router.use(verifyFirebaseToken);

router.post('/issue/:issueId',
  createCommentRateLimit,
  validateParams(issueIdSchema),
  validateComment.create,
  commentController.createComment
);

router.patch('/:commentId',
  validateParams(commentIdSchema),
  validateComment.update,
  commentController.updateComment
);

router.delete('/:commentId',
  validateParams(commentIdSchema),
  commentController.deleteComment
);

router.post('/:commentId/vote',
  validateParams(commentIdSchema),
  validateVote.vote,
  commentController.voteComment
);

export default router;
