import { generateRecommendationDetails } from '../services/aiRecommendationService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Controller handler for generating AI-powered remediation advice, impact analysis,
 * and priority grading metrics for findings under multi-tenant scoping.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const getAiRecommendation = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { findingId, finding } = req.body;

    const result = await generateRecommendationDetails({ findingId, finding, tenantId });

    await logAudit({
      action: 'AI_RECOMMENDATION_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        findingId: findingId || 'custom_dry_run',
        priority: result.priority
      }
    });

    res.status(200).json({
      success: true,
      data: {
        issue: result.issue,
        impact: result.impact,
        recommendation: result.recommendation,
        priority: result.priority
      }
    });
  } catch (error) {
    if (error.message === 'Finding not found' || error.message === 'Either findingId or finding object must be provided') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
