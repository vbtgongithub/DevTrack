import { logger } from '../../../shared/logger.js';

export interface SystemDesignSignals {
  // Caching Systems
  hasRedis: boolean;
  hasMemcached: boolean;
  hasCaching: boolean;
  
  // Queue Systems
  hasBullMQ: boolean;
  hasRabbitMQ: boolean;
  hasKafka: boolean;
  hasSQS: boolean;
  hasQueueSystems: boolean;
  
  // Real-time Communication
  hasSSEWebSockets: boolean;
  hasSocketIO: boolean;
  hasWebRTC: boolean;
  
  // Containerization & Deployment
  hasDocker: boolean;
  hasKubernetes: boolean;
  hasDeploymentPipelines: boolean;
  hasInfraOrchestration: boolean;
  
  // Monitoring & Observability
  hasMonitoring: boolean;
  hasLogging: boolean;
  hasTracing: boolean;
  hasMetrics: boolean;
  
  // CDN & Edge
  hasCDN: boolean;
  hasEdgeComputing: boolean;
  
  // Database Systems
  hasPostgreSQL: boolean;
  hasMongoDB: boolean;
  hasMySQL: boolean;
  hasElasticsearch: boolean;
  
  // API Design
  hasGraphQL: boolean;
  hasREST: boolean;
  hasgRPC: boolean;
  
  // Security
  hasAuthSystem: boolean;
  hasRateLimiting: boolean;
  hasEncryption: boolean;
}

export const SystemDesignSignalExtractor = {
  /**
   * Extracts comprehensive infrastructure and system design maturity from repository artifacts.
   * Explicitly avoids self-declared skills - only verified engineering artifacts count.
   */
  extractSignals(repositories: any[]): SystemDesignSignals {
    const signals: SystemDesignSignals = {
      // Caching Systems
      hasRedis: false,
      hasMemcached: false,
      hasCaching: false,
      
      // Queue Systems
      hasBullMQ: false,
      hasRabbitMQ: false,
      hasKafka: false,
      hasSQS: false,
      hasQueueSystems: false,
      
      // Real-time Communication
      hasSSEWebSockets: false,
      hasSocketIO: false,
      hasWebRTC: false,
      
      // Containerization & Deployment
      hasDocker: false,
      hasKubernetes: false,
      hasDeploymentPipelines: false,
      hasInfraOrchestration: false,
      
      // Monitoring & Observability
      hasMonitoring: false,
      hasLogging: false,
      hasTracing: false,
      hasMetrics: false,
      
      // CDN & Edge
      hasCDN: false,
      hasEdgeComputing: false,
      
      // Database Systems
      hasPostgreSQL: false,
      hasMongoDB: false,
      hasMySQL: false,
      hasElasticsearch: false,
      
      // API Design
      hasGraphQL: false,
      hasREST: false,
      hasgRPC: false,
      
      // Security
      hasAuthSystem: false,
      hasRateLimiting: false,
      hasEncryption: false,
    };

    repositories.forEach(repo => {
      const deps = repo.dependencies || [];
      const files = repo.files || [];
      const devDeps = repo.devDependencies || [];
      const scripts = repo.scripts || {};
      
      // Detect Caching Systems
      this.detectCachingSignals(deps, signals);
      
      // Detect Queue Systems
      this.detectQueueSignals(deps, signals);
      
      // Detect Real-time Communication
      this.detectRealtimeSignals(deps, signals);
      
      // Detect Containerization & Deployment
      this.detectDeploymentSignals(files, deps, scripts, signals);
      
      // Detect Monitoring & Observability
      this.detectMonitoringSignals(deps, devDeps, files, signals);
      
      // Detect CDN & Edge
      this.detectCDNSignals(deps, files, signals);
      
      // Detect Database Systems
      this.detectDatabaseSignals(deps, signals);
      
      // Detect API Design Patterns
      this.detectAPISignals(deps, files, signals);
      
      // Detect Security Patterns
      this.detectSecuritySignals(deps, files, signals);
    });

    return signals;
  },

  /**
   * Detect caching system signals
   */
  detectCachingSignals(deps: string[], signals: SystemDesignSignals): void {
    const cacheDeps = ['redis', 'ioredis', 'redis-mock', '@redis/client', 'memcached', 'node-cache', 'lru-cache'];
    
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      if (normalized.includes('redis')) {
        signals.hasRedis = true;
        signals.hasCaching = true;
      }
      if (normalized.includes('memcached')) {
        signals.hasMemcached = true;
        signals.hasCaching = true;
      }
      if (cacheDeps.some(cache => normalized.includes(cache))) {
        signals.hasCaching = true;
      }
    });
  },

  /**
   * Detect queue system signals
   */
  detectQueueSignals(deps: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      if (normalized.includes('bullmq')) {
        signals.hasBullMQ = true;
        signals.hasQueueSystems = true;
      }
      if (normalized.includes('amqplib') || normalized.includes('rabbitmq')) {
        signals.hasRabbitMQ = true;
        signals.hasQueueSystems = true;
      }
      if (normalized.includes('kafka') || normalized.includes('kafkajs')) {
        signals.hasKafka = true;
        signals.hasQueueSystems = true;
      }
      if (normalized.includes('sqs') || normalized.includes('aws-sdk')) {
        signals.hasSQS = true;
        signals.hasQueueSystems = true;
      }
    });
  },

  /**
   * Detect real-time communication signals
   */
  detectRealtimeSignals(deps: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      if (normalized.includes('socket.io')) {
        signals.hasSocketIO = true;
        signals.hasSSEWebSockets = true;
      }
      if (normalized.includes('ws') || normalized.includes('websocket')) {
        signals.hasSSEWebSockets = true;
      }
      if (normalized.includes('webrtc') || normalized.includes('simple-peer')) {
        signals.hasWebRTC = true;
        signals.hasSSEWebSockets = true;
      }
    });
  },

  /**
   * Detect deployment and containerization signals
   */
  detectDeploymentSignals(files: string[], deps: string[], scripts: any, signals: SystemDesignSignals): void {
    // Docker detection
    const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'];
    if (dockerFiles.some(file => files.includes(file))) {
      signals.hasDocker = true;
    }
    
    // Kubernetes detection
    const k8sFiles = ['kubernetes/', 'k8s/', 'deployment.yaml', 'service.yaml'];
    if (k8sFiles.some(file => files.some(f => f.includes(file)))) {
      signals.hasKubernetes = true;
      signals.hasInfraOrchestration = true;
    }
    
    // CI/CD detection
    const ciFiles = ['.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile', 'circleci/'];
    if (ciFiles.some(file => files.some(f => f.includes(file)))) {
      signals.hasDeploymentPipelines = true;
    }
    
    // Infrastructure as Code
    const iacDeps = ['terraform', 'pulumi', 'aws-cdk', 'serverless'];
    if (iacDeps.some(dep => deps.some(d => d.toLowerCase().includes(dep)))) {
      signals.hasInfraOrchestration = true;
    }
    
    // Cloud providers
    const cloudDeps = ['aws-sdk', '@aws-sdk/client-', 'gcp', '@google-cloud/', 'azure'];
    if (cloudDeps.some(dep => deps.some(d => d.toLowerCase().includes(dep)))) {
      signals.hasInfraOrchestration = true;
    }
  },

  /**
   * Detect monitoring and observability signals
   */
  detectMonitoringSignals(deps: string[], devDeps: string[], files: string[], signals: SystemDesignSignals): void {
    const allDeps = [...deps, ...devDeps];
    
    allDeps.forEach(dep => {
      const normalized = dep.toLowerCase();
      
      // Monitoring
      if (normalized.includes('datadog') || normalized.includes('prometheus') || 
          normalized.includes('newrelic') || normalized.includes('appdynamics')) {
        signals.hasMonitoring = true;
        signals.hasMetrics = true;
      }
      
      // Logging
      if (normalized.includes('winston') || normalized.includes('pino') || 
          normalized.includes('bunyan') || normalized.includes('morgan')) {
        signals.hasLogging = true;
      }
      
      // Tracing
      if (normalized.includes('jaeger') || normalized.includes('zipkin') || 
          normalized.includes('opentelemetry') || normalized.includes('@opentelemetry/')) {
        signals.hasTracing = true;
        signals.hasMonitoring = true;
      }
      
      // Error tracking
      if (normalized.includes('sentry') || normalized.includes('bugsnag') || 
          normalized.includes('rollbar')) {
        signals.hasMonitoring = true;
      }
    });
    
    // Check for monitoring configuration files
    const monitoringFiles = ['prometheus.yml', 'datadog.json', 'sentry.js'];
    if (monitoringFiles.some(file => files.includes(file))) {
      signals.hasMonitoring = true;
    }
  },

  /**
   * Detect CDN and edge computing signals
   */
  detectCDNSignals(deps: string[], files: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      if (normalized.includes('cloudflare') || normalized.includes('fastly') || 
          normalized.includes('akamai') || normalized.includes('cdn')) {
        signals.hasCDN = true;
      }
      if (normalized.includes('cloudflare-workers') || normalized.includes('vercel') || 
          normalized.includes('netlify') || normalized.includes('edge-')) {
        signals.hasEdgeComputing = true;
        signals.hasCDN = true;
      }
    });
    
    // Check for CDN configuration
    const cdnFiles = ['vercel.json', 'netlify.toml', '_redirects'];
    if (cdnFiles.some(file => files.includes(file))) {
      signals.hasCDN = true;
    }
  },

  /**
   * Detect database system signals
   */
  detectDatabaseSignals(deps: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      
      if (normalized.includes('pg') || normalized.includes('postgres') || 
          normalized.includes('postgresql')) {
        signals.hasPostgreSQL = true;
      }
      if (normalized.includes('mongoose') || normalized.includes('mongodb') || 
          normalized.includes('mongodb-driver')) {
        signals.hasMongoDB = true;
      }
      if (normalized.includes('mysql') || normalized.includes('mysql2')) {
        signals.hasMySQL = true;
      }
      if (normalized.includes('elasticsearch') || normalized.includes('@elastic/elasticsearch')) {
        signals.hasElasticsearch = true;
      }
    });
  },

  /**
   * Detect API design pattern signals
   */
  detectAPISignals(deps: string[], files: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      
      if (normalized.includes('graphql') || normalized.includes('apollo')) {
        signals.hasGraphQL = true;
      }
      if (normalized.includes('express') || normalized.includes('fastify') || 
          normalized.includes('koa') || normalized.includes('rest')) {
        signals.hasREST = true;
      }
      if (normalized.includes('grpc') || normalized.includes('@grpc')) {
        signals.hasgRPC = true;
      }
    });
    
    // Check for API definition files
    const apiFiles = ['openapi.yaml', 'swagger.yaml', 'graphql.schema'];
    if (apiFiles.some(file => files.includes(file))) {
      signals.hasREST = true;
    }
  },

  /**
   * Detect security pattern signals
   */
  detectSecuritySignals(deps: string[], files: string[], signals: SystemDesignSignals): void {
    deps.forEach(dep => {
      const normalized = dep.toLowerCase();
      
      // Authentication
      if (normalized.includes('passport') || normalized.includes('jsonwebtoken') || 
          normalized.includes('auth0') || normalized.includes('firebase-auth')) {
        signals.hasAuthSystem = true;
      }
      
      // Rate limiting
      if (normalized.includes('rate-limiter') || normalized.includes('express-rate-limit') || 
          normalized.includes('redis-rate-limit')) {
        signals.hasRateLimiting = true;
      }
      
      // Encryption
      if (normalized.includes('crypto') || normalized.includes('bcrypt') || 
          normalized.includes('argon2') || normalized.includes('encryption')) {
        signals.hasEncryption = true;
      }
    });
    
    // Check for security configuration files
    const securityFiles = ['.env.example', 'security.md', 'auth.config.js'];
    if (securityFiles.some(file => files.includes(file))) {
      signals.hasAuthSystem = true;
    }
  },
};
