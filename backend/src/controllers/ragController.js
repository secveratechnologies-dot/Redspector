import { indexDocument, searchSimilarity } from '../services/ragService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Handle POST /rag/context to manually store document context.
 */
export const storeContext = async (req, res, next) => {
  try {
    const { source, sourceId, content } = req.body;
    const tenantId = req.user.tenantId;

    await indexDocument({
      source,
      sourceId,
      content,
      tenantId
    });

    await logAudit({
      action: 'RAG_CONTEXT_STORED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { source, sourceId }
    });

    res.status(201).json({
      success: true,
      message: 'Context document indexed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle POST /rag/search to execute a similarity search request.
 */
export const searchContext = async (req, res, next) => {
  try {
    const { query, limit } = req.body;
    const tenantId = req.user.tenantId;

    const limitVal = limit ? parseInt(limit, 10) : 5;
    const results = await searchSimilarity({
      query,
      tenantId,
      limit: limitVal
    });

    await logAudit({
      action: 'RAG_SEARCH_EXECUTED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { query, resultsCount: results.length }
    });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
