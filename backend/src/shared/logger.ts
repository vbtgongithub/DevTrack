// src/shared/logger.ts - Simple logger
import { env } from '../config/env.js';

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
  },

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error || '', meta ? JSON.stringify(meta) : '');
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (env.IS_DEV) {
      console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  http: (message: string, meta?: Record<string, unknown>) => {
    if (env.IS_DEV) {
      console.log(`[HTTP] ${new Date().toISOString()} ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
};

export default logger;