import prisma from '../config/db.js';

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
    res.json({ success: true, message: 'Finding deleted successfully' });
  } catch (error) {
    next(error);
  }
};
