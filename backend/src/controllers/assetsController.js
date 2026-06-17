import prisma from '../config/db.js';

export const createAsset = async (req, res, next) => {
  try {
    const { id, name, type, owner, risk, cves } = req.body;
    const tenantId = req.user.tenantId;

    // Validate asset type constraints
    const allowedTypes = ['Domain', 'Subdomain', 'IP', 'API', 'Cloud Asset'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset type. Allowed types are: ${allowedTypes.join(', ')}`
      });
    }

    // Check if asset with the same ID already exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: 'Asset with this ID already exists'
      });
    }

    const asset = await prisma.asset.create({
      data: {
        id,
        name,
        type,
        owner,
        risk,
        tenantId,
        cves: cves || []
      }
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const { search, type, risk } = req.query;
    const tenantId = req.user.tenantId;

    const where = {
      tenantId
    };

    if (type) {
      where.type = type;
    }

    if (risk) {
      where.risk = risk;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          owner: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const assets = await prisma.asset.findMany({
      where
    });

    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};
