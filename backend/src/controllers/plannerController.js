import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';
import { runPlanningWorkflow, runRiskAnalysisWorkflow, runRecommendationWorkflow } from '../workflow/workflowEngine.js';
import { getRunState } from '../workflow/stateManager.js';


export const generatePlan = async (req, res, next) => {
  try {
    const { assets, threats, criticality } = req.body;
    const tenantId = req.user.tenantId;

    if (!Array.isArray(assets)) {
      return res.status(400).json({ success: false, message: 'assets must be an array' });
    }

    if (!Array.isArray(threats)) {
      return res.status(400).json({ success: false, message: 'threats must be an array' });
    }

    const result = await runPlanningWorkflow({ assets, threats, criticality, tenantId });

    await logAudit({
      action: 'PLANNER_PLAN_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { criticality, assetCount: assets.length, threatCount: threats.length }
    });

    res.status(200).json({
      success: true,
      runId: result.runId,
      state: result.state,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};


export const validatePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const tenantId = req.user.tenantId;

    if (!plan) {
      return res.status(400).json({ success: false, message: 'plan object is required' });
    }

    const errors = [];
    const recommendations = [];

    if (!Array.isArray(plan.steps)) {
      errors.push('Plan must contain a steps array');
    } else {
      // Query the actual tenant assets to perform cross-reference tool alignment audits
      const tenantAssets = await prisma.asset.findMany({ where: { tenantId } });

      plan.steps.forEach((step, idx) => {
        const stepIdentifier = step.stepId || `Step #${idx + 1}`;
        
        // Structural validation checks
        if (!step.stepId) errors.push(`Step index ${idx} is missing 'stepId'`);
        if (!step.name) errors.push(`Step ${stepIdentifier} is missing 'name'`);
        if (!step.target) errors.push(`Step ${stepIdentifier} is missing 'target'`);
        if (!step.tool) errors.push(`Step ${stepIdentifier} is missing 'tool'`);
        if (!step.expectedRisk) errors.push(`Step ${stepIdentifier} is missing 'expectedRisk'`);

        // Semantic alignment checks
        if (step.target && step.tool) {
          const matchingAsset = tenantAssets.find(
            a => a.name.toLowerCase() === step.target.toLowerCase() || a.id.toLowerCase() === step.target.toLowerCase()
          );

          if (matchingAsset) {
            const assetType = matchingAsset.type;
            const tool = step.tool;

            if (assetType === 'API' && tool !== 'API Auth Probe') {
              errors.push(`Step ${stepIdentifier} target '${step.target}' is an API but uses tool '${tool}' instead of 'API Auth Probe'`);
            } else if (assetType === 'IP' && tool !== 'Port Scanner') {
              errors.push(`Step ${stepIdentifier} target '${step.target}' is an IP but uses tool '${tool}' instead of 'Port Scanner'`);
            } else if ((assetType === 'Domain' || assetType === 'Subdomain') && tool !== 'Web Headers Analyzer') {
              errors.push(`Step ${stepIdentifier} target '${step.target}' is a Domain/Subdomain but uses tool '${tool}' instead of 'Web Headers Analyzer'`);
            }
          }
        }
      });

      // Coverage validation checks
      const coveredTargets = new Set(plan.steps.map(s => s.target ? s.target.toLowerCase() : ''));
      tenantAssets.forEach(asset => {
        if (asset.risk === 'High' && !coveredTargets.has(asset.name.toLowerCase()) && !coveredTargets.has(asset.id.toLowerCase())) {
          recommendations.push(`Asset '${asset.name}' is rated High risk but is not covered by any steps in the testing plan`);
        }
      });
    }

    const isValid = errors.length === 0;

    await logAudit({
      action: 'PLANNER_PLAN_VALIDATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { isValid, errorCount: errors.length, recommendationCount: recommendations.length }
    });

    res.status(200).json({
      success: true,
      data: {
        isValid,
        errors,
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};

export const riskAnalysis = async (req, res, next) => {
  try {
    const { assets, threats } = req.body;
    const tenantId = req.user.tenantId;

    if (!Array.isArray(assets)) {
      return res.status(400).json({ success: false, message: 'assets must be an array' });
    }
    if (!Array.isArray(threats)) {
      return res.status(400).json({ success: false, message: 'threats must be an array' });
    }

    const result = await runRiskAnalysisWorkflow({ assets, threats, tenantId });

    await logAudit({
      action: 'PLANNER_RISK_ANALYSIS_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { assetCount: assets.length, threatCount: threats.length }
    });

    res.status(200).json({
      success: true,
      runId: result.runId,
      state: result.state,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const recommendations = async (req, res, next) => {
  try {
    const { findings } = req.body;
    const tenantId = req.user.tenantId;

    if (!Array.isArray(findings)) {
      return res.status(400).json({ success: false, message: 'findings must be an array' });
    }

    const result = await runRecommendationWorkflow({ findings, tenantId });

    await logAudit({
      action: 'PLANNER_RECOMMENDATIONS_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { findingCount: findings.length }
    });

    res.status(200).json({
      success: true,
      runId: result.runId,
      state: result.state,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkflowRun = async (req, res, next) => {
  try {
    const { runId } = req.params;
    const tenantId = req.user.tenantId;

    const runState = await getRunState(runId);
    if (!runState) {
      return res.status(404).json({ success: false, message: 'Workflow run not found' });
    }

    // Multitenancy validation: verify the requested run belongs to the user's tenant
    if (runState.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied to this workflow run' });
    }

    res.status(200).json({
      success: true,
      data: runState
    });
  } catch (error) {
    next(error);
  }
};
