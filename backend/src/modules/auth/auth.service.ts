// src/modules/auth/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { User, RefreshToken, hashPassword, type IUser } from '../../db/models/index.js';
import type { ApiAuthTokens, ApiLoginResponse, ApiRegisterResponse, ApiUser } from '../../types/api.types.js';
import { logger } from '../../shared/logger.js';
import type { SignOptions } from 'jsonwebtoken';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName: string;
  inviteCode?: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    algorithm: 'HS256', // Explicitly specify algorithm to prevent algorithm confusion
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function mapUserToApiUser(user: IUser): ApiUser {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    timezone: user.timezone,
    joinedAt: user.joinedAt.toISOString(),
    lastActiveAt: user.lastActiveAt.toISOString(),
    isEmailVerified: user.isEmailVerified,
    role: user.role,
  };
}

export async function register(input: RegisterInput): Promise<ApiRegisterResponse> {


  // Check if email exists
  const existingEmail = await User.findOne({ email: input.email });
  if (existingEmail) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409, code: 'EMAIL_EXISTS' });
  }

  // Check if username exists
  const existingUsername = await User.findOne({ username: input.username });
  if (existingUsername) {
    throw Object.assign(new Error('Username already taken'), { statusCode: 409, code: 'USERNAME_EXISTS' });
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await User.create({
    email: input.email,
    username: input.username,
    passwordHash,
    displayName: input.displayName,
  });



  // Create default settings and profile
  const { UserSettings, UserProfile } = await import('../../db/models/index.js');
  await Promise.all([
    UserSettings.create({ userId: user._id }),
    UserProfile.create({ userId: user._id }),
  ]);

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
  });

  const refreshTokenString = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshTokenString);

  // Store refresh token
  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  logger.info('User registered', { userId: user._id.toString() });

  return {
    user: mapUserToApiUser(user),
    tokens: {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 900, // 15 minutes
    },
  };
}

export async function login(input: LoginInput): Promise<ApiLoginResponse> {
  // Find user by email or username
  const user = await User.findOne({
    $or: [{ email: input.emailOrUsername.toLowerCase() }, { username: input.emailOrUsername }],
  }).select('+passwordHash');

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }

  // Verify password
  const isValidPassword = await user.comparePassword(input.password);
  if (!isValidPassword) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }



  // Update last active
  user.lastActiveAt = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
  });

  const refreshTokenString = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshTokenString);

  // Store refresh token
  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  logger.info('User logged in', { userId: user._id.toString() });

  return {
    user: mapUserToApiUser(user),
    tokens: {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 900, // 15 minutes
    },
  };
}

export async function refreshTokens(refreshToken: string): Promise<ApiAuthTokens> {
  const tokenHash = hashToken(refreshToken);

  // Find valid refresh token
  const storedToken = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
  }

  // Get user
  const user = await User.findById(storedToken.userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  }

  // Revoke old token
  storedToken.revokedAt = new Date();
  await storedToken.save();

  // Generate new tokens
  const accessToken = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
  });

  const newRefreshTokenString = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshTokenString);

  // Store new refresh token
  await RefreshToken.create({
    userId: user._id,
    tokenHash: newRefreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    replacedByToken: refreshToken,
  });

  return {
    accessToken,
    refreshToken: newRefreshTokenString,
    expiresIn: 900,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);

  await RefreshToken.updateOne(
    { tokenHash },
    { revokedAt: new Date() }
  );
}

export async function logoutAll(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function getMe(userId: string): Promise<ApiUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  }
  return mapUserToApiUser(user);
}