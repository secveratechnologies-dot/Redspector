import redis from '../config/redis.js';

// An in-memory store as fallback or primary depending on environment
const localStateRuns = new Map();

/**
 * Creates or initializes a new workflow run state.
 * @param {string} runId - Unique ID for the workflow run (e.g. uuid)
 * @param {string} tenantId - The tenant performing the run
 * @param {string} workflowType - "planning", "risk-analysis", "recommendation"
 * @param {Object} inputs - Initial parameters
 */
export const initializeRun = async (runId, tenantId, workflowType, inputs) => {
  const state = {
    runId,
    tenantId,
    workflowType,
    inputs,
    steps: [], // list of workflow execution steps
    ragContext: null, // retrieved context
    promptCompiled: null, // compiled prompt
    rawOutput: null, // response before validation
    validationResults: null, // checks run
    status: 'initialized', // 'initialized', 'processing', 'completed', 'failed'
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save to memory
  localStateRuns.set(runId, state);

  // Save to Redis if available
  if (redis) {
    try {
      await redis.setex(`workflow:run:${runId}`, 86400, JSON.stringify(state));
      // Add to tenant history list
      await redis.lpush(`workflow:history:${tenantId}`, runId);
      // Trim history to keep last 50 runs per tenant
      await redis.ltrim(`workflow:history:${tenantId}`, 0, 49);
    } catch (err) {
      console.error('[StateManager] Redis initialization error:', err.message);
    }
  }

  return state;
};

/**
 * Updates the workflow state with step/stage execution trace.
 * @param {string} runId
 * @param {Object} updates - Fields to update (e.g., { status, promptCompiled, rawOutput })
 */
export const updateRunState = async (runId, updates) => {
  let state = localStateRuns.get(runId);
  
  if (redis) {
    try {
      const data = await redis.get(`workflow:run:${runId}`);
      if (data) {
        state = JSON.parse(data);
      }
    } catch (err) {
      console.error('[StateManager] Redis read error in update:', err.message);
    }
  }

  if (!state) {
    throw new Error(`Workflow run ${runId} not found`);
  }

  state = {
    ...state,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Save to memory
  localStateRuns.set(runId, state);

  if (redis) {
    try {
      await redis.setex(`workflow:run:${runId}`, 86400, JSON.stringify(state));
    } catch (err) {
      console.error('[StateManager] Redis update write error:', err.message);
    }
  }

  return state;
};

/**
 * Appends a log message to the state steps
 * @param {string} runId
 * @param {string} stepName
 * @param {string} details
 */
export const logStep = async (runId, stepName, details) => {
  let state = localStateRuns.get(runId);
  
  if (redis) {
    try {
      const data = await redis.get(`workflow:run:${runId}`);
      if (data) {
        state = JSON.parse(data);
      }
    } catch (err) {
      console.error('[StateManager] Redis read error in logStep:', err.message);
    }
  }

  if (!state) return;

  state.steps.push({
    stepName,
    details,
    timestamp: new Date().toISOString()
  });
  state.updatedAt = new Date().toISOString();

  localStateRuns.set(runId, state);

  if (redis) {
    try {
      await redis.setex(`workflow:run:${runId}`, 86400, JSON.stringify(state));
    } catch (err) {
      console.error('[StateManager] Redis update write error in logStep:', err.message);
    }
  }
};

/**
 * Retrieves the workflow run details
 * @param {string} runId
 */
export const getRunState = async (runId) => {
  if (redis) {
    try {
      const data = await redis.get(`workflow:run:${runId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('[StateManager] Redis get error:', err.message);
    }
  }
  return localStateRuns.get(runId) || null;
};

/**
 * Returns history of workflow runs for a specific tenant.
 * @param {string} tenantId
 */
export const getTenantHistory = async (tenantId) => {
  if (redis) {
    try {
      const runIds = await redis.lrange(`workflow:history:${tenantId}`, 0, 49);
      if (runIds && runIds.length > 0) {
        const pipeline = redis.pipeline();
        runIds.forEach(id => pipeline.get(`workflow:run:${id}`));
        const results = await pipeline.exec();
        return results
          .map(([err, res]) => res ? JSON.parse(res) : null)
          .filter(Boolean);
      }
    } catch (err) {
      console.error('[StateManager] Redis history read error:', err.message);
    }
  }

  // Fallback to local memory filter
  return Array.from(localStateRuns.values())
    .filter(run => run.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};
