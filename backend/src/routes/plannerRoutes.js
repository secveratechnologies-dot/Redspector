import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { 
  plannerGenerateSchema, 
  plannerValidateSchema,
  plannerRiskAnalysisSchema,
  plannerRecommendationsSchema
} from '../utils/validationSchemas.js';
import { 
  generatePlan, 
  validatePlan,
  riskAnalysis,
  recommendations,
  getWorkflowRun
} from '../controllers/plannerController.js';

const router = express.Router();

router.post('/generate', protect, checkTenantStatus, validateRequest(plannerGenerateSchema), generatePlan);
router.post('/validate', protect, checkTenantStatus, validateRequest(plannerValidateSchema), validatePlan);
router.post('/risk-analysis', protect, checkTenantStatus, validateRequest(plannerRiskAnalysisSchema), riskAnalysis);
router.post('/recommendations', protect, checkTenantStatus, validateRequest(plannerRecommendationsSchema), recommendations);
router.get('/runs/:runId', protect, checkTenantStatus, getWorkflowRun);

export default router;

