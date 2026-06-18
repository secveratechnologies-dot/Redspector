import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getAuditLogs);

export default router;
