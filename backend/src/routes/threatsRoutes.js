import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getAssetThreatIntel } from '../controllers/threatIntelController.js';

const router = express.Router();

router.get('/assets/:id', protect, checkTenantStatus, getAssetThreatIntel);

export default router;
