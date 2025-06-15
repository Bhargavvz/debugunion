import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(verifyFirebaseToken);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Recent user activity
router.get('/recent-issues', dashboardController.getRecentIssues);
router.get('/recent-fixes', dashboardController.getRecentFixes);

// Trending content for dashboard
router.get('/trending-issues', dashboardController.getTrendingIssuesForDashboard);

export default router;
