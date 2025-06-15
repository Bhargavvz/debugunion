import Joi from 'joi';

// Helper function to validate request data
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    next();
  };
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    bio: Joi.string().max(500).optional(),
    githubUrl: Joi.string().uri().optional().allow(''),
    linkedinUrl: Joi.string().uri().optional().allow(''),
    websiteUrl: Joi.string().uri().optional().allow(''),
    location: Joi.string().max(100).optional().allow(''),
    company: Joi.string().max(100).optional().allow(''),
    skills: Joi.array().items(Joi.string().max(30)).max(20).optional(),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'system').optional(),
      emailNotifications: Joi.boolean().optional(),
      pushNotifications: Joi.boolean().optional(),
      publicProfile: Joi.boolean().optional(),
      showEmail: Joi.boolean().optional(),
      language: Joi.string().max(10).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
  })
};

// Issue validation schemas
export const issueSchemas = {
  create: Joi.object({
    title: Joi.string().min(10).max(200).required().messages({
      'string.min': 'Title must be at least 10 characters long',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required'
    }),
    description: Joi.string().min(20).max(5000).required().messages({
      'string.min': 'Description must be at least 20 characters long',
      'string.max': 'Description must not exceed 5000 characters',
      'any.required': 'Description is required'
    }),
    category: Joi.string().valid('bug', 'feature', 'question', 'discussion').required().messages({
      'any.only': 'Category must be one of: bug, feature, question, discussion',
      'any.required': 'Category is required'
    }),
    stack: Joi.array().items(Joi.string().max(30)).min(1).max(10).required().messages({
      'array.min': 'At least one technology stack is required',
      'array.max': 'Maximum 10 technology stacks allowed',
      'any.required': 'Technology stack is required'
    }),
    tags: Joi.array().items(Joi.string().max(30)).min(1).max(10).required().messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Maximum 10 tags allowed',
      'any.required': 'Tags are required'
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    bounty: Joi.number().min(0).max(10000).default(0).messages({
      'number.min': 'Bounty cannot be negative',
      'number.max': 'Bounty cannot exceed $10,000'
    }),
    githubRepo: Joi.string().uri().optional().allow('')
  }),

  update: Joi.object({
    title: Joi.string().min(10).max(200).optional(),
    description: Joi.string().min(20).max(5000).optional(),
    category: Joi.string().valid('bug', 'feature', 'question', 'discussion').optional(),
    stack: Joi.array().items(Joi.string().max(30)).min(1).max(10).optional(),
    tags: Joi.array().items(Joi.string().max(30)).min(1).max(10).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    bounty: Joi.number().min(0).max(10000).optional(),
    githubRepo: Joi.string().uri().optional().allow(''),
    status: Joi.string().valid('open', 'in-progress', 'solved', 'closed').optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('open', 'in-progress', 'solved', 'closed').required().messages({
      'any.only': 'Status must be one of: open, in-progress, solved, closed',
      'any.required': 'Status is required'
    })
  })
};

// Comment validation schemas
export const commentSchemas = {
  create: Joi.object({
    content: Joi.string().min(5).max(2000).required().messages({
      'string.min': 'Comment must be at least 5 characters long',
      'string.max': 'Comment must not exceed 2000 characters',
      'any.required': 'Comment content is required'
    }),
    parentId: Joi.string().optional() // For replies
  }),

  update: Joi.object({
    content: Joi.string().min(5).max(2000).required().messages({
      'string.min': 'Comment must be at least 5 characters long',
      'string.max': 'Comment must not exceed 2000 characters',
      'any.required': 'Comment content is required'
    })
  })
};

// Fix validation schemas
export const fixSchemas = {
  create: Joi.object({
    description: Joi.string().min(20).max(3000).required().messages({
      'string.min': 'Fix description must be at least 20 characters long',
      'string.max': 'Fix description must not exceed 3000 characters',
      'any.required': 'Fix description is required'
    }),
    codeSnippet: Joi.string().max(10000).optional().allow(''),
    githubPr: Joi.string().uri().optional().allow('')
  }),

  update: Joi.object({
    description: Joi.string().min(20).max(3000).optional(),
    codeSnippet: Joi.string().max(10000).optional().allow(''),
    githubPr: Joi.string().uri().optional().allow('')
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  accept: Joi.object({
    bountyAwarded: Joi.number().min(0).optional().messages({
      'number.min': 'Bounty amount cannot be negative'
    })
  })
};

// Message validation schemas
export const messageSchemas = {
  create: Joi.object({
    recipientId: Joi.string().required().messages({
      'any.required': 'Recipient ID is required'
    }),
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 1000 characters',
      'any.required': 'Message content is required'
    }),
    issueId: Joi.string().optional(), // For issue-related messages
    type: Joi.string().valid('direct', 'issue', 'system').default('direct')
  })
};

// Search and filter validation schemas
export const searchSchemas = {
  issues: Joi.object({
    q: Joi.string().max(100).optional(), // Search query
    category: Joi.string().valid('all', 'bug', 'feature', 'question', 'discussion').default('all'),
    status: Joi.string().valid('all', 'open', 'in-progress', 'solved', 'closed').default('all'),
    priority: Joi.string().valid('all', 'low', 'medium', 'high', 'urgent').default('all'),
    sortBy: Joi.string().valid('newest', 'oldest', 'most-bountied', 'most-active', 'most-upvoted').default('newest'),
    tags: Joi.array().items(Joi.string().max(30)).max(5).optional(),
    minBounty: Joi.number().min(0).optional(),
    maxBounty: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  }),

  users: Joi.object({
    q: Joi.string().max(100).optional(),
    skills: Joi.array().items(Joi.string().max(30)).max(5).optional(),
    sortBy: Joi.string().valid('newest', 'xp', 'issues-fixed', 'bounty-earned').default('newest'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  })
};

// Voting validation schemas
export const voteSchemas = {
  vote: Joi.object({
    type: Joi.string().valid('upvote', 'downvote', 'remove').required().messages({
      'any.only': 'Vote type must be one of: upvote, downvote, remove',
      'any.required': 'Vote type is required'
    })
  })
};

// Notification validation schemas
export const notificationSchemas = {
  markAsRead: Joi.object({
    notificationIds: Joi.array().items(Joi.string()).min(1).required().messages({
      'array.min': 'At least one notification ID is required',
      'any.required': 'Notification IDs are required'
    })
  })
};

// File upload validation
export const fileSchemas = {
  upload: Joi.object({
    type: Joi.string().valid('issue', 'fix', 'profile').required().messages({
      'any.only': 'File type must be one of: issue, fix, profile',
      'any.required': 'File type is required'
    })
  })
};

// Export validation middleware functions
export const validateUser = {
  register: validate(userSchemas.register),
  login: validate(userSchemas.login),
  updateProfile: validate(userSchemas.updateProfile),
  changePassword: validate(userSchemas.changePassword)
};

export const validateIssue = {
  create: validate(issueSchemas.create),
  update: validate(issueSchemas.update),
  updateStatus: validate(issueSchemas.updateStatus)
};

export const validateComment = {
  create: validate(commentSchemas.create),
  update: validate(commentSchemas.update)
};

export const validateFix = {
  create: validate(fixSchemas.create),
  update: validate(fixSchemas.update),
  accept: validate(fixSchemas.accept)
};

export const validateMessage = {
  create: validate(messageSchemas.create)
};

export const validateSearch = {
  issues: validate(searchSchemas.issues),
  users: validate(searchSchemas.users)
};

export const validateVote = {
  vote: validate(voteSchemas.vote)
};

export const validateNotification = {
  markAsRead: validate(notificationSchemas.markAsRead)
};

export const validateFile = {
  upload: validate(fileSchemas.upload)
};

// Query parameter validation
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: errorDetails
      });
    }

    req.query = value; // Use validated and default values
    next();
  };
};

// Parameter validation
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: errorDetails
      });
    }

    next();
  };
};

export default {
  validate,
  validateQuery,
  validateParams,
  validateUser,
  validateIssue,
  validateComment,
  validateFix,
  validateMessage,
  validateSearch,
  validateVote,
  validateNotification,
  validateFile
};
