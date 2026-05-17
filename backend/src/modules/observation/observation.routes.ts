// src/modules/observation/observation.routes.ts — Observation & Telemetry routes
import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { sessionReplay } from './sessionReplay.service.js';
import { logger } from '../../shared/logger.js';

const router = Router();

// Start UX tracking session
router.post(
  '/session/start',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, deviceInfo } = req.body;
      if (!sessionId || !deviceInfo) {
        res.status(400).json({ error: 'sessionId and deviceInfo are required' });
        return;
      }

      await sessionReplay.startSession({
        sessionId,
        userId: new mongoose.Types.ObjectId(req.user!.id),
        startTime: new Date(),
        deviceInfo: {
          userAgent: deviceInfo.userAgent || '',
          viewport: deviceInfo.viewport || { width: 1280, height: 800 },
          deviceType: deviceInfo.deviceType || 'desktop',
        },
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      logger.error('[observation] Failed to start session', { error: err.message });
      res.status(500).json({ error: err.message || 'Failed to start session' });
    }
  }
);

// End UX tracking session
router.post(
  '/session/end',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      await sessionReplay.endSession(sessionId);
      res.status(200).json({ success: true });
    } catch (err: any) {
      logger.error('[observation] Failed to end session', { error: err.message });
      res.status(500).json({ error: err.message || 'Failed to end session' });
    }
  }
);

// Ingest telemetry events (page view, interaction, friction)
router.post(
  '/events',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, events } = req.body;
      if (!sessionId || !Array.isArray(events)) {
        res.status(400).json({ error: 'sessionId and events array are required' });
        return;
      }

      for (const event of events) {
        const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

        if (event.event === 'page_view') {
          await sessionReplay.recordPageView(sessionId, event.properties?.page || '/');
        } else if (
          ['hesitation', 'abandonment', 'confusion', 'error_occurred'].includes(event.event)
        ) {
          let mappedType: 'hesitation' | 'abandonment' | 'confusion' | 'error' = 'confusion';
          if (event.event === 'hesitation') mappedType = 'hesitation';
          if (event.event === 'abandonment') mappedType = 'abandonment';
          if (event.event === 'error_occurred') mappedType = 'error';

          await sessionReplay.recordFrictionEvent({
            sessionId,
            element: event.properties?.element || 'app',
            type: mappedType,
            severity: event.properties?.severity || 'low',
            timestamp,
            context: event.properties,
          });
        } else {
          // Standard interaction
          await sessionReplay.recordInteraction({
            sessionId,
            element: event.properties?.element || 'app',
            action: event.event,
            timestamp,
            context: event.properties,
          });
        }
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      logger.error('[observation] Failed to ingest telemetry events', { error: err.message });
      res.status(500).json({ error: err.message || 'Failed to ingest telemetry' });
    }
  }
);

export const observationRoutes = router;
