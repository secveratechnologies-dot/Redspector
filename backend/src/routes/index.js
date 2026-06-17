import express from 'express';
import authRoutes from './authRoutes.js';
import campaignsRoutes from './campaignsRoutes.js';
import findingsRoutes from './findingsRoutes.js';
import assetsRoutes from './assetsRoutes.js';
import adminRoutes from './adminRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import reportsRoutes from './reportsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/findings', findingsRoutes);
router.use('/assets', assetsRoutes);
router.use('/admin', adminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/reports', reportsRoutes);

export default router;
