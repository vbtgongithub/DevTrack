// src/modules/resume-intelligence/upload/upload.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.js';
import { uploadSingle } from './multer.config.js';
import { validateUpload } from './upload.validation.js';
import * as controller from './upload.controller.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/resume/upload
 * Upload a resume file (PDF, DOCX, TXT, MD)
 */
router.post('/upload', uploadSingle, validateUpload, controller.uploadResume);

/**
 * GET /api/resume/session/:id
 * Get resume session by ID
 */
router.get('/session/:id', controller.getSession);

/**
 * GET /api/resume/session/:id/status
 * Get session processing status
 */
router.get('/session/:id/status', controller.getSessionStatus);

export default router;
