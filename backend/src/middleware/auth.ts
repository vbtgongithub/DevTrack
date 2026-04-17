// src/middleware/auth.ts - Authentication middleware
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { commonErrors } from '../shared/response.js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    commonErrors.unauthorized(res);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    commonErrors.unauthorized(res);
  }
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = decoded;
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    commonErrors.unauthorized(res);
    return;
  }

  if (req.user.role !== 'admin') {
    commonErrors.forbidden(res);
    return;
  }

  next();
}