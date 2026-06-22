import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createFindingSchema } from '../utils/validationSchemas.js';
import {
  createFinding,
  getFindings,
  getFindingById,
  updateFinding,
  deleteFinding,
  getPrioritizedFindings
} from '../controllers/findingsController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getFindings);
router.post('/', protect, checkTenantStatus, validateRequest(createFindingSchema), createFinding);
router.get('/prioritized', protect, checkTenantStatus, getPrioritizedFindings);
router.get('/:id', protect, checkTenantStatus, getFindingById);
router.put('/:id', protect, checkTenantStatus, updateFinding);
router.delete('/:id', protect, checkTenantStatus, deleteFinding);

export default router;

