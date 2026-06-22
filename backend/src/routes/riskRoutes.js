import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { riskCalculateSchema } from '../utils/validationSchemas.js';
import { calculateRisk } from '../controllers/riskController.js';

const router = express.Router();

router.post('/calculate', protect, checkTenantStatus, validateRequest(riskCalculateSchema), calculateRisk);

export default router;
