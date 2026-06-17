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
