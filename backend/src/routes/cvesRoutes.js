import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getCves } from '../controllers/threatIntelController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getCves);

export default router;
