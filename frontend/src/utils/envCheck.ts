// ============================================================================
// envCheck.ts — Frontend Environment Validation
// ============================================================================
// Validates required environment variables at app startup.
// Imported by main.tsx before rendering to fail fast with clear errors.
// ============================================================================

interface EnvConfig {
  VITE_API_BASE_URL: string;
}

function validateEnv(): EnvConfig {
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  if (!VITE_API_BASE_URL && import.meta.env.PROD) {
    throw new Error(
      '[DevTrack] Missing required environment variable: VITE_API_BASE_URL\n' +
        'Set this in your .env file or build environment.'
    );
  }

  return {
    VITE_API_BASE_URL: VITE_API_BASE_URL || 'http://localhost:3001/api',
  };
}

export const envConfig = validateEnv();
