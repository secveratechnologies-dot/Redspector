import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { getKev } from '../controllers/threatIntelController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getKev);

export default router;
