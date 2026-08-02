// src/middleware/error.ts - Error handling middleware
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse, commonErrors } from '../shared/response.js';
import { reportError } from '../shared/monitoring.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Report to monitoring
  reportError(err, {
    path: req.path,
    method: req.method,
    metadata: {
      code: err.code,
      statusCode: err.statusCode,
    },
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.') || 'root';
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });
    commonErrors.validationError(res, details);
    return;
  }

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    if (isProduction) {
      commonErrors.conflict(res, 'Resource already exists');
    } else {
      const keyValue = (err as unknown as { keyValue: Record<string, unknown> }).keyValue || {};
      const field = Object.keys(keyValue)[0] || 'Resource';
      commonErrors.conflict(res, `${field} already exists`);
    }
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationError = err as unknown as {
      errors: Record<string, { message: string }>;
    };
    const details: Record<string, string[]> = {};
    Object.entries(validationError.errors || {}).forEach(([field, error]) => {
      details[field] = [error.message];
    });
    commonErrors.validationError(res, details);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    commonErrors.badRequest(res, 'Invalid ID format');
    return;
  }

  // Handle custom AppErrors
  if (err.statusCode) {
    if (err.statusCode >= 500 && isProduction) {
      errorResponse(res, 'Internal server error', err.code || 'INTERNAL_ERROR', err.statusCode);
    } else {
      errorResponse(res, err.message, err.code || 'ERROR', err.statusCode, err.details, isProduction ? undefined : err.stack);
    }
    return;
  }

  // Default to internal server error
  if (isProduction) {
    commonErrors.internalError(res, 'Internal server error');
  } else {
    errorResponse(res, err.message || 'Internal server error', 'INTERNAL_ERROR', 500, undefined, err.stack);
  }
}

// Not found middleware
export function notFoundHandler(req: Request, res: Response): void {
  errorResponse(res, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND', 404);
}

// Async handler wrapper
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}