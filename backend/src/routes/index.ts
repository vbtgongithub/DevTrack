// src/routes/index.ts - Route composition
import { Router } from 'express';
import { authRoutes } from '../modules/auth/index.js';
import { dashboardRoutes } from '../modules/dashboard/index.js';
import { dsaRoutes } from '../modules/dsa/index.js';
import { activityRoutes } from '../modules/activity/index.js';
import { projectsRoutes } from '../modules/projects/index.js';
import { profileRoutes } from '../modules/profile/index.js';
import { settingsRoutes } from '../modules/settings/index.js';
import { syncRoutes } from '../modules/platform-sync/index.js';

const router = Router();

// Auth routes (no auth required for login/register)
router.use('/auth', authRoutes);

// Protected routes
router.use('/dashboard', dashboardRoutes);
router.use('/dsa', dsaRoutes);
router.use('/activity', activityRoutes);
router.use('/projects', projectsRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/platforms', syncRoutes);

export default router;