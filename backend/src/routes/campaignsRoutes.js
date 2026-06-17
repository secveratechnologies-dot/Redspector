import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createCampaignSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId: req.user.tenantId }
    });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, checkTenantStatus, validateRequest(createCampaignSchema), async (req, res, next) => {
  try {
    const { id, name, status, progress, findings } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        id,
        name,
        status,
        progress,
        findings,
        tenantId: req.user.tenantId
      }
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

export default router;
