import dotenv from 'dotenv';

dotenv.config();

// Custom error class for application errors
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Firebase error handler
const handleFirebaseError = (error) => {
  let message = 'Firebase operation failed';
  let statusCode = 500;
  let errorCode = 'FIREBASE_ERROR';

  switch (error.code) {
    case 'auth/email-already-exists':
      message = 'Email address is already in use';
      statusCode = 409;
      errorCode = 'EMAIL_EXISTS';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address';
      statusCode = 400;
      errorCode = 'INVALID_EMAIL';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak';
      statusCode = 400;
      errorCode = 'WEAK_PASSWORD';
      break;
    case 'auth/user-not-found':
      message = 'User not found';
      statusCode = 404;
      errorCode = 'USER_NOT_FOUND';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password';
      statusCode = 401;
      errorCode = 'INVALID_CREDENTIALS';
      break;
    case 'auth/too-many-requests':
      message = 'Too many requests. Please try again later';
      statusCode = 429;
      errorCode = 'TOO_MANY_REQUESTS';
      break;
    case 'auth/id-token-expired':
      message = 'Authentication token has expired';
      statusCode = 401;
      errorCode = 'TOKEN_EXPIRED';
      break;
    case 'auth/id-token-revoked':
      message = 'Authentication token has been revoked';
      statusCode = 401;
      errorCode = 'TOKEN_REVOKED';
      break;
    case 'auth/invalid-id-token':
      message = 'Invalid authentication token';
      statusCode = 401;
      errorCode = 'INVALID_TOKEN';
      break;
    case 'permission-denied':
      message = 'Permission denied';
      statusCode = 403;
      errorCode = 'PERMISSION_DENIED';
      break;
    case 'unavailable':
      message = 'Service temporarily unavailable';
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      break;
    case 'network-request-failed':
      message = 'Network request failed';
      statusCode = 502;
      errorCode = 'NETWORK_ERROR';
      break;
    default:
      message = error.message || 'Firebase operation failed';
      statusCode = 500;
      errorCode = 'FIREBASE_ERROR';
  }

  return new AppError(message, statusCode, errorCode);
};

// Validation error handler
const handleValidationError = (error) => {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));

  return new AppError('Validation failed', 400, 'VALIDATION_ERROR');
};

// JWT error handler
const handleJWTError = (error) => {
  let message = 'Authentication failed';
  let statusCode = 401;
  let errorCode = 'AUTH_ERROR';

  switch (error.name) {
    case 'TokenExpiredError':
      message = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
      break;
    case 'JsonWebTokenError':
      message = 'Invalid token';
      errorCode = 'INVALID_TOKEN';
      break;
    case 'NotBeforeError':
      message = 'Token not active';
      errorCode = 'TOKEN_NOT_ACTIVE';
      break;
    default:
      message = 'Authentication failed';
      errorCode = 'AUTH_ERROR';
  }

  return new AppError(message, statusCode, errorCode);
};

// Database error handler
const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;
  let errorCode = 'DATABASE_ERROR';

  // Handle specific database errors
  if (error.message.includes('permission denied')) {
    message = 'Permission denied';
    statusCode = 403;
    errorCode = 'PERMISSION_DENIED';
  } else if (error.message.includes('not found')) {
    message = 'Resource not found';
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (error.message.includes('already exists')) {
    message = 'Resource already exists';
    statusCode = 409;
    errorCode = 'ALREADY_EXISTS';
  }

  return new AppError(message, statusCode, errorCode);
};

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      code: err.errorCode,
      stack: err.stack,
      name: err.name
    }
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.errorCode
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Log error
const logError = (error, req) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.uid || 'anonymous'
  });
};

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logError(error, req);

  // Handle specific error types
  if (err.code && err.code.startsWith('auth/')) {
    error = handleFirebaseError(err);
  } else if (err.name === 'ValidationError' || err.isJoi) {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    error = handleJWTError(err);
  } else if (err.message && err.message.includes('Firebase')) {
    error = handleDatabaseError(err);
  } else if (!err.isOperational) {
    // Convert non-operational errors to operational errors
    error = new AppError(err.message || 'Something went wrong', err.statusCode || 500, 'INTERNAL_ERROR');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Promise:', promise);

  // Close server gracefully
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Shutting down gracefully...');

  process.exit(1);
});

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(err);
};

// Rate limit error handler
export const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  });
};

export default {
  AppError,
  errorHandler,
  catchAsync,
  notFoundHandler,
  rateLimitHandler
};
