import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getArtifacts } from '../controllers/evidenceController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getArtifacts);

export default router;
