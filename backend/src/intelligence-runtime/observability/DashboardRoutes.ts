import { Router } from 'express';
import { metricsTracker } from './MetricsTracker.js';

export const intelligenceDashboardRoutes = Router();

/**
 * Lightweight JSON endpoint exposing operational visibility 
 * into the Intelligence Runtime.
 * Intended for internal dashboards/Grafana parsing.
 */
intelligenceDashboardRoutes.get('/api/admin/intelligence/metrics', (req, res) => {
  // Enforce admin auth here in production
  
  const snapshot = metricsTracker.getSnapshot();
  
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    metrics: snapshot,
    subsystems: {
      deterministic_parsing: 'active',
      semantic_retrieval: 'active',
      feature_extraction: 'active',
      ats_calibration: 'active',
      credibility_verification: 'active'
    }
  });
});

/**
 * Endpoint to view real-time confidence calibration drift
 */
intelligenceDashboardRoutes.get('/api/admin/intelligence/calibration', (req, res) => {
  res.json({
    status: 'calibrated',
    mean_confidence: 0.82,
    drift_warnings: [],
    // In production, these pull from ConfidenceEvaluator and DriftMonitor snapshots
  });
});
