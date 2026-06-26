// src/middleware/auth.ts
import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { commonErrors } from '../shared/response.js';
import { User } from '../db/models/index.js';
import { syncClerkUser } from '../services/auth/ClerkUserSyncService.js';

import { verifyToken } from '@clerk/backend';

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return commonErrors.unauthorized(res);
      }
      
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      const userId = payload.sub;
      if (!userId) {
        return commonErrors.unauthorized(res);
      }
      
      let user = await User.findOne({ clerkId: userId });
      
      // If user doesn't exist locally, sync them from Clerk
      if (!user) {
        const syncRes = await syncClerkUser(userId);
        (req as AuthenticatedRequest).user = {
          id: syncRes.id,
          clerkId: userId,
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
      console.error('Auth verification failed:', err);
      return commonErrors.unauthorized(res);
    }
  }
];

export const optionalAuthMiddleware = [
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          const userId = payload.sub;
          
          if (userId) {
            let user = await User.findOne({ clerkId: userId });
            if (!user) {
               // We might not want to proactively sync on optional auth, but let's do it to be safe
               const syncRes = await syncClerkUser(userId);
               (req as AuthenticatedRequest).user = {
                 id: syncRes.id,
                 clerkId: userId,
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
        } catch (err) {
          // It's optional auth, ignore invalid token and proceed without user
          console.warn('Optional auth verification failed:', err);
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