import prisma from '../config/db.js';

export const getEvidence = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const evidence = await prisma.evidence.findMany({
      where: {
        tenantId,
        type: {
          in: ['Screenshot', 'Log', 'HTTP Request', 'HTTP Response']
        }
      }
    });

    res.json({ success: true, data: evidence });
  } catch (error) {
    next(error);
  }
};

export const getArtifacts = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const artifacts = await prisma.evidence.findMany({
      where: {
        tenantId,
        type: 'Artifact'
      }
    });

    res.json({ success: true, data: artifacts });
  } catch (error) {
    next(error);
  }
};
