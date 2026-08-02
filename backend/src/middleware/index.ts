// src/middleware/index.ts - Middleware barrel export
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  type AppError,
} from './error.js';

export {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  opsAuditorMiddleware,
  type AuthenticatedRequest,
} from './auth.js';

export { validateBody, validateQuery, validateParams, validateRequest, sanitizeRequest } from './validation.js';

export { rateLimit } from './rateLimit.js';