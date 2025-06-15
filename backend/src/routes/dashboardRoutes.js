import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint without auth (for debugging)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Dashboard routes are working!' });
});

// Dashboard statistics
router.get('/stats', verifyFirebaseToken, dashboardController.getDashboardStats);

// Recent user activity
router.get('/recent-issues', verifyFirebaseToken, dashboardController.getRecentIssues);
router.get('/recent-fixes', verifyFirebaseToken, dashboardController.getRecentFixes);

// Trending content for dashboard
router.get('/trending-issues', verifyFirebaseToken, dashboardController.getTrendingIssuesForDashboard);

export default router;
