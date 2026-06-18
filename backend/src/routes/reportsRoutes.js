import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { jiraIntegrationSchema } from '../utils/validationSchemas.js';
import {
  getRiskSummary,
  generateReport,
  createJiraTicket
} from '../controllers/reportsController.js';

const router = express.Router();

router.get('/risk', protect, checkTenantStatus, getRiskSummary);
router.get('/generate', protect, checkTenantStatus, generateReport);
router.post('/integrations/jira', protect, checkTenantStatus, validateRequest(jiraIntegrationSchema), createJiraTicket);

// Retain baseline endpoint for backwards compatibility checks
router.get('/', protect, checkTenantStatus, (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Reports GET endpoint reached and isolation verified.'
  });
});

export default router;
