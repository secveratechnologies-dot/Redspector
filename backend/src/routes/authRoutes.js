import express from 'express';
import {
  register,
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
  mfaSetup,
  verifyMfa
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema, mfaVerifySchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/reset-password-request', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.post('/mfa/setup', protect, mfaSetup);
router.post('/mfa/verify', validateRequest(mfaVerifySchema), verifyMfa);

export default router;
