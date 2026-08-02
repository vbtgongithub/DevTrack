import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validation.js';
import { setCareerIntentSchema, setSkillProgressSchema } from './readiness.validation.js';
import { ReadinessController } from './readiness.controller.js';
import dsaRoutes from './dsa/routes/dsa.routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/snapshot', ReadinessController.getSnapshot);
router.get('/domain/:domain', ReadinessController.getDomainIntelligence);
router.post('/intent', validateBody(setCareerIntentSchema), ReadinessController.setCareerIntent);
router.post('/skill-progress', validateBody(setSkillProgressSchema), ReadinessController.setSkillProgress);

// Mount DSA sub-routes under /readiness/dsa
router.use('/dsa', dsaRoutes);

export const readinessRoutes = router;


