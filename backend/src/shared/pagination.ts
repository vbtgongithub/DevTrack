// src/shared/pagination.ts - Pagination utilities
import { PAGINATION } from '../config/constants.js';
import type { ApiPagination } from '../types/api.types.js';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function parsePaginationParams(query: { page?: string; pageSize?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || String(PAGINATION.DEFAULT_PAGE), 10));
  const pageSize = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.pageSize || String(PAGINATION.DEFAULT_PAGE_SIZE), 10))
  );

  return { page, pageSize };
}

export function createPagination(totalItems: number, params: PaginationParams): ApiPagination {
  const totalPages = Math.ceil(totalItems / params.pageSize);

  return {
    page: params.page,
    pageSize: params.pageSize,
    totalItems,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };
}

export function getSkipCount(params: PaginationParams): number {
  return (params.page - 1) * params.pageSize;
}

export function buildSortOptions(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedFields: string[]
): Record<string, 1 | -1> {
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return { createdAt: sortOrder === 'asc' ? 1 : -1 };
  }

  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
}