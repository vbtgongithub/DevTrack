// src/modules/resume-intelligence/upload/upload.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service.js';
import { successResponse, errorResponse } from '../../../shared/response.js';
import { logger } from '../../../shared/logger.js';

const uploadService = new UploadService();

/**
 * Upload resume file
 */
export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      errorResponse(res, 'No file uploaded', 'NO_FILE', 400);
      return;
    }

    const userId = (req as any).user?.id;
    const result = await uploadService.processUpload(req.file, userId);

    successResponse(res, result);
  } catch (error) {
    logger.error('[UploadController] Error uploading resume:', error);
    next(error);
  }
}

/**
 * Get resume session by ID
 */
export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.params.id as string;
    const session = await uploadService.getSession(sessionId);

    if (!session) {
      errorResponse(res, 'Session not found', 'NOT_FOUND', 404);
      return;
    }

    successResponse(res, session);
  } catch (error) {
    logger.error('[UploadController] Error getting session:', error);
    next(error);
  }
}

/**
 * Get session status
 */
export async function getSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.params.id as string;
    const status = await uploadService.getSessionStatus(sessionId);

    if (!status) {
      errorResponse(res, 'Session not found', 'NOT_FOUND', 404);
      return;
    }

    successResponse(res, status);
  } catch (error) {
    logger.error('[UploadController] Error getting session status:', error);
    next(error);
  }
}
