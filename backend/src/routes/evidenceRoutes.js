import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getEvidence } from '../controllers/evidenceController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getEvidence);

export default router;
