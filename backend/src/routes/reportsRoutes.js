import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Reports GET endpoint reached and isolation verified.'
  });
});

export default router;
