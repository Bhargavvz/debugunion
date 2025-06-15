import express from 'express';
import fixController from '../controllers/fixController.js';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import { validateFix, validateQuery, validateParams, validateVote } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = express.Router();

// Rate limiting for fix endpoints
const fixRateLimit = rateLimit({
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

const createFixRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 fix submissions per hour
  message: {
    success: false,
    message: 'Too many fixes submitted, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Parameter validation schemas
const fixIdSchema = Joi.object({
  fixId: Joi.string().required().messages({
    'any.required': 'Fix ID is required',
    'string.empty': 'Fix ID cannot be empty'
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

const getFixesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-voted', 'accepted').default('newest')
});

const getUserFixesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('newest', 'oldest', 'most-voted', 'accepted').default('newest')
});

// Apply rate limiting to all routes
router.use(fixRateLimit);

// Public routes (optional authentication)
router.get('/stats',
  optionalAuth,
  fixController.getFixStats
);

router.get('/:fixId',
  optionalAuth,
  validateParams(fixIdSchema),
  fixController.getFixById
);

router.get('/user/:userId',
  optionalAuth,
  validateParams(userIdSchema),
  validateQuery(getUserFixesSchema),
  fixController.getUserFixes
);

// Issue-specific fix routes
router.get('/issue/:issueId',
  optionalAuth,
  validateParams(issueIdSchema),
  validateQuery(getFixesSchema),
  fixController.getFixesForIssue
);

// Protected routes (authentication required)
router.use(verifyFirebaseToken);

router.post('/issue/:issueId',
  createFixRateLimit,
  validateParams(issueIdSchema),
  validateFix.create,
  fixController.createFix
);

router.patch('/:fixId',
  validateParams(fixIdSchema),
  validateFix.update,
  fixController.updateFix
);

router.delete('/:fixId',
  validateParams(fixIdSchema),
  fixController.deleteFix
);

router.post('/:fixId/accept',
  validateParams(fixIdSchema),
  validateFix.accept,
  fixController.acceptFix
);

router.post('/:fixId/vote',
  validateParams(fixIdSchema),
  validateVote.vote,
  fixController.voteFix
);

export default router;
