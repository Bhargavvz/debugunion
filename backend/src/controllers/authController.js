import { auth, dbRefs, firebaseHelpers } from '../config/firebase.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Register new user
export const register = catchAsync(async (req, res, next) => {
  const { email, password, username, firstName, lastName } = req.body;

  // Check if username is already taken
  const usernameQuery = await dbRefs.users.orderByChild('username').equalTo(username).once('value');
  if (usernameQuery.exists()) {
    return next(new AppError('Username is already taken', 409, 'USERNAME_EXISTS'));
  }

  // Create Firebase user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${firstName || ''} ${lastName || ''}`.trim() || username,
  });

  // Create user profile in database
  const userData = {
    id: userRecord.uid,
    username,
    email: userRecord.email,
    firstName: firstName || '',
    lastName: lastName || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    location: '',
    company: '',
    xp: 0,
    level: 1,
    issuesPosted: 0,
    issuesFixed: 0,
    bountyEarned: 0,
    badges: [],
    joinedAt: firebaseHelpers.getServerTimestamp(),
    lastActive: firebaseHelpers.getServerTimestamp(),
    isOnline: true,
    skills: [],
    preferences: {
      theme: 'system',
      emailNotifications: true,
      pushNotifications: true,
      publicProfile: true,
      showEmail: false,
      language: 'en'
    },
    isAdmin: false,
    isVerified: false
  };

  await dbRefs.users.child(userRecord.uid).set(userData);

  // Generate custom token for immediate login
  const customToken = await auth.createCustomToken(userRecord.uid);

  // Create JWT token
  const jwtToken = jwt.sign(
    { uid: userRecord.uid, email: userRecord.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        username,
        displayName: userRecord.displayName,
        ...userData
      },
      tokens: {
        customToken,
        jwtToken
      }
    }
  });
});

// Login user
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);

    // Get user data from database
    const userSnapshot = await dbRefs.users.child(userRecord.uid).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      return next(new AppError('User profile not found', 404, 'USER_NOT_FOUND'));
    }

    // Create custom token for Firebase client SDK
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Create JWT token
    const jwtToken = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Update last active
    await dbRefs.users.child(userRecord.uid).update({
      lastActive: firebaseHelpers.getServerTimestamp(),
      isOnline: true
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          ...userData
        },
        tokens: {
          customToken,
          jwtToken
        }
      }
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }
    throw error;
  }
});

// Logout user
export const logout = catchAsync(async (req, res, next) => {
  const { uid } = req.user;

  // Update user online status
  await dbRefs.users.child(uid).update({
    isOnline: false,
    lastActive: firebaseHelpers.getServerTimestamp()
  });

  // Revoke refresh tokens (optional, for enhanced security)
  await auth.revokeRefreshTokens(uid);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
  }

  try {
    // Verify the refresh token with Firebase
    const decodedToken = await auth.verifyIdToken(refreshToken);

    // Create new custom token
    const customToken = await auth.createCustomToken(decodedToken.uid);

    // Create new JWT token
    const jwtToken = jwt.sign(
      { uid: decodedToken.uid, email: decodedToken.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          customToken,
          jwtToken
        }
      }
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
});

// Get current user
export const getCurrentUser = catchAsync(async (req, res, next) => {
  const { uid } = req.user;

  const userSnapshot = await dbRefs.users.child(uid).once('value');
  const userData = userSnapshot.val();

  if (!userData) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    data: {
      user: userData
    }
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res, next) => {
  const { uid } = req.user;
  const updates = req.body;

  // Remove sensitive fields that shouldn't be updated directly
  delete updates.id;
  delete updates.email;
  delete updates.xp;
  delete updates.level;
  delete updates.issuesPosted;
  delete updates.issuesFixed;
  delete updates.bountyEarned;
  delete updates.badges;
  delete updates.joinedAt;
  delete updates.isAdmin;
  delete updates.isVerified;

  // Check if username is being updated and is unique
  if (updates.username) {
    const usernameQuery = await dbRefs.users.orderByChild('username').equalTo(updates.username).once('value');
    const existingUsers = usernameQuery.val();

    if (existingUsers && Object.keys(existingUsers).some(key => key !== uid)) {
      return next(new AppError('Username is already taken', 409, 'USERNAME_EXISTS'));
    }
  }

  // Update user profile
  await dbRefs.users.child(uid).update({
    ...updates,
    updatedAt: firebaseHelpers.getServerTimestamp()
  });

  // Get updated user data
  const userSnapshot = await dbRefs.users.child(uid).once('value');
  const userData = userSnapshot.val();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: userData
    }
  });
});

// Change password
export const changePassword = catchAsync(async (req, res, next) => {
  const { uid } = req.user;
  const { currentPassword, newPassword } = req.body;

  try {
    // Update password in Firebase Auth
    await auth.updateUser(uid, {
      password: newPassword
    });

    // Revoke all refresh tokens to force re-login
    await auth.revokeRefreshTokens(uid);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error.code === 'auth/weak-password') {
      return next(new AppError('Password is too weak', 400, 'WEAK_PASSWORD'));
    }
    throw error;
  }
});

// Forgot password
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  try {
    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // In a real app, you would send this via email
    // For demo purposes, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
      // In production, don't return the link
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return next(new AppError('No user found with this email address', 404, 'USER_NOT_FOUND'));
    }
    throw error;
  }
});

// Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  const { oobCode, newPassword } = req.body;

  try {
    // Verify the password reset code
    const email = await auth.verifyPasswordResetCode(oobCode);

    // Apply the new password
    await auth.confirmPasswordReset(oobCode, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    if (error.code === 'auth/invalid-action-code') {
      return next(new AppError('Invalid or expired reset code', 400, 'INVALID_RESET_CODE'));
    }
    if (error.code === 'auth/weak-password') {
      return next(new AppError('Password is too weak', 400, 'WEAK_PASSWORD'));
    }
    throw error;
  }
});

// Verify email
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { oobCode } = req.body;

  try {
    // Apply the email verification
    await auth.applyActionCode(oobCode);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error.code === 'auth/invalid-action-code') {
      return next(new AppError('Invalid or expired verification code', 400, 'INVALID_VERIFICATION_CODE'));
    }
    throw error;
  }
});

// Send email verification
export const sendEmailVerification = catchAsync(async (req, res, next) => {
  const { uid, email } = req.user;

  try {
    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // In a real app, you would send this via email
    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      // In production, don't return the link
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
    });
  } catch (error) {
    throw error;
  }
});

// Delete account
export const deleteAccount = catchAsync(async (req, res, next) => {
  const { uid } = req.user;
  const { password } = req.body;

  try {
    // Delete user from Firebase Auth
    await auth.deleteUser(uid);

    // Delete user data from database
    await dbRefs.users.child(uid).remove();

    // TODO: Clean up user's associated data (issues, comments, etc.)
    // This should be done in a background job or cloud function

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    throw error;
  }
});

export default {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendEmailVerification,
  deleteAccount
};
