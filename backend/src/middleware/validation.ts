// src/middleware/validation.ts - Request validation & sanitization middleware
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { commonErrors } from '../shared/response.js';

/**
 * Mutates an object in-place to prevent NoSQL injection by deleting keys starting with $ or containing .
 */
function sanitizeMutate(obj: any): void {
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeMutate);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      if (typeof obj[key] === 'object') {
        sanitizeMutate(obj[key]);
      }
    }
  }
}

export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  if (req.body) sanitizeMutate(req.body);
  if (req.query) sanitizeMutate(req.query);
  if (req.params) sanitizeMutate(req.params);
  next();
}

/**
 * Safer error serialization for validation details
 */
function serializeZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'root';
    if (!details[path]) {
      details[path] = [];
    }
    // Remove potentially sensitive user input from error message
    const safeMessage = err.message.replace(/".*"/g, '"[REDACTED]"');
    details[path].push(safeMessage);
  });
  return details;
}

export function validateRequest(schemas: { body?: ZodSchema<any>; query?: ZodSchema<any>; params?: ZodSchema<any> }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        commonErrors.validationError(res, serializeZodError(result.error));
        return;
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        commonErrors.validationError(res, serializeZodError(result.error));
        return;
      }
      if (req.query) {
        Object.keys(req.query).forEach((k) => delete req.query[k]);
        Object.assign(req.query, result.data);
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        commonErrors.validationError(res, serializeZodError(result.error));
        return;
      }
      if (req.params) {
        Object.keys(req.params).forEach((k) => delete req.params[k]);
        Object.assign(req.params, result.data);
      }
    }

    next();
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return validateRequest({ body: schema });
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateRequest({ query: schema });
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return validateRequest({ params: schema });
}