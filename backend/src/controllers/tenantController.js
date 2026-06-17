import prisma from '../config/db.js';
import redis from '../config/redis.js';

export const createTenant = async (req, res, next) => {
  try {
    const { name, domain } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tenant name is required' });
    }

    const uniqueDomain = domain || `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const existingDomain = await prisma.tenant.findUnique({ where: { domain: uniqueDomain } });
    if (existingDomain) {
      return res.status(400).json({ success: false, message: 'Domain already taken' });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain: uniqueDomain
      }
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, domain } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        name: name || undefined,
        domain: domain || undefined
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const changeTenantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Allowed values: 'Active', 'Suspended'" });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { status }
    });

    // Update Redis cache and revoke active tokens on suspension
    if (status === 'Suspended') {
      if (redis) {
        await redis.setex(`tenant:suspended:${id}`, 86400, 'true');
      }

      await prisma.refreshToken.updateMany({
        where: { user: { tenantId: id } },
        data: { isRevoked: true }
      });
    } else {
      if (redis) {
        await redis.del(`tenant:suspended:${id}`);
      }
    }

    res.json({
      success: true,
      message: `Tenant status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
