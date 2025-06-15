import express from 'express';
import authController from '../controllers/authController.js';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import { validateUser } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (no authentication required)
router.post('/register',
  authRateLimit,
  validateUser.register,
  authController.register
);

router.post('/login',
  authRateLimit,
  validateUser.login,
  authController.login
);

router.post('/refresh-token',
  authController.refreshToken
);

router.post('/forgot-password',
  passwordResetRateLimit,
  authController.forgotPassword
);

router.post('/reset-password',
  passwordResetRateLimit,
  authController.resetPassword
);

router.post('/verify-email',
  authController.verifyEmail
);

// Protected routes (authentication required)
router.use(verifyFirebaseToken); // All routes below this middleware require authentication

router.post('/logout',
  authController.logout
);

router.get('/me',
  authController.getCurrentUser
);

router.patch('/profile',
  validateUser.updateProfile,
  authController.updateProfile
);

router.patch('/change-password',
  validateUser.changePassword,
  authController.changePassword
);

router.post('/send-verification-email',
  authController.sendEmailVerification
);

router.delete('/account',
  authController.deleteAccount
);

export default router;
