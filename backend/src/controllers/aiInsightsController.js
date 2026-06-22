import { generateAiInsights } from '../services/aiInsightsService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Controller to handle AI insights requests such as recommendations, attack path, threat analysis, and risk explanation.
 */
export const getAiInsights = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const { type, payload } = req.body; // type indicates which insight (recommendation, attackPath, etc.)

    const result = await generateAiInsights({ type, payload, tenantId });

    await logAudit({
      action: 'AI_INSIGHTS_FETCHED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { type }
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('AI Insights error:', error);
    next(error);
  }
};
