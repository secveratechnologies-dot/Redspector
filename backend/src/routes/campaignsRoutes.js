import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkTenantStatus } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createCampaignSchema, campaignActionSchema } from '../utils/validationSchemas.js';
import {
  getCampaigns,
  createCampaign,
  startCampaign,
  pauseCampaign,
  stopCampaign
} from '../controllers/campaignsController.js';

const router = express.Router();

router.get('/', protect, checkTenantStatus, getCampaigns);
router.post('/', protect, checkTenantStatus, validateRequest(createCampaignSchema), createCampaign);
router.post('/start', protect, checkTenantStatus, validateRequest(campaignActionSchema), startCampaign);
router.post('/pause', protect, checkTenantStatus, validateRequest(campaignActionSchema), pauseCampaign);
router.post('/stop', protect, checkTenantStatus, validateRequest(campaignActionSchema), stopCampaign);

export default router;
