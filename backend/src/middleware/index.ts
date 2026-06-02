// src/middleware/index.ts - Middleware barrel export
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  type AppError,
} from './error.js';

export {
  clerkMiddleware,
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  opsAuditorMiddleware,
  type AuthenticatedRequest,
} from './auth.js';

export { validateBody, validateQuery, validateParams } from './validation.js';

export { rateLimit } from './rateLimit.js';