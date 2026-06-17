import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils.js';

// Allowed platform roles
const ALLOWED_ROLES = [
  'Super Admin',
  'Tenant Admin',
  'Security Analyst',
  'Approver',
  'Auditor',
  'Viewer'
];

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName, companyName, role, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Default to Viewer role if none specified
    let userRole = 'Viewer';
    if (role) {
      if (ALLOWED_ROLES.includes(role)) {
        userRole = role;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
        });
      }
    }

    // Resolve tenantId
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const tenantName = companyName || 'Default Tenant';
      const emailDomain = email.split('@')[1];
      const uniqueDomain = `${emailDomain}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          domain: uniqueDomain
        }
      });
      finalTenantId = newTenant.id;
    } else {
      const existingTenant = await prisma.tenant.findUnique({ where: { id: finalTenantId } });
      if (!existingTenant) {
        return res.status(400).json({ success: false, message: 'Tenant specified does not exist' });
      }
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create record
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: userRole,
        tenantId: finalTenantId
      },
      include: { tenant: true }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.tenant.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate rotated tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          companyName: user.tenant.name,
          role: user.role,
          mfaVerified: user.mfaVerified,
          tenantId: user.tenantId
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Mark current token as revoked
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!dbToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Token reuse detection (security breach indicator)
    if (dbToken.isRevoked) {
      // Invalidate all tokens in the user session family immediately
      await prisma.refreshToken.updateMany({
        where: { userId: dbToken.userId },
        data: { isRevoked: true }
      });
      return res.status(401).json({
        success: false,
        message: 'Security Warning: Refresh token already exchanged. All session sessions revoked.'
      });
    }

    // Expiry check
    if (dbToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token has expired' });
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { isRevoked: true }
    });

    // Issue rotated tokens
    const accessToken = generateAccessToken(dbToken.user);
    const newRefreshToken = await generateRefreshToken(dbToken.userId);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generic privacy response
      return res.json({
        success: true,
        message: 'If the email exists, a password reset token has been generated.'
      });
    }

    // Generate secure random reset token (1 hr expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    console.log(`[PASSWORD RESET] Generated Token for ${email}: ${token}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset token has been generated.',
      debugToken: token
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    // Encrypt new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Save changes
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Cleanup token and invalidate existing refresh tokens to force re-auth
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { isRevoked: true }
    });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};
