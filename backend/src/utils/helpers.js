import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import moment from 'moment';

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate UUID v4
export const generateUUID = () => {
  return crypto.randomUUID();
};

// Hash string using SHA256
export const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Create JWT token
export const createJWT = (payload, secret = process.env.JWT_SECRET, expiresIn = '24h') => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token
export const verifyJWT = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
};

// Format date to ISO string
export const formatDate = (date) => {
  return moment(date).toISOString();
};

// Get time ago string
export const getTimeAgo = (date) => {
  return moment(date).fromNow();
};

// Calculate time difference in minutes
export const getTimeDifferenceInMinutes = (date1, date2) => {
  return moment(date1).diff(moment(date2), 'minutes');
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitize string for database
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Calculate user level based on XP
export const calculateUserLevel = (xp) => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  if (xp < 4000) return 6;
  if (xp < 8000) return 7;
  if (xp < 15000) return 8;
  if (xp < 25000) return 9;
  if (xp < 40000) return 10;

  // Level 11+ = 10 + floor((xp - 40000) / 10000)
  return 10 + Math.floor((xp - 40000) / 10000);
};

// Calculate XP needed for next level
export const getXPForNextLevel = (currentXP) => {
  const currentLevel = calculateUserLevel(currentXP);
  let xpForNextLevel;

  switch (currentLevel) {
    case 1: xpForNextLevel = 100; break;
    case 2: xpForNextLevel = 250; break;
    case 3: xpForNextLevel = 500; break;
    case 4: xpForNextLevel = 1000; break;
    case 5: xpForNextLevel = 2000; break;
    case 6: xpForNextLevel = 4000; break;
    case 7: xpForNextLevel = 8000; break;
    case 8: xpForNextLevel = 15000; break;
    case 9: xpForNextLevel = 25000; break;
    case 10: xpForNextLevel = 40000; break;
    default: xpForNextLevel = 40000 + ((currentLevel - 10) * 10000); break;
  }

  return xpForNextLevel - currentXP;
};

// Paginate array
export const paginateArray = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNext: endIndex < array.length,
      hasPrev: page > 1,
      limit
    }
  };
};

// Remove sensitive fields from user object
export const sanitizeUser = (user, isOwner = false) => {
  if (!user) return null;

  const sanitized = { ...user };

  // Always remove these sensitive fields
  delete sanitized.emailVerified;
  delete sanitized.passwordHash;
  delete sanitized.refreshTokens;
  delete sanitized.resetPasswordToken;

  // Remove these fields if not the owner
  if (!isOwner) {
    delete sanitized.email;
    delete sanitized.preferences;
    delete sanitized.notifications;

    // Only show email if user has made it public
    if (user.preferences?.showEmail) {
      sanitized.email = user.email;
    }
  }

  return sanitized;
};

// Extract file extension from filename
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Check if file type is allowed
export const isAllowedFileType = (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'md']) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// Format file size to human readable
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate slug from title
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Truncate text
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Calculate reading time (words per minute)
export const calculateReadingTime = (text, wordsPerMinute = 200) => {
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Convert camelCase to snake_case
export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase
export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

// Sleep/delay function
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Sort array of objects by multiple criteria
export const multiSort = (array, sortCriteria) => {
  return array.sort((a, b) => {
    for (const { key, direction = 'asc' } of sortCriteria) {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Group array by key
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Get unique values from array
export const getUniqueValues = (array, key = null) => {
  if (key) {
    return [...new Set(array.map(item => item[key]))];
  }
  return [...new Set(array)];
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Format number with commas
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Convert string to boolean
export const stringToBoolean = (str) => {
  if (typeof str === 'boolean') return str;
  if (typeof str === 'string') {
    return str.toLowerCase() === 'true';
  }
  return Boolean(str);
};

// Validate required fields
export const validateRequiredFields = (obj, requiredFields) => {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined || obj[field] === '') {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Clean undefined/null values from object
export const cleanObject = (obj) => {
  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
};

export default {
  generateRandomString,
  generateUUID,
  hashString,
  createJWT,
  verifyJWT,
  formatDate,
  getTimeAgo,
  getTimeDifferenceInMinutes,
  isValidEmail,
  isValidURL,
  sanitizeString,
  calculateUserLevel,
  getXPForNextLevel,
  paginateArray,
  sanitizeUser,
  getFileExtension,
  isAllowedFileType,
  formatFileSize,
  generateSlug,
  truncateText,
  calculateReadingTime,
  deepClone,
  isEmpty,
  capitalize,
  camelToSnake,
  snakeToCamel,
  sleep,
  retryWithBackoff,
  debounce,
  throttle,
  multiSort,
  groupBy,
  getUniqueValues,
  calculatePercentage,
  formatNumber,
  stringToBoolean,
  validateRequiredFields,
  cleanObject
};
