import prisma from '../config/db.js';
import { calculateRiskMetrics } from '../services/riskService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Endpoint controller to calculate dynamic security risk score, severity level,
 * and business impact metrics based on findings and asset exposures.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const calculateRisk = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    let { assets, findings } = req.body;

    // Fallback to database assets if not supplied in request body
    if (!assets) {
      assets = await prisma.asset.findMany({ where: { tenantId } });
    }

    // Fallback to database findings if not supplied in request body
    if (!findings) {
      findings = await prisma.finding.findMany({ where: { tenantId } });
    }

    if (!Array.isArray(assets)) {
      return res.status(400).json({ success: false, message: 'assets must be an array' });
    }

    if (!Array.isArray(findings)) {
      return res.status(400).json({ success: false, message: 'findings must be an array' });
    }

    const result = await calculateRiskMetrics({ assets, findings, tenantId });

    await logAudit({
      action: 'RISK_CALCULATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        riskScore: result.riskScore,
        severity: result.severity,
        assetsCount: assets.length,
        findingsCount: findings.length
      }
    });

    res.status(200).json({
      success: true,
      data: {
        riskScore: result.riskScore,
        severity: result.severity,
        businessImpact: result.businessImpact,
        stats: result.stats
      }
    });
  } catch (error) {
    next(error);
  }
};
