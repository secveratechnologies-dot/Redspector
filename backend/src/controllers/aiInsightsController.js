import { generateAiInsights } from '../services/aiInsightsService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Controller to handle all AI insights requests.
 * Supports: recommendation, attackPath, threatAnalysis, riskExplanation, executiveInsights
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const getAiInsights = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const { type = 'recommendation', payload = {} } = req.body;

    const validTypes = ['recommendation', 'attackPath', 'threatAnalysis', 'riskExplanation', 'executiveInsights'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid insight type. Allowed: ${validTypes.join(', ')}` });
    }

    const result = await generateAiInsights({ type, payload, tenantId });

    await logAudit({
      action: 'AI_INSIGHTS_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { type }
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (
      error.message === 'Finding not found' ||
      error.message === 'Either findingId or finding object must be provided' ||
      error.message?.startsWith('Unsupported insight type')
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
