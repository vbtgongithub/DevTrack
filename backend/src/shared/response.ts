// src/shared/response.ts - API response builders
import type { Response } from 'express';
import type { ApiResponse, ApiPaginatedResponse, ApiPagination, ApiError, ApiMutationResponse, ApiDeleteResponse } from '../types/api.types.js';

export function successResponse<T>(res: Response, data: T, message = 'Success', statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: ApiPagination,
  message = 'Success'
): void {
  const response: ApiPaginatedResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination,
  };
  res.status(200).json(response);
}

export function mutationResponse(res: Response, success: boolean, message: string, statusCode = 200): void {
  const response: ApiMutationResponse = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function deleteResponse(res: Response, deletedId: string, message = 'Deleted successfully'): void {
  const response: ApiDeleteResponse = {
    success: true,
    message,
    deletedId,
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  code: string,
  statusCode = 500,
  details?: Record<string, string[]>
): void {
  const response: ApiError = {
    success: false,
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    details,
  };
  res.status(statusCode).json(response);
}

// Common error responses
export const commonErrors = {
  notFound: (res: Response, resource = 'Resource') =>
    errorResponse(res, `${resource} not found`, 'NOT_FOUND', 404),

  unauthorized: (res: Response) =>
    errorResponse(res, 'Unauthorized', 'UNAUTHORIZED', 401),

  forbidden: (res: Response) =>
    errorResponse(res, 'Forbidden', 'FORBIDDEN', 403),

  badRequest: (res: Response, message = 'Bad request') =>
    errorResponse(res, message, 'BAD_REQUEST', 400),

  conflict: (res: Response, message = 'Resource already exists') =>
    errorResponse(res, message, 'CONFLICT', 409),

  validationError: (res: Response, details: Record<string, string[]>) =>
    errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, details),

  internalError: (res: Response, message = 'Internal server error') =>
    errorResponse(res, message, 'INTERNAL_ERROR', 500),
};