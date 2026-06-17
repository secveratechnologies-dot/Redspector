import prisma from '../config/db.js';

export const getCves = async (req, res, next) => {
  try {
    const { isKev, minCvss, search } = req.query;

    const where = {};

    if (isKev !== undefined) {
      where.isKev = isKev === 'true';
    }

    if (minCvss !== undefined) {
      const cvssVal = parseFloat(minCvss);
      if (!isNaN(cvssVal)) {
        where.cvss = { gte: cvssVal };
      }
    }

    if (search) {
      where.OR = [
        {
          cveId: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const cves = await prisma.cve.findMany({
      where
    });

    res.json({ success: true, data: cves });
  } catch (error) {
    next(error);
  }
};

export const getKev = async (req, res, next) => {
  try {
    const kevs = await prisma.cve.findMany({
      where: { isKev: true }
    });

    res.json({ success: true, data: kevs });
  } catch (error) {
    next(error);
  }
};

export const getAssetThreatIntel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Secure asset retrieval (tenant scoped)
    const asset = await prisma.asset.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Resolve details for associated CVEs
    const associatedCves = asset.cves || [];
    const threatDetails = await prisma.cve.findMany({
      where: {
        cveId: {
          in: associatedCves
        }
      }
    });

    res.json({
      success: true,
      data: {
        asset,
        threatIntel: threatDetails
      }
    });
  } catch (error) {
    next(error);
  }
};
