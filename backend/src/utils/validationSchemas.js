export const registerSchema = {
  type: 'body',
  rules: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 6 },
    fullName: { required: true }
  }
};

export const loginSchema = {
  type: 'body',
  rules: {
    email: { required: true, type: 'email' },
    password: { required: true }
  }
};

export const createCampaignSchema = {
  type: 'body',
  rules: {
    id: { required: true },
    name: { required: true }
  }
};

export const createAssetSchema = {
  type: 'body',
  rules: {
    id: { required: true },
    name: { required: true },
    type: { required: true },
    owner: { required: true },
    risk: { required: true }
  }
};

export const campaignActionSchema = {
  type: 'body',
  rules: {
    id: { required: true }
  }
};

export const createFindingSchema = {
  type: 'body',
  rules: {
    id: { required: true },
    title: { required: true },
    severity: { required: true },
    asset: { required: true },
    status: { required: true }
  }
};

export const jiraIntegrationSchema = {
  type: 'body',
  rules: {
    findingId: { required: true }
  }
};

export const mfaVerifySchema = {
  type: 'body',
  rules: {
    email: { required: true, type: 'email' },
    password: { required: true },
    code: { required: true }
  }
};

export const plannerGenerateSchema = {
  type: 'body',
  rules: {
    assets: { required: true },
    threats: { required: true },
    criticality: { required: true }
  }
};

export const plannerValidateSchema = {
  type: 'body',
  rules: {
    plan: { required: true }
  }
};

export const plannerRiskAnalysisSchema = {
  type: 'body',
  rules: {
    assets: { required: true },
    threats: { required: true }
  }
};

export const plannerRecommendationsSchema = {
  type: 'body',
  rules: {
    findings: { required: true }
  }
};


export const ragContextSchema = {
  type: 'body',
  rules: {
    source: { required: true },
    sourceId: { required: true },
    content: { required: true }
  }
};

export const ragSearchSchema = {
  type: 'body',
  rules: {
    query: { required: true }
  }
};





