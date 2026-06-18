import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { ragContextSchema, ragSearchSchema } from '../utils/validationSchemas.js';
import { storeContext, searchContext } from '../controllers/ragController.js';

const router = express.Router();

router.post('/context', protect, checkTenantStatus, validateRequest(ragContextSchema), storeContext);
router.post('/search', protect, checkTenantStatus, validateRequest(ragSearchSchema), searchContext);

export default router;
