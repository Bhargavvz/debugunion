import { auth } from '../config/firebase.js';
import jwt from 'jsonwebtoken';
import { dbRefs } from '../config/firebase.js';

// Verify Firebase ID Token
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing from authorization header'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Get user data from database
    const userSnapshot = await dbRefs.users.child(decodedToken.uid).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Attach user data to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userData
    };

    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Verify JWT Token (for custom tokens if needed)
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing from authorization header'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user data from database
    const userSnapshot = await dbRefs.users.child(decoded.uid).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = {
      uid: decoded.uid,
      ...userData
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Try Firebase token first
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userSnapshot = await dbRefs.users.child(decodedToken.uid).once('value');
      const userData = userSnapshot.val();

      if (userData) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          ...userData
        };
      } else {
        req.user = null;
      }
    } catch (firebaseError) {
      // If Firebase token fails, try JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userSnapshot = await dbRefs.users.child(decoded.uid).once('value');
        const userData = userSnapshot.val();

        if (userData) {
          req.user = {
            uid: decoded.uid,
            ...userData
          };
        } else {
          req.user = null;
        }
      } catch (jwtError) {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  next();
};

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUidField = 'authorId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUid = req.params[resourceUidField] || req.body[resourceUidField];

    if (req.user.uid === resourceUid || req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }
  };
};

// Rate limiting for authenticated users
export const authenticatedRateLimit = (req, res, next) => {
  if (req.user) {
    // Authenticated users get higher rate limits
    req.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200 // 200 requests per 15 minutes
    };
  } else {
    // Anonymous users get lower rate limits
    req.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50 // 50 requests per 15 minutes
    };
  }
  next();
};

export default {
  verifyFirebaseToken,
  verifyJWT,
  optionalAuth,
  requireAdmin,
  requireOwnershipOrAdmin,
  authenticatedRateLimit
};
