import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createTenant,
  updateTenant,
  changeTenantStatus
} from '../controllers/tenantController.js';

const router = express.Router();

router.post('/', protect, authorize('Super Admin'), createTenant);
router.put('/:id', protect, authorize('Super Admin'), updateTenant);
router.put('/:id/status', protect, authorize('Super Admin'), changeTenantStatus);

export default router;
