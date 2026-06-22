import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { aiRecommendationSchema } from '../utils/validationSchemas.js';
import { getAiRecommendation } from '../controllers/aiRecommendationController.js';

const router = express.Router();

router.post('/recommendation', protect, checkTenantStatus, validateRequest(aiRecommendationSchema), getAiRecommendation);

export default router;
