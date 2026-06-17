import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createAssetSchema } from '../utils/validationSchemas.js';
import { createAsset, getAssets, getAssetById } from '../controllers/assetsController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getAssets);
router.post('/', protect, checkTenantStatus, validateRequest(createAssetSchema), createAsset);
router.get('/:id', protect, checkTenantStatus, getAssetById);

export default router;
