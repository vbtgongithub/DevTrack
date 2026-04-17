// src/config/env.ts - Environment configuration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
}

export const env = {
  // Server
  PORT: getEnvVarNumber('PORT', 3001),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  IS_PROD: getEnvVar('NODE_ENV', 'development') === 'production',
  IS_DEV: getEnvVar('NODE_ENV', 'development') === 'development',

  // Database
  MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/devtrack'),

  // JWT
  JWT_ACCESS_SECRET: getEnvVar('JWT_ACCESS_SECRET', 'dev-access-secret'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  JWT_ACCESS_EXPIRY: getEnvVar('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnvVar('JWT_REFRESH_EXPIRY', '7d'),

  // Platform Tokens
  GITHUB_TOKEN: getEnvVar('GITHUB_TOKEN', ''),

  // CORS
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnvVarNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: getEnvVarNumber('RATE_LIMIT_MAX_REQUESTS', 100),
};

export default env;