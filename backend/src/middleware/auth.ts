// src/middleware/auth.ts
import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { commonErrors } from '../shared/response.js';
import { User } from '../db/models/index.js';
import { syncClerkUser } from '../services/auth/ClerkUserSyncService.js';

export { clerkMiddleware };

export interface AuthUser {
  id: string; // Mongo ID
  clerkId: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Intercept the clerk requireAuth to also inject our Mongo user
export const authMiddleware = [
  clerkMiddleware(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuth(req);
      if (!auth.userId) {
        return commonErrors.unauthorized(res);
      }
      
      let user = await User.findOne({ clerkId: auth.userId });
      
      // If user doesn't exist locally, sync them from Clerk
      if (!user) {
        const syncRes = await syncClerkUser(auth.userId);
        (req as AuthenticatedRequest).user = {
          id: syncRes.id,
          clerkId: auth.userId,
          email: syncRes.email,
          username: syncRes.username,
          role: syncRes.role,
        };
      } else {
        (req as AuthenticatedRequest).user = {
          id: user._id.toString(),
          clerkId: user.clerkId,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      }
      next();
    } catch (err) {
      next(err);
    }
  }
];

export const optionalAuthMiddleware = [
  clerkMiddleware(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuth(req);
      if (auth.userId) {
        let user = await User.findOne({ clerkId: auth.userId });
        if (!user) {
           // We might not want to proactively sync on optional auth, but let's do it to be safe
           const syncRes = await syncClerkUser(auth.userId);
           (req as AuthenticatedRequest).user = {
             id: syncRes.id,
             clerkId: auth.userId,
             email: syncRes.email,
             username: syncRes.username,
             role: syncRes.role,
           };
        } else {
          (req as AuthenticatedRequest).user = {
            id: user._id.toString(),
            clerkId: user.clerkId,
            email: user.email,
            username: user.username,
            role: user.role,
          };
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  }
];

export async function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

export async function opsAuditorMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    commonErrors.unauthorized(res);
    return;
  }
  
  const opsRoles = ['admin', 'moderator', 'trust_operator', 'readonly_auditor'];
  if (!opsRoles.includes(req.user.role)) {
    commonErrors.forbidden(res);
    return;
  }
  next();
}