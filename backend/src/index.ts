// src/index.ts - DevTrack Backend Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, API_BASE_PATH } from './config/index.js';
import { connectDatabase } from './db/connection.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import routes from './routes/index.js';
import { logger } from './shared/logger.js';

async function bootstrap() {
  const app = express();

  // Connect to database
  await connectDatabase();

  // Security middleware - Helmet with production-grade configuration
  app.use(helmet({
    contentSecurityPolicy: env.IS_PROD ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : undefined,
    hsts: env.IS_PROD ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : undefined,
  }));

  // CORS - strict origin in production
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-ID'],
  }));

  app.use(morgan(env.IS_DEV ? 'dev' : 'combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // API routes
  app.use(API_BASE_PATH, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  // Start server
  app.listen(env.PORT, () => {
    logger.info(`DevTrack backend listening on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`API base path: ${API_BASE_PATH}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
