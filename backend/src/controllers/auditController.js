import prisma from '../config/db.js';

/**
 * Retrieve audit logs for the authenticated user's tenant.
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    next(error);
  }
};
