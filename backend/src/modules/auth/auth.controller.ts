// src/modules/auth/auth.controller.ts
import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { successResponse } from '../../shared/response.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  successResponse(res, result, 'User registered successfully', 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  successResponse(res, result, 'Login successful');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  successResponse(res, result, 'Token refreshed successfully');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  successResponse(res, null, 'Logout successful');
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  successResponse(res, user, 'User retrieved successfully');
}