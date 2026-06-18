import express from 'express';
import authRoutes from './authRoutes.js';
import campaignsRoutes from './campaignsRoutes.js';
import findingsRoutes from './findingsRoutes.js';
import assetsRoutes from './assetsRoutes.js';
import adminRoutes from './adminRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import cvesRoutes from './cvesRoutes.js';
import kevRoutes from './kevRoutes.js';
import threatsRoutes from './threatsRoutes.js';
import evidenceRoutes from './evidenceRoutes.js';
import artifactsRoutes from './artifactsRoutes.js';
import auditRoutes from './auditRoutes.js';
import plannerRoutes from './plannerRoutes.js';
import ragRoutes from './ragRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/findings', findingsRoutes);
router.use('/assets', assetsRoutes);
router.use('/admin', adminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/reports', reportsRoutes);
router.use('/cves', cvesRoutes);
router.use('/kev', kevRoutes);
router.use('/threats', threatsRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/artifacts', artifactsRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/planner', plannerRoutes);
router.use('/rag', ragRoutes);

export default router;
