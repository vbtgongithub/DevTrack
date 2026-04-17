// src/modules/projects/projects.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware, validateBody } from '../../middleware/index.js';
import * as controller from './projects.controller.js';
import { z } from 'zod';

const router = Router();

const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  repoUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  techStack: z.array(z.string()),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold', 'archived']),
  visibility: z.enum(['public', 'private']),
});

const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  repoUrl: z.string().url().optional().nullable(),
  liveUrl: z.string().url().optional().nullable(),
  techStack: z.array(z.string()).optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold', 'archived']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

const taskCreateSchema = z.object({
  milestoneId: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
});

const taskUpdateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
});

router.get('/', authMiddleware, asyncHandler(controller.getProjects));
router.get('/stats', authMiddleware, asyncHandler(controller.getProjectStats));
router.post('/', authMiddleware, validateBody(projectCreateSchema), asyncHandler(controller.createProject));
router.get('/:id', authMiddleware, asyncHandler(controller.getProjectById));
router.patch('/:id', authMiddleware, validateBody(projectUpdateSchema), asyncHandler(controller.updateProject));
router.delete('/:id', authMiddleware, asyncHandler(controller.deleteProject));
router.get('/:id/tasks', authMiddleware, asyncHandler(controller.getProjectTasks));
router.post('/:id/tasks', authMiddleware, validateBody(taskCreateSchema), asyncHandler(controller.createProjectTask));
router.patch('/:id/tasks/:taskId', authMiddleware, validateBody(taskUpdateSchema), asyncHandler(controller.updateProjectTask));
router.post('/:id/sync', authMiddleware, asyncHandler(controller.syncProject));

export default router;