import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { plannerGenerateSchema, plannerValidateSchema } from '../utils/validationSchemas.js';
import { generatePlan, validatePlan } from '../controllers/plannerController.js';

const router = express.Router();

router.post('/generate', protect, checkTenantStatus, validateRequest(plannerGenerateSchema), generatePlan);
router.post('/validate', protect, checkTenantStatus, validateRequest(plannerValidateSchema), validatePlan);

export default router;
