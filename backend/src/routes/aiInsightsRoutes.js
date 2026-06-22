import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { aiInsightsSchema } from '../utils/validationSchemas.js';
import { getAiInsights } from '../controllers/aiInsightsController.js';

const router = express.Router();

// Example endpoint for AI recommendations
router.post('/recommendation', protect, checkTenantStatus, validateRequest(aiInsightsSchema), getAiInsights);

export default router;
