import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getAiInsights } from '../controllers/aiInsightsController.js';
import { getAiRecommendation } from '../controllers/aiRecommendationController.js';

const router = express.Router();

/**
 * POST /api/ai/recommendation
 * Legacy AI recommendation endpoint (finding-centric).
 */
router.post('/recommendation', protect, checkTenantStatus, getAiRecommendation);

/**
 * POST /api/ai/insights
 * Full AI insights dispatcher: recommendation, attackPath, threatAnalysis, riskExplanation, executiveInsights.
 */
router.post('/insights', protect, checkTenantStatus, getAiInsights);

export default router;
