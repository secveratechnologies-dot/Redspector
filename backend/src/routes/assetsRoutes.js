import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createAssetSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { tenantId: req.user.tenantId }
    });
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, checkTenantStatus, validateRequest(createAssetSchema), async (req, res, next) => {
  try {
    const { id, name, type, owner, risk } = req.body;

    const asset = await prisma.asset.create({
      data: {
        id,
        name,
        type,
        owner,
        risk,
        tenantId: req.user.tenantId
      }
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
});

export default router;
