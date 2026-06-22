import crypto from 'crypto';
import prisma from '../config/db.js';
import { searchSimilarity } from '../services/ragService.js';
import { buildPlannerPrompt, buildRiskAnalysisPrompt, buildRecommendationPrompt } from './promptTemplates.js';
import { initializeRun, updateRunState, logStep } from './stateManager.js';

/**
 * Executes the Planning Workflow.
 * 
 * @param {Object} params
 * @param {Array} params.assets - List of assets
 * @param {Array} params.threats - List of threat/CVE profiles
 * @param {string} params.criticality - Overall criticality level
 * @param {string} params.tenantId - Isolated tenant ID
 */
export const runPlanningWorkflow = async ({ assets, threats, criticality, tenantId }) => {
  const runId = crypto.randomUUID();
  await initializeRun(runId, tenantId, 'planning', { assets, threats, criticality });
  
  try {
    await updateRunState(runId, { status: 'processing' });
    await logStep(runId, 'START_WORKFLOW', 'Starting Planning Workflow execution');

    // 1. Context Retrieval
    await logStep(runId, 'RAG_RETRIEVAL_START', `Querying similarity database for ${assets.length} assets`);
    
    // We aggregate unique similarity search results for each asset
    const contextMap = new Map();
    for (const asset of assets) {
      const query = `Asset Name: ${asset.name} Type: ${asset.type} Risk: ${asset.risk || ''}`;
      const matches = await searchSimilarity({ query, tenantId, limit: 3 });
      for (const m of matches) {
        contextMap.set(m.id, m);
      }
    }
    
    const retrievedContext = Array.from(contextMap.values());
    await updateRunState(runId, { ragContext: retrievedContext });
    await logStep(runId, 'RAG_RETRIEVAL_END', `Retrieved ${retrievedContext.length} unique context entries`);

    // 2. Prompt Compilation
    await logStep(runId, 'PROMPT_COMPILATION_START', 'Building Planner LLM Prompt Template');
    const prompt = buildPlannerPrompt({ assets, threats, criticality, context: retrievedContext });
    await updateRunState(runId, { promptCompiled: prompt });
    await logStep(runId, 'PROMPT_COMPILATION_END', 'Compiled Planner prompt template successfully');

    // 3. LLM execution simulator
    await logStep(runId, 'LLM_SIMULATION_START', 'Executing LLM Campaign Plan Generator Simulation');
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const resolvedCriticality = criticality || 'Medium';
    const timestamp = new Date().toISOString().split('T')[0];
    const campaignName = `Security Campaign [${resolvedCriticality}] - ${timestamp}`;
    const summary = `Automated security testing plan generated for criticality tier: ${resolvedCriticality}. ` +
      `This execution scopes threat validation across ${assets.length} monitored target assets mapping to ${threats.length} cataloged threat profiles.`;
    const criticalityAssess = `Based on a business criticality of '${resolvedCriticality}', resources require active enforcement controls. ` +
      `Threat mappings show associated exposures with CVSS scores up to ${threats.reduce((max, t) => t.cvss > max ? t.cvss : max, 0.0)}.`;

    const steps = [];
    assets.forEach((asset, idx) => {
      const stepId = `STEP-${String(idx + 1).padStart(2, '0')}`;
      let name = '';
      let tool = '';
      let description = '';
      let expectedRisk = 'Low';

      if (asset.type === 'IP') {
        tool = 'Port Scanner';
        name = `Perform raw socket Port Scan against host ${asset.name}`;
        description = `Initiate TCP socket connectivity scans against common administrative ports on target ${asset.name}.`;
        expectedRisk = asset.risk === 'High' ? 'High' : 'Medium';
      } else if (asset.type === 'Domain' || asset.type === 'Subdomain') {
        tool = 'Web Headers Analyzer';
        name = `Audit security headers on Web application: ${asset.name}`;
        description = `Query web headers on ${asset.name} to attest missing HSTS, CSP, and X-Frame-Options policies.`;
        expectedRisk = 'Medium';
      } else if (asset.type === 'API') {
        tool = 'API Auth Probe';
        name = `Attest JWT validation controls on API endpoint: ${asset.name}`;
        description = `Send request with custom signature-forged tokens to test endpoint auth boundaries.`;
        expectedRisk = 'High';
      } else {
        tool = 'Cloud Configuration Auditor';
        name = `Audit identity access rules on Cloud Target: ${asset.name}`;
        description = `Verify bucket read policies and IAM permissions mappings to identify exposure.`;
        expectedRisk = 'Medium';
      }

      steps.push({
        stepId,
        name,
        target: asset.name,
        tool,
        description,
        expectedRisk
      });
    });

    const generatedPlan = {
      campaignName,
      summary,
      criticalityAssess,
      steps
    };

    await updateRunState(runId, { rawOutput: JSON.stringify(generatedPlan) });
    await logStep(runId, 'LLM_SIMULATION_END', 'Simulated LLM response obtained');

    // 4. Plan Validation
    await logStep(runId, 'VALIDATION_START', 'Initiating plan schema and mapping validation checks');
    const errors = [];
    const recommendations = [];

    // Structural and Tool alignment validation
    const tenantAssets = await prisma.asset.findMany({ where: { tenantId } });

    generatedPlan.steps.forEach((step, idx) => {
      const stepIdentifier = step.stepId || `Step #${idx + 1}`;
      if (!step.stepId) errors.push(`Step index ${idx} is missing 'stepId'`);
      if (!step.name) errors.push(`Step ${stepIdentifier} is missing 'name'`);
      if (!step.target) errors.push(`Step ${stepIdentifier} is missing 'target'`);
      if (!step.tool) errors.push(`Step ${stepIdentifier} is missing 'tool'`);
      if (!step.expectedRisk) errors.push(`Step ${stepIdentifier} is missing 'expectedRisk'`);

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

    // Coverage validation check
    const coveredTargets = new Set(generatedPlan.steps.map(s => s.target ? s.target.toLowerCase() : ''));
    tenantAssets.forEach(asset => {
      if (asset.risk === 'High' && !coveredTargets.has(asset.name.toLowerCase()) && !coveredTargets.has(asset.id.toLowerCase())) {
        recommendations.push(`Asset '${asset.name}' is rated High risk but is not covered by any steps in the testing plan`);
      }
    });

    const validationResults = {
      isValid: errors.length === 0,
      errors,
      recommendations
    };

    await updateRunState(runId, { validationResults });
    await logStep(runId, 'VALIDATION_END', `Validation finished. Valid: ${validationResults.isValid}. Errors count: ${errors.length}`);

    await updateRunState(runId, { status: 'completed' });
    await logStep(runId, 'END_WORKFLOW', 'Planning Workflow execution completed successfully');

    const finalState = await updateRunState(runId, {});
    return {
      runId,
      state: finalState,
      data: generatedPlan
    };
  } catch (error) {
    await updateRunState(runId, { status: 'failed', error: error.message });
    await logStep(runId, 'ERROR', `Workflow execution failed: ${error.message}`);
    throw error;
  }
};

/**
 * Executes the Risk Analysis Workflow.
 * 
 * @param {Object} params
 * @param {Array} params.assets - List of assets
 * @param {Array} params.threats - List of CVEs / threat intelligence profiles
 * @param {string} params.tenantId - Isolated tenant ID
 */
export const runRiskAnalysisWorkflow = async ({ assets, threats, tenantId }) => {
  const runId = crypto.randomUUID();
  await initializeRun(runId, tenantId, 'risk-analysis', { assets, threats });

  try {
    await updateRunState(runId, { status: 'processing' });
    await logStep(runId, 'START_WORKFLOW', 'Starting Risk Analysis Workflow execution');

    // 1. Context Retrieval
    await logStep(runId, 'RAG_RETRIEVAL_START', `Querying similarity database for risk assets/threats context`);
    
    const contextMap = new Map();
    // Query context based on threats (like CVEs)
    for (const threat of threats) {
      const query = `Threat: ${threat.cveId || ''} CVSS: ${threat.cvss || ''} Description: ${threat.description || ''}`;
      const matches = await searchSimilarity({ query, tenantId, limit: 3 });
      for (const m of matches) {
        contextMap.set(m.id, m);
      }
    }
    // Also query based on assets
    for (const asset of assets) {
      const query = `Asset: ${asset.name} type: ${asset.type} risk: ${asset.risk || ''}`;
      const matches = await searchSimilarity({ query, tenantId, limit: 2 });
      for (const m of matches) {
        contextMap.set(m.id, m);
      }
    }

    const retrievedContext = Array.from(contextMap.values());
    await updateRunState(runId, { ragContext: retrievedContext });
    await logStep(runId, 'RAG_RETRIEVAL_END', `Retrieved ${retrievedContext.length} unique context entries`);

    // 2. Prompt Compilation
    await logStep(runId, 'PROMPT_COMPILATION_START', 'Building Risk Analysis Prompt Template');
    const prompt = buildRiskAnalysisPrompt({ assets, threats, context: retrievedContext });
    await updateRunState(runId, { promptCompiled: prompt });
    await logStep(runId, 'PROMPT_COMPILATION_END', 'Compiled Risk Analysis prompt template successfully');

    // 3. LLM execution simulator
    await logStep(runId, 'LLM_SIMULATION_START', 'Executing LLM Risk Assessor Simulation');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Calculate score dynamically
    let calculatedScore = 30; // base score
    calculatedScore += assets.length * 4;
    calculatedScore += threats.length * 8;
    
    const maxCvss = threats.reduce((max, t) => t.cvss > max ? t.cvss : max, 0.0);
    if (maxCvss > 0) {
      calculatedScore += Math.round(maxCvss * 4.5);
    }
    
    const highRiskAssets = assets.filter(a => a.risk === 'High');
    calculatedScore += highRiskAssets.length * 10;
    
    // Clamp score
    calculatedScore = Math.min(100, Math.max(0, calculatedScore));

    let riskLevel = 'Low';
    if (calculatedScore >= 85) riskLevel = 'Critical';
    else if (calculatedScore >= 70) riskLevel = 'High';
    else if (calculatedScore >= 40) riskLevel = 'Medium';

    const exposureAreas = [];
    if (assets.some(a => a.type === 'API')) {
      exposureAreas.push('API Authentication Boundaries');
    }
    if (assets.some(a => a.type === 'IP')) {
      exposureAreas.push('Raw Network Administrative Ports Exposure');
    }
    if (assets.some(a => a.type === 'Domain' || a.type === 'Subdomain')) {
      exposureAreas.push('Public Domain Header Integrity');
    }
    if (threats.length > 0) {
      exposureAreas.push(`Vulnerable Software Dependencies (${threats.slice(0, 2).map(t => t.cveId).join(', ')})`);
    }
    if (exposureAreas.length === 0) {
      exposureAreas.push('General Asset Exposure');
    }

    const businessImpact = calculatedScore >= 70 ? 'High' : (calculatedScore >= 40 ? 'Medium' : 'Low');
    const analysisDetails = `Simulated risk assessment evaluated over ${assets.length} monitored assets and ${threats.length} threat profiles. ` +
      `Maximum threat CVSS score detected was ${maxCvss}. General posture is evaluated as ${riskLevel} danger tier with a score of ${calculatedScore}/100.`;

    const riskAnalysisResult = {
      riskScore: calculatedScore,
      riskLevel,
      businessImpact,
      exposureAreas,
      analysisDetails
    };

    await updateRunState(runId, { rawOutput: JSON.stringify(riskAnalysisResult) });
    await logStep(runId, 'LLM_SIMULATION_END', 'Simulated LLM response obtained');

    // 4. Validation
    await logStep(runId, 'VALIDATION_START', 'Validating risk score boundaries and JSON structure');
    const errors = [];
    if (typeof riskAnalysisResult.riskScore !== 'number' || riskAnalysisResult.riskScore < 0 || riskAnalysisResult.riskScore > 100) {
      errors.push('Risk score must be a number between 0 and 100');
    }
    if (!['Critical', 'High', 'Medium', 'Low'].includes(riskAnalysisResult.riskLevel)) {
      errors.push('Invalid risk level tier returned');
    }
    if (!Array.isArray(riskAnalysisResult.exposureAreas)) {
      errors.push('exposureAreas must be an array of strings');
    }

    const validationResults = {
      isValid: errors.length === 0,
      errors,
      recommendations: []
    };

    await updateRunState(runId, { validationResults });
    await logStep(runId, 'VALIDATION_END', `Validation finished. Valid: ${validationResults.isValid}`);

    await updateRunState(runId, { status: 'completed' });
    await logStep(runId, 'END_WORKFLOW', 'Risk Analysis Workflow execution completed successfully');

    const finalState = await updateRunState(runId, {});
    return {
      runId,
      state: finalState,
      data: riskAnalysisResult
    };
  } catch (error) {
    await updateRunState(runId, { status: 'failed', error: error.message });
    await logStep(runId, 'ERROR', `Workflow execution failed: ${error.message}`);
    throw error;
  }
};

/**
 * Executes the Recommendation Workflow.
 * 
 * @param {Object} params
 * @param {Array} params.findings - List of findings
 * @param {string} params.tenantId - Isolated tenant ID
 */
export const runRecommendationWorkflow = async ({ findings, tenantId }) => {
  const runId = crypto.randomUUID();
  await initializeRun(runId, tenantId, 'recommendation', { findings });

  try {
    await updateRunState(runId, { status: 'processing' });
    await logStep(runId, 'START_WORKFLOW', 'Starting Recommendation Workflow execution');

    // 1. Context Retrieval
    await logStep(runId, 'RAG_RETRIEVAL_START', `Querying similarity database for ${findings.length} findings`);
    
    const contextMap = new Map();
    for (const finding of findings) {
      const query = `Finding Title: ${finding.title} Severity: ${finding.severity} Asset: ${finding.asset}`;
      const matches = await searchSimilarity({ query, tenantId, limit: 3 });
      for (const m of matches) {
        contextMap.set(m.id, m);
      }
    }

    const retrievedContext = Array.from(contextMap.values());
    await updateRunState(runId, { ragContext: retrievedContext });
    await logStep(runId, 'RAG_RETRIEVAL_END', `Retrieved ${retrievedContext.length} unique context entries`);

    // 2. Prompt Compilation
    await logStep(runId, 'PROMPT_COMPILATION_START', 'Building Recommendation Prompt Template');
    const prompt = buildRecommendationPrompt({ findings, context: retrievedContext });
    await updateRunState(runId, { promptCompiled: prompt });
    await logStep(runId, 'PROMPT_COMPILATION_END', 'Compiled Recommendation prompt template successfully');

    // 3. LLM execution simulator
    await logStep(runId, 'LLM_SIMULATION_START', 'Executing LLM Remediation Engineer Simulation');
    await new Promise(resolve => setTimeout(resolve, 800));

    const recommendations = [];
    findings.forEach((finding, idx) => {
      const recId = `REC-${String(idx + 1).padStart(2, '0')}`;
      let title = '';
      let category = 'General Security';
      let priority = 'Medium';
      let impact = 'Medium';
      let description = '';

      const lowerTitle = finding.title ? finding.title.toLowerCase() : '';

      if (lowerTitle.includes('auth') || lowerTitle.includes('jwt') || lowerTitle.includes('token') || lowerTitle.includes('api')) {
        category = 'Identity & Access Management';
        title = `Strengthen authorization rules for ${finding.asset}`;
        priority = finding.severity === 'Critical' || finding.severity === 'High' ? 'Critical' : 'High';
        impact = 'High';
        description = `Implement strict token signing checks and scope validation protocols to secure endpoint '${finding.asset}' against unauthorized credential usage.`;
      } else if (lowerTitle.includes('port') || lowerTitle.includes('scan') || lowerTitle.includes('unencrypted') || lowerTitle.includes('ssh')) {
        category = 'Network Security';
        title = `Audit and close unnecessary open ports on ${finding.asset}`;
        priority = finding.severity === 'Critical' || finding.severity === 'High' ? 'High' : 'Medium';
        impact = 'High';
        description = `Establish firewall policies to drop external incoming connections to unneeded listener ports on target host '${finding.asset}'.`;
      } else if (lowerTitle.includes('header') || lowerTitle.includes('csp') || lowerTitle.includes('hsts') || lowerTitle.includes('cors')) {
        category = 'Web Application Security';
        title = `Enforce HTTP Security Headers on ${finding.asset}`;
        priority = 'Medium';
        impact = 'Medium';
        description = `Configure Web server configurations to return standard HSTS, Content-Security-Policy (CSP), and X-Content-Type-Options headers on '${finding.asset}'.`;
      } else {
        title = `Mitigate security vulnerability: ${finding.title}`;
        priority = ['Critical', 'High', 'Medium', 'Low'].includes(finding.severity) ? finding.severity : 'Medium';
        impact = priority === 'Critical' || priority === 'High' ? 'High' : 'Medium';
        description = `Perform a comprehensive patch assessment or software dependency upgrade for '${finding.asset}' addressing finding details: ${finding.description || finding.title}.`;
      }

      recommendations.push({
        recId,
        title,
        category,
        priority,
        impact,
        description,
        target: finding.asset || 'Unknown Asset'
      });
    });

    const generatedRecommendations = {
      recommendations
    };

    await updateRunState(runId, { rawOutput: JSON.stringify(generatedRecommendations) });
    await logStep(runId, 'LLM_SIMULATION_END', 'Simulated LLM response obtained');

    // 4. Validation
    await logStep(runId, 'VALIDATION_START', 'Validating recommendations structure');
    const errors = [];
    if (!Array.isArray(generatedRecommendations.recommendations)) {
      errors.push('Recommendations must be an array');
    } else {
      generatedRecommendations.recommendations.forEach((rec, idx) => {
        const recIdStr = rec.recId || `Recommendation #${idx + 1}`;
        if (!rec.recId) errors.push(`Recommendation index ${idx} is missing 'recId'`);
        if (!rec.title) errors.push(`Recommendation ${recIdStr} is missing 'title'`);
        if (!rec.category) errors.push(`Recommendation ${recIdStr} is missing 'category'`);
        if (!rec.priority) errors.push(`Recommendation ${recIdStr} is missing 'priority'`);
        if (!rec.impact) errors.push(`Recommendation ${recIdStr} is missing 'impact'`);
        if (!rec.description) errors.push(`Recommendation ${recIdStr} is missing 'description'`);
        if (!rec.target) errors.push(`Recommendation ${recIdStr} is missing 'target'`);
      });
    }

    const validationResults = {
      isValid: errors.length === 0,
      errors,
      recommendations: []
    };

    await updateRunState(runId, { validationResults });
    await logStep(runId, 'VALIDATION_END', `Validation finished. Valid: ${validationResults.isValid}`);

    await updateRunState(runId, { status: 'completed' });
    await logStep(runId, 'END_WORKFLOW', 'Recommendation Workflow execution completed successfully');

    const finalState = await updateRunState(runId, {});
    return {
      runId,
      state: finalState,
      data: generatedRecommendations
    };
  } catch (error) {
    await updateRunState(runId, { status: 'failed', error: error.message });
    await logStep(runId, 'ERROR', `Workflow execution failed: ${error.message}`);
    throw error;
  }
};
