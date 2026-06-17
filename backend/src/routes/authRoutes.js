import express from 'express';
import {
  register,
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/reset-password-request', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
