import prisma from '../config/db.js';

const VALID_STATES = ['Draft', 'Pending', 'Approved', 'Running', 'Paused', 'Completed', 'Failed'];

export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId: req.user.tenantId }
    });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const { id, name, status, progress, findings } = req.body;
    const tenantId = req.user.tenantId;

    if (status && !VALID_STATES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid campaign status. Allowed values: ${VALID_STATES.join(', ')}`
      });
    }

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (existingCampaign) {
      return res.status(400).json({
        success: false,
        message: 'Campaign with this ID already exists'
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        id,
        name,
        status: status || 'Draft',
        progress: progress !== undefined ? parseInt(progress, 10) : 0,
        findings: findings !== undefined ? parseInt(findings, 10) : 0,
        tenantId
      }
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const startCampaign = async (req, res, next) => {
  try {
    const { id } = req.body;
    const tenantId = req.user.tenantId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId }
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (['Completed', 'Failed'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a completed or failed campaign'
      });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'Running' }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const pauseCampaign = async (req, res, next) => {
  try {
    const { id } = req.body;
    const tenantId = req.user.tenantId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId }
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (campaign.status === 'Paused') {
      return res.json({ success: true, data: campaign });
    }

    if (campaign.status !== 'Running') {
      return res.status(400).json({
        success: false,
        message: 'Only running campaigns can be paused'
      });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'Paused' }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const stopCampaign = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const tenantId = req.user.tenantId;
    const targetStatus = status || 'Completed';

    if (!['Completed', 'Failed'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stop status. Allowed values: 'Completed', 'Failed'"
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId }
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (['Completed', 'Failed'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: 'Campaign is already in a terminal state'
      });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: targetStatus }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
