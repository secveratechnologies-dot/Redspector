import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_redspecter_dev_key_123!';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = async (userId) => {
  // Generate a secure random token string
  const tokenString = crypto.randomBytes(40).toString('hex');
  
  // Expiration set to 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save the refresh token to the database
  const refreshToken = await prisma.refreshToken.create({
    data: {
      token: tokenString,
      userId: userId,
      expiresAt: expiresAt
    }
  });

  return refreshToken.token;
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
