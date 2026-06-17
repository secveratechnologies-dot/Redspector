import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected admin endpoint requiring Super Admin or Tenant Admin roles
router.get('/config', protect, authorize('Super Admin', 'Tenant Admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Access granted: Admin configurations retrieved.',
    data: {
      tenantId: 'T-100',
      allowedIntegrations: ['jira', 'slack', 'pagerduty'],
      enforceMfa: true
    }
  });
});

export default router;
