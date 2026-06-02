import { logger } from '../../../shared/logger.js';

export interface SkillNode {
  nodeId: string;
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'database' | 'infrastructure' | 'cloud' | 'tooling' | 'system-design';
  dependencies: string[]; // nodeIds
  roleRelevance: string[]; // e.g., 'Backend Engineer', 'Full Stack'
  marketRelevance: 'critical' | 'high' | 'medium' | 'low';
  maturityWeighting: number; // 0-100
  verificationRules: {
    requiresProjectEvidence?: boolean;
    requiresDependency?: string[]; // e.g. ['redis', 'bullmq']
    requiresDeployment?: boolean;
    requiresInfraEvidence?: string[]; // e.g. ['hasDocker', 'hasRedis']
    requiresCommitDepth?: number;
  };
  evidenceMappings: {
    dependencyPatterns: string[];
    filePatterns: string[];
    infraSignals: string[];
  };
  description: string;
}

// Comprehensive seed graph based on roadmap.sh topology
// Normalized into DevTrack's deterministic skill graph structure
const SEED_GRAPH: SkillNode[] = [
  // === FOUNDATIONAL ===
  {
    nodeId: 'js-ts-fundamentals',
    name: 'JavaScript / TypeScript Fundamentals',
    category: 'frontend',
    dependencies: [],
    roleRelevance: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 10,
    verificationRules: { requiresProjectEvidence: true, requiresCommitDepth: 10 },
    evidenceMappings: {
      dependencyPatterns: ['typescript', '@types/', 'eslint'],
      filePatterns: ['tsconfig.json', '.eslintrc'],
      infraSignals: []
    },
    description: 'Core JavaScript and TypeScript language fundamentals'
  },
  {
    nodeId: 'git-version-control',
    name: 'Git & Version Control',
    category: 'tooling',
    dependencies: [],
    roleRelevance: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'DevOps Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 5,
    verificationRules: { requiresProjectEvidence: true, requiresCommitDepth: 5 },
    evidenceMappings: {
      dependencyPatterns: [],
      filePatterns: ['.git/', 'README.md'],
      infraSignals: []
    },
    description: 'Git version control and collaboration workflows'
  },
  
  // === FRONTEND ===
  {
    nodeId: 'react-foundations',
    name: 'React Ecosystem',
    category: 'frontend',
    dependencies: ['js-ts-fundamentals'],
    roleRelevance: ['Frontend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['react', '@types/react'] },
    evidenceMappings: {
      dependencyPatterns: ['react', 'react-dom', '@types/react'],
      filePatterns: ['package.json', 'src/', 'components/'],
      infraSignals: []
    },
    description: 'React component architecture and state management'
  },
  {
    nodeId: 'vue-foundations',
    name: 'Vue.js Ecosystem',
    category: 'frontend',
    dependencies: ['js-ts-fundamentals'],
    roleRelevance: ['Frontend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['vue', '@vue/'] },
    evidenceMappings: {
      dependencyPatterns: ['vue', 'vue-router', 'pinia'],
      filePatterns: ['src/', 'components/', 'views/'],
      infraSignals: []
    },
    description: 'Vue.js component architecture and composition API'
  },
  {
    nodeId: 'css-styling',
    name: 'CSS & Modern Styling',
    category: 'frontend',
    dependencies: ['js-ts-fundamentals'],
    roleRelevance: ['Frontend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 15,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['tailwindcss', 'styled-components', 'sass'] },
    evidenceMappings: {
      dependencyPatterns: ['tailwindcss', 'styled-components', 'sass', 'postcss'],
      filePatterns: ['.css', '.scss', 'tailwind.config'],
      infraSignals: []
    },
    description: 'CSS, Tailwind, styled-components, and modern styling systems'
  },
  {
    nodeId: 'state-management',
    name: 'State Management',
    category: 'frontend',
    dependencies: ['react-foundations'],
    roleRelevance: ['Frontend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 20,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['redux', 'zustand', 'jotai', 'recoil'] },
    evidenceMappings: {
      dependencyPatterns: ['redux', 'zustand', 'jotai', 'recoil', '@reduxjs'],
      filePatterns: ['store/', 'redux/', 'state/'],
      infraSignals: []
    },
    description: 'Redux, Zustand, and client-side state management patterns'
  },
  
  // === BACKEND ===
  {
    nodeId: 'node-apis',
    name: 'Node.js & REST APIs',
    category: 'backend',
    dependencies: ['js-ts-fundamentals'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['express', 'nestjs', 'fastify'] },
    evidenceMappings: {
      dependencyPatterns: ['express', 'nestjs', 'fastify', '@nestjs/', '@fastify/'],
      filePatterns: ['routes/', 'controllers/', 'src/'],
      infraSignals: []
    },
    description: 'Node.js server frameworks and REST API design'
  },
  {
    nodeId: 'api-design',
    name: 'API Design Patterns',
    category: 'backend',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 20,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['express', 'nestjs'] },
    evidenceMappings: {
      dependencyPatterns: ['express', 'nestjs', 'openapi', 'swagger'],
      filePatterns: ['routes/', 'controllers/', 'dto/', 'openapi.yaml'],
      infraSignals: []
    },
    description: 'REST API design, OpenAPI/Swagger, and API versioning'
  },
  {
    nodeId: 'graphql-apis',
    name: 'GraphQL APIs',
    category: 'backend',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['graphql', '@apollo/', 'apollo-server'] },
    evidenceMappings: {
      dependencyPatterns: ['graphql', '@apollo/', 'apollo-server', '@graphql-tools'],
      filePatterns: ['resolvers/', 'schema.graphql', 'typeDefs/'],
      infraSignals: []
    },
    description: 'GraphQL schema design, resolvers, and Apollo integration'
  },
  {
    nodeId: 'authentication',
    name: 'Authentication & Authorization',
    category: 'backend',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['passport', 'jsonwebtoken', 'bcrypt'] },
    evidenceMappings: {
      dependencyPatterns: ['passport', 'jsonwebtoken', 'bcrypt', 'auth0', 'firebase-auth'],
      filePatterns: ['auth/', 'middleware/', 'passport/'],
      infraSignals: ['hasAuthSystem']
    },
    description: 'JWT, OAuth, session management, and authorization patterns'
  },
  
  // === DATABASE ===
  {
    nodeId: 'sql-databases',
    name: 'SQL Databases',
    category: 'database',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['pg', 'mysql2', 'sequelize', 'typeorm'] },
    evidenceMappings: {
      dependencyPatterns: ['pg', 'mysql2', 'sequelize', 'typeorm', '@prisma/client'],
      filePatterns: ['migrations/', 'models/', 'entities/', 'prisma/'],
      infraSignals: ['hasPostgreSQL', 'hasMySQL']
    },
    description: 'PostgreSQL, MySQL, and relational database design'
  },
  {
    nodeId: 'nosql-databases',
    name: 'NoSQL Databases',
    category: 'database',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 25,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['mongoose', 'mongodb'] },
    evidenceMappings: {
      dependencyPatterns: ['mongoose', 'mongodb', 'mongodb-driver'],
      filePatterns: ['models/', 'schemas/', 'mongo/'],
      infraSignals: ['hasMongoDB']
    },
    description: 'MongoDB, document modeling, and NoSQL patterns'
  },
  {
    nodeId: 'redis-caching',
    name: 'Redis & Caching',
    category: 'database',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['redis', 'ioredis', '@redis/client'] },
    evidenceMappings: {
      dependencyPatterns: ['redis', 'ioredis', '@redis/client', 'redis-mock'],
      filePatterns: ['cache/', 'redis/'],
      infraSignals: ['hasRedis', 'hasCaching']
    },
    description: 'Redis caching, session storage, and pub/sub patterns'
  },
  {
    nodeId: 'orm-odm',
    name: 'ORM/ODM Patterns',
    category: 'database',
    dependencies: ['sql-databases', 'nosql-databases'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 20,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['typeorm', 'sequelize', 'mongoose', 'prisma'] },
    evidenceMappings: {
      dependencyPatterns: ['typeorm', 'sequelize', 'mongoose', '@prisma/client'],
      filePatterns: ['entities/', 'models/', 'schemas/', 'prisma/'],
      infraSignals: []
    },
    description: 'TypeORM, Sequelize, Mongoose, and Prisma patterns'
  },
  
  // === SYSTEM DESIGN ===
  {
    nodeId: 'queue-systems',
    name: 'Message Queues',
    category: 'system-design',
    dependencies: ['redis-caching'],
    roleRelevance: ['Backend Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 35,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['bullmq', 'amqplib', 'kafkajs'], requiresInfraEvidence: ['hasQueueSystems'] },
    evidenceMappings: {
      dependencyPatterns: ['bullmq', 'amqplib', 'kafkajs', '@aws-sdk/client-sqs'],
      filePatterns: ['queues/', 'jobs/', 'workers/'],
      infraSignals: ['hasBullMQ', 'hasRabbitMQ', 'hasKafka', 'hasSQS', 'hasQueueSystems']
    },
    description: 'BullMQ, RabbitMQ, Kafka, and async job processing'
  },
  {
    nodeId: 'realtime-communication',
    name: 'Real-time Communication',
    category: 'system-design',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['socket.io', 'ws'], requiresInfraEvidence: ['hasSSEWebSockets'] },
    evidenceMappings: {
      dependencyPatterns: ['socket.io', 'ws', 'websocket', 'webrtc'],
      filePatterns: ['socket/', 'websocket/', 'events/'],
      infraSignals: ['hasSocketIO', 'hasSSEWebSockets', 'hasWebRTC']
    },
    description: 'WebSockets, Socket.IO, and real-time event systems'
  },
  {
    nodeId: 'caching-strategies',
    name: 'Caching Strategies',
    category: 'system-design',
    dependencies: ['redis-caching'],
    roleRelevance: ['Backend Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['redis', 'ioredis'], requiresInfraEvidence: ['hasCaching'] },
    evidenceMappings: {
      dependencyPatterns: ['redis', 'ioredis', 'node-cache', 'lru-cache'],
      filePatterns: ['cache/', 'redis/'],
      infraSignals: ['hasRedis', 'hasMemcached', 'hasCaching']
    },
    description: 'Multi-layer caching, cache invalidation, and performance optimization'
  },
  
  // === DEVOPS ===
  {
    nodeId: 'docker-containerization',
    name: 'Docker & Containerization',
    category: 'devops',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDeployment: true, requiresInfraEvidence: ['hasDocker'] },
    evidenceMappings: {
      dependencyPatterns: [],
      filePatterns: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'],
      infraSignals: ['hasDocker']
    },
    description: 'Docker containerization and multi-stage builds'
  },
  {
    nodeId: 'ci-cd-pipelines',
    name: 'CI/CD Pipelines',
    category: 'devops',
    dependencies: ['docker-containerization'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 35,
    verificationRules: { requiresProjectEvidence: true, requiresDeployment: true, requiresInfraEvidence: ['hasDeploymentPipelines'] },
    evidenceMappings: {
      dependencyPatterns: [],
      filePatterns: ['.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile', 'circleci/'],
      infraSignals: ['hasDeploymentPipelines']
    },
    description: 'GitHub Actions, GitLab CI, and automated deployment pipelines'
  },
  {
    nodeId: 'kubernetes-orchestration',
    name: 'Kubernetes Orchestration',
    category: 'devops',
    dependencies: ['docker-containerization'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 40,
    verificationRules: { requiresProjectEvidence: true, requiresDeployment: true, requiresInfraEvidence: ['hasKubernetes'] },
    evidenceMappings: {
      dependencyPatterns: [],
      filePatterns: ['kubernetes/', 'k8s/', 'deployment.yaml', 'service.yaml'],
      infraSignals: ['hasKubernetes', 'hasInfraOrchestration']
    },
    description: 'Kubernetes deployments, services, and orchestration'
  },
  
  // === CLOUD ===
  {
    nodeId: 'cloud-providers',
    name: 'Cloud Providers',
    category: 'cloud',
    dependencies: ['docker-containerization'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 35,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['aws-sdk', '@aws-sdk/', '@google-cloud/', 'azure'], requiresInfraEvidence: ['hasInfraOrchestration'] },
    evidenceMappings: {
      dependencyPatterns: ['aws-sdk', '@aws-sdk/client-', '@google-cloud/', 'azure'],
      filePatterns: [],
      infraSignals: ['hasInfraOrchestration']
    },
    description: 'AWS, GCP, Azure cloud services and serverless'
  },
  {
    nodeId: 'serverless',
    name: 'Serverless Architecture',
    category: 'cloud',
    dependencies: ['cloud-providers'],
    roleRelevance: ['Backend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'medium',
    maturityWeighting: 35,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['serverless', 'aws-lambda'], requiresInfraEvidence: ['hasInfraOrchestration'] },
    evidenceMappings: {
      dependencyPatterns: ['serverless', 'aws-lambda', '@aws-sdk/client-lambda'],
      filePatterns: ['serverless.yml', 'lambda/'],
      infraSignals: ['hasInfraOrchestration']
    },
    description: 'AWS Lambda, serverless functions, and FaaS patterns'
  },
  
  // === MONITORING ===
  {
    nodeId: 'monitoring-observability',
    name: 'Monitoring & Observability',
    category: 'infrastructure',
    dependencies: ['node-apis'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['@sentry/node', 'datadog-metrics', 'prometheus'], requiresInfraEvidence: ['hasMonitoring'] },
    evidenceMappings: {
      dependencyPatterns: ['@sentry/node', 'datadog-metrics', 'prometheus', 'winston', 'pino'],
      filePatterns: ['prometheus.yml', 'datadog.json', 'sentry.js'],
      infraSignals: ['hasMonitoring', 'hasLogging', 'hasTracing', 'hasMetrics']
    },
    description: 'Application monitoring, logging, tracing, and error tracking'
  },
  {
    nodeId: 'performance-optimization',
    name: 'Performance Optimization',
    category: 'infrastructure',
    dependencies: ['monitoring-observability', 'caching-strategies'],
    roleRelevance: ['Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer'],
    marketRelevance: 'high',
    maturityWeighting: 35,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['lighthouse', 'webpack', 'vite'] },
    evidenceMappings: {
      dependencyPatterns: ['lighthouse', 'webpack', 'vite', 'rollup'],
      filePatterns: ['webpack.config.js', 'vite.config.ts', '.lighthouserc'],
      infraSignals: []
    },
    description: 'Performance profiling, optimization, and load testing'
  },
  
  // === SECURITY ===
  {
    nodeId: 'security-fundamentals',
    name: 'Security Fundamentals',
    category: 'infrastructure',
    dependencies: ['authentication'],
    roleRelevance: ['Backend Engineer', 'DevOps Engineer', 'Full Stack Engineer'],
    marketRelevance: 'critical',
    maturityWeighting: 30,
    verificationRules: { requiresProjectEvidence: true, requiresDependency: ['helmet', 'cors', 'bcrypt', 'crypto'], requiresInfraEvidence: ['hasAuthSystem', 'hasEncryption'] },
    evidenceMappings: {
      dependencyPatterns: ['helmet', 'cors', 'bcrypt', 'crypto', 'argon2'],
      filePatterns: ['.env.example', 'security.md', 'auth.config.js'],
      infraSignals: ['hasAuthSystem', 'hasRateLimiting', 'hasEncryption']
    },
    description: 'OWASP security, encryption, rate limiting, and secure coding'
  },
];

export const SkillGraphNormalizationLayer = {
  /**
   * Get the complete skill graph
   */
  getGraph(): SkillNode[] {
    return SEED_GRAPH;
  },

  /**
   * Get a specific skill node by ID
   */
  getNode(nodeId: string): SkillNode | undefined {
    return SEED_GRAPH.find(n => n.nodeId === nodeId);
  },

  /**
   * Get direct dependencies for a node
   */
  getDependencies(nodeId: string): SkillNode[] {
    const node = this.getNode(nodeId);
    if (!node) return [];
    return node.dependencies.map(id => this.getNode(id)).filter((n): n is SkillNode => n !== undefined);
  },

  /**
   * Get all transitive dependencies (recursive)
   */
  getAllDependencies(nodeId: string, visited = new Set<string>()): SkillNode[] {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    
    const directDeps = this.getDependencies(nodeId);
    const transitiveDeps: SkillNode[] = [];
    
    for (const dep of directDeps) {
      transitiveDeps.push(dep);
      transitiveDeps.push(...this.getAllDependencies(dep.nodeId, visited));
    }
    
    return transitiveDeps;
  },

  /**
   * Get missing dependencies for a target node given verified nodes
   */
  getMissingDependencies(verifiedNodeIds: Set<string>, targetNodeId: string): string[] {
    const missing: string[] = [];
    const deps = this.getAllDependencies(targetNodeId);
    
    for (const dep of deps) {
      if (!verifiedNodeIds.has(dep.nodeId)) {
        missing.push(dep.nodeId);
      }
    }
    
    return [...new Set(missing)]; // deduplicate
  },

  /**
   * Get nodes filtered by role relevance
   */
  getNodesByRole(role: string): SkillNode[] {
    return SEED_GRAPH.filter(node => 
      node.roleRelevance.some(r => r.toLowerCase().includes(role.toLowerCase()))
    );
  },

  /**
   * Get nodes filtered by category
   */
  getNodesByCategory(category: SkillNode['category']): SkillNode[] {
    return SEED_GRAPH.filter(node => node.category === category);
  },

  /**
   * Get nodes filtered by market relevance
   */
  getNodesByMarketRelevance(relevance: SkillNode['marketRelevance']): SkillNode[] {
    return SEED_GRAPH.filter(node => node.marketRelevance === relevance);
  },

  /**
   * Get next recommended nodes based on verified nodes
   */
  getNextRecommendedNodes(verifiedNodeIds: Set<string>, limit = 5): SkillNode[] {
    const candidates: Array<{ node: SkillNode; score: number }> = [];
    
    for (const node of SEED_GRAPH) {
      if (verifiedNodeIds.has(node.nodeId)) continue;
      
      const deps = this.getDependencies(node.nodeId);
      const verifiedDeps = deps.filter(d => verifiedNodeIds.has(d.nodeId));
      
      // Score based on how many dependencies are verified
      const dependencyScore = deps.length > 0 ? verifiedDeps.length / deps.length : 1;
      const marketScore = node.marketRelevance === 'critical' ? 1.5 : node.marketRelevance === 'high' ? 1.2 : 1;
      const maturityScore = node.maturityWeighting / 100;
      
      candidates.push({
        node,
        score: dependencyScore * marketScore * maturityScore
      });
    }
    
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => c.node);
  },

  /**
   * Calculate completion percentage for a role
   */
  calculateRoleCompletion(role: string, verifiedNodeIds: Set<string>): number {
    const roleNodes = this.getNodesByRole(role);
    if (roleNodes.length === 0) return 0;
    
    const verifiedRoleNodes = roleNodes.filter(node => verifiedNodeIds.has(node.nodeId));
    const totalWeight = roleNodes.reduce((sum, node) => sum + node.maturityWeighting, 0);
    const verifiedWeight = verifiedRoleNodes.reduce((sum, node) => sum + node.maturityWeighting, 0);
    
    return totalWeight > 0 ? Math.round((verifiedWeight / totalWeight) * 100) : 0;
  },

  /**
   * Get graph statistics
   */
  getGraphStats(): {
    totalNodes: number;
    nodesByCategory: Record<string, number>;
    nodesByMarketRelevance: Record<string, number>;
    averageMaturityWeighting: number;
  } {
    const nodesByCategory: Record<string, number> = {};
    const nodesByMarketRelevance: Record<string, number> = {};
    let totalMaturityWeighting = 0;
    
    SEED_GRAPH.forEach(node => {
      nodesByCategory[node.category] = (nodesByCategory[node.category] || 0) + 1;
      nodesByMarketRelevance[node.marketRelevance] = (nodesByMarketRelevance[node.marketRelevance] || 0) + 1;
      totalMaturityWeighting += node.maturityWeighting;
    });
    
    return {
      totalNodes: SEED_GRAPH.length,
      nodesByCategory,
      nodesByMarketRelevance,
      averageMaturityWeighting: totalMaturityWeighting / SEED_GRAPH.length
    };
  },
};
