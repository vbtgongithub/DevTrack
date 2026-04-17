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
  type AuthUser,
  type AuthenticatedRequest,
} from './auth.js';

export { validateBody, validateQuery, validateParams } from './validation.js';