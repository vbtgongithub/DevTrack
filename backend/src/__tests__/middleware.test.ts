// src/__tests__/middleware.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler, AppError } from '../middleware/error.js';
import { validateBody } from '../middleware/validation.js';

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe('Middleware hardening tests', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('errorHandler', () => {
    it('strips stack trace and sensitive message in production for 500 internal server errors', () => {
      process.env.NODE_ENV = 'production';
      const req = { path: '/api/v1/test', method: 'GET' } as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;
      const err: AppError = new Error('Secret DB connection error string');
      err.stack = 'Error: Secret DB connection error string\n    at SecretFunction (/app/db.ts:10:5)';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        })
      );
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.stack).toBeUndefined();
    });

    it('retains stack trace and message in non-production mode', () => {
      process.env.NODE_ENV = 'development';
      const req = { path: '/api/v1/test', method: 'GET' } as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;
      const err: AppError = new Error('Development error message');
      err.stack = 'Error: Development error message\n    at TestFunction (/app/test.ts:1:1)';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Development error message',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          stack: expect.stringContaining('TestFunction'),
        })
      );
    });

    it('sanitizes Mongo duplicate key error in production', () => {
      process.env.NODE_ENV = 'production';
      const req = { path: '/api/v1/test', method: 'POST' } as Request;
      const res = mockResponse();
      const next = vi.fn() as NextFunction;
      const err: AppError = new Error('E11000 duplicate key error collection');
      err.name = 'MongoServerError';
      (err as any).code = 11000;
      (err as any).keyValue = { secretDbField: 'value' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resource already exists',
          code: 'CONFLICT',
        })
      );
    });
  });

  describe('Zod Validation Middleware', () => {
    const dummySchema = z.object({
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be at least 18'),
    });

    it('returns 400 Bad Request with structured field errors on safeParse failure', () => {
      const middleware = validateBody(dummySchema);
      const req = { body: { email: 'not-an-email', age: 10 } } as Request;
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: {
            email: ['Invalid email address'],
            age: ['Must be at least 18'],
          },
        })
      );
    });

    it('passes control to next() when validation succeeds', () => {
      const middleware = validateBody(dummySchema);
      const req = { body: { email: 'test@example.com', age: 25 } } as Request;
      const res = mockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Auth Cookie Middleware', () => {
    it('rejects unauthenticated requests without cookie or auth header', async () => {
      const { authMiddleware } = await import('../middleware/auth.js');
      const handler = authMiddleware[0];
      const req = { headers: {}, cookies: {} } as Request;
      const res = mockResponse();
      const next = vi.fn();

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
