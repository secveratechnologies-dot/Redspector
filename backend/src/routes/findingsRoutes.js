import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, async (req, res, next) => {
  try {
    const findings = await prisma.finding.findMany({
      where: { tenantId: req.user.tenantId }
    });
    res.json({ success: true, data: findings });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, checkTenantStatus, async (req, res, next) => {
  try {
    const { id, title, severity, asset, status, owner, description, evidence, recommendations } = req.body;
    
    if (!id || !title || !severity || !asset || !status) {
      return res.status(400).json({ success: false, message: 'Missing required finding fields' });
    }

    const finding = await prisma.finding.create({
      data: {
        id,
        title,
        severity,
        asset,
        status,
        owner,
        description,
        evidence,
        recommendations,
        tenantId: req.user.tenantId
      }
    });

    res.status(201).json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
});

export default router;
