import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';
import { indexDocument } from '../services/ragService.js';
import { prioritizeFindings } from '../services/prioritizationService.js';


const ALLOWED_STATUSES = ['Open', 'Verified', 'Resolved', 'Closed'];
const ALLOWED_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];

export const createFinding = async (req, res, next) => {
  try {
    const { id, title, severity, asset, status, owner, description, evidence, recommendations } = req.body;
    const tenantId = req.user.tenantId;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    if (!ALLOWED_SEVERITIES.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Allowed severities are: ${ALLOWED_SEVERITIES.join(', ')}`
      });
    }

    const existingFinding = await prisma.finding.findUnique({ where: { id } });
    if (existingFinding) {
      return res.status(400).json({ success: false, message: 'Finding with this ID already exists' });
    }

    const finding = await prisma.finding.create({
      data: {
        id,
        title,
        severity,
        asset,
        status,
        owner,
        description,
        evidence,
        recommendations,
        tenantId
      }
    });

    await logAudit({
      action: 'FINDING_CREATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { findingId: id, title, severity }
    });

    // Automatically index finding context into the RAG Vector Database
    const findingContent = `Finding: ${title} (Severity: ${severity}, Asset: ${asset}, Status: ${status}, Description: ${description || 'None'}, Recommendations: ${recommendations || 'None'})`;
    await indexDocument({
      source: 'Finding',
      sourceId: id,
      content: findingContent,
      tenantId
    });

    res.status(201).json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
};

export const getFindings = async (req, res, next) => {
  try {
    const { search, status, severity } = req.query;
    const tenantId = req.user.tenantId;

    const where = { tenantId };

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
      where.status = status;
    }

    if (severity) {
      if (!ALLOWED_SEVERITIES.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity filter. Allowed severities are: ${ALLOWED_SEVERITIES.join(', ')}`
        });
      }
      where.severity = severity;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { asset: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const findings = await prisma.finding.findMany({ where });
    res.json({ success: true, data: findings });
  } catch (error) {
    next(error);
  }
};

export const getFindingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const finding = await prisma.finding.findFirst({
      where: { id, tenantId }
    });

    if (!finding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    res.json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
};

export const updateFinding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { title, severity, asset, status, owner, description, evidence, recommendations } = req.body;

    const existingFinding = await prisma.finding.findFirst({
      where: { id, tenantId }
    });

    if (!existingFinding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    // Validate if status is being updated
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
    }

    // Validate if severity is being updated
    if (severity !== undefined) {
      if (!ALLOWED_SEVERITIES.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity. Allowed severities are: ${ALLOWED_SEVERITIES.join(', ')}`
        });
      }
    }

    const updatedFinding = await prisma.finding.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        severity: severity !== undefined ? severity : undefined,
        asset: asset !== undefined ? asset : undefined,
        status: status !== undefined ? status : undefined,
        owner: owner !== undefined ? owner : undefined,
        description: description !== undefined ? description : undefined,
        evidence: evidence !== undefined ? evidence : undefined,
        recommendations: recommendations !== undefined ? recommendations : undefined
      }
    });

    await logAudit({
      action: 'FINDING_UPDATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { findingId: id, status, severity, title }
    });

    // Update RAG vector context with the fresh updates
    const findingContent = `Finding: ${updatedFinding.title} (Severity: ${updatedFinding.severity}, Asset: ${updatedFinding.asset}, Status: ${updatedFinding.status}, Description: ${updatedFinding.description || 'None'}, Recommendations: ${updatedFinding.recommendations || 'None'})`;
    await indexDocument({
      source: 'Finding',
      sourceId: id,
      content: findingContent,
      tenantId
    });

    res.json({ success: true, data: updatedFinding });
  } catch (error) {
    next(error);
  }
};

export const deleteFinding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const existingFinding = await prisma.finding.findFirst({
      where: { id, tenantId }
    });

    if (!existingFinding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    await prisma.finding.delete({ where: { id } });

    await logAudit({
      action: 'FINDING_DELETED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { findingId: id, title: existingFinding.title }
    });

    // Prune context representation from RAG store
    await prisma.vectorDocument.deleteMany({
      where: { source: 'Finding', sourceId: id, tenantId }
    });

    res.json({ success: true, message: 'Finding deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPrioritizedFindings = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const findings = await prisma.finding.findMany({ where: { tenantId } });
    const assets = await prisma.asset.findMany({ where: { tenantId } });

    const prioritized = await prioritizeFindings({ assets, findings, tenantId });

    // Calculate action counts
    const fixFirstCount = prioritized.filter(item => item.action === 'Fix First').length;
    const fixLaterCount = prioritized.filter(item => item.action === 'Fix Later').length;
    const monitorCount = prioritized.filter(item => item.action === 'Monitor').length;

    await logAudit({
      action: 'FINDINGS_PRIORITIZED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: {
        totalActiveCount: prioritized.length,
        fixFirst: fixFirstCount,
        fixLater: fixLaterCount,
        monitor: monitorCount
      }
    });

    res.status(200).json({
      success: true,
      data: {
        queue: prioritized,
        summary: {
          fixFirst: fixFirstCount,
          fixLater: fixLaterCount,
          monitor: monitorCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
