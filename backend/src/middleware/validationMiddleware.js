export const validateRequest = (schema) => {
  return (req, res, next) => {
    const target = schema.type === 'query' ? req.query : schema.type === 'params' ? req.params : req.body;
    const errors = [];

    if (!target) {
      return res.status(400).json({ success: false, message: 'Request payload is empty or invalid.' });
    }

    for (const [field, rules] of Object.entries(schema.rules)) {
      const val = target[field];

      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (val !== undefined && val !== null) {
        if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors.push({ field, message: `${field} must be a valid email address` });
        }
        if (rules.minLength && val.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters long` });
        }
        if (rules.numeric && typeof val !== 'number' && isNaN(Number(val))) {
          errors.push({ field, message: `${field} must be a numeric value` });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    next();
  };
};
