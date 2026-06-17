import prisma from '../config/db.js';
import redis from '../config/redis.js';

export const checkTenantStatus = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Bad Request: Tenant ID missing from user context.' });
    }

    // 1. Check Redis cache
    if (redis) {
      const isSuspended = await redis.get(`tenant:suspended:${tenantId}`);
      if (isSuspended === 'true') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Your organization account has been suspended.'
        });
      }
    }

    // 2. Query PostgreSQL database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Access Denied: Tenant not found.' });
    }

    if (tenant.status === 'Suspended') {
      // Cache in Redis for 1 hour to prevent consecutive DB queries
      if (redis) {
        await redis.setex(`tenant:suspended:${tenantId}`, 3600, 'true');
      }
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your organization account has been suspended.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
