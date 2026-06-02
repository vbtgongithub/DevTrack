export interface LearningResource {
  skill: string;
  whyLearn: string;
  estimatedTime: string;
  practiceProject: {
    title: string;
    description: string;
  };
  resources: Array<{
    title: string;
    type: 'docs' | 'course' | 'video' | 'article';
    url: string;
    provider: string;
  }>;
  isFallback?: boolean;
}

export const STATIC_RESOURCES: Record<string, LearningResource> = {
  'node.js': {
    skill: 'Node.js',
    whyLearn: 'Node.js is the foundation for building scalable, high-performance backend APIs using JavaScript.',
    estimatedTime: '2-3 Weeks',
    practiceProject: {
      title: 'RESTful API with Auth',
      description: 'Build a user authentication API with JWT, password hashing, and express-validator for input validation.'
    },
    resources: [
      { title: 'Node.js Official Documentation', type: 'docs', url: 'https://nodejs.org/en/docs/', provider: 'Official' },
      { title: 'Node.js Crash Course', type: 'video', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', provider: 'Traversy Media' },
      { title: 'Node.js and Express Tutorial', type: 'course', url: 'https://www.freecodecamp.org/news/free-8-hour-node-express-course/', provider: 'freeCodeCamp' }
    ]
  },
  'react': {
    skill: 'React',
    whyLearn: 'React is the industry standard for building dynamic, component-driven user interfaces.',
    estimatedTime: '3-4 Weeks',
    practiceProject: {
      title: 'E-commerce Dashboard',
      description: 'Build an interactive dashboard with state management, routing, and data fetching from a mock API.'
    },
    resources: [
      { title: 'React Official Documentation', type: 'docs', url: 'https://react.dev/', provider: 'Official' },
      { title: 'React Full Course for free', type: 'video', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', provider: 'freeCodeCamp' },
      { title: 'Epic React', type: 'course', url: 'https://epicreact.dev/', provider: 'Kent C. Dodds' }
    ]
  },
  'mongodb': {
    skill: 'MongoDB',
    whyLearn: 'MongoDB is a leading NoSQL database perfect for flexible, document-oriented data storage in modern web apps.',
    estimatedTime: '1-2 Weeks',
    practiceProject: {
      title: 'Blog CMS Database',
      description: 'Design a schema for users, posts, and comments, then implement CRUD operations using Mongoose.'
    },
    resources: [
      { title: 'MongoDB Manual', type: 'docs', url: 'https://www.mongodb.com/docs/manual/', provider: 'Official' },
      { title: 'MongoDB in 100 Seconds', type: 'video', url: 'https://www.youtube.com/watch?v=-bt_y4Loofg', provider: 'Fireship' },
      { title: 'MongoDB University Courses', type: 'course', url: 'https://learn.mongodb.com/', provider: 'Official' }
    ]
  },
  'docker': {
    skill: 'Docker',
    whyLearn: 'Required for deployment and containerization. Ensures your application runs consistently across any environment.',
    estimatedTime: '1-2 Weeks',
    practiceProject: {
      title: 'Containerize a Node.js REST API',
      description: 'Write a Dockerfile and docker-compose.yml to containerize a Node.js app alongside a Redis or MongoDB database.'
    },
    resources: [
      { title: 'Docker Official Docs', type: 'docs', url: 'https://docs.docker.com/', provider: 'Official' },
      { title: 'Docker Crash Course', type: 'video', url: 'https://www.youtube.com/watch?v=pg19Z8LL06w', provider: 'TechWorld with Nana' },
      { title: 'Docker for Beginners', type: 'course', url: 'https://www.freecodecamp.org/news/docker-crash-course-for-absolute-beginners/', provider: 'freeCodeCamp' }
    ]
  },
  'redis': {
    skill: 'Redis',
    whyLearn: 'Critical for high-performance applications. Used for caching, session storage, and message brokering to dramatically speed up APIs.',
    estimatedTime: '1 Week',
    practiceProject: {
      title: 'API Request Caching',
      description: 'Integrate Redis into an Express app to cache expensive database queries and third-party API calls.'
    },
    resources: [
      { title: 'Redis Documentation', type: 'docs', url: 'https://redis.io/docs/', provider: 'Official' },
      { title: 'Redis Crash Course', type: 'video', url: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ', provider: 'Traversy Media' },
      { title: 'Redis as a Database', type: 'article', url: 'https://redis.com/redis-enterprise/use-cases/redis-as-a-database/', provider: 'Redis' }
    ]
  },
  'ci/cd': {
    skill: 'CI/CD',
    whyLearn: 'Continuous Integration and Deployment automates testing and releases, ensuring code quality and rapid delivery.',
    estimatedTime: '2 Weeks',
    practiceProject: {
      title: 'Automated Deployment Pipeline',
      description: 'Set up GitHub Actions to automatically run unit tests and deploy a Dockerized app to a cloud provider on push to main.'
    },
    resources: [
      { title: 'GitHub Actions Documentation', type: 'docs', url: 'https://docs.github.com/en/actions', provider: 'GitHub' },
      { title: 'CI/CD Pipeline with GitHub Actions', type: 'video', url: 'https://www.youtube.com/watch?v=R8_veQiYBjI', provider: 'TechWorld with Nana' },
      { title: 'Continuous Integration', type: 'article', url: 'https://martinfowler.com/articles/continuousIntegration.html', provider: 'Martin Fowler' }
    ]
  },
  'testing': {
    skill: 'Testing',
    whyLearn: 'Automated testing prevents regressions and ensures code reliability, an absolute must for senior-level engineering.',
    estimatedTime: '2-3 Weeks',
    practiceProject: {
      title: 'TDD API Development',
      description: 'Build an API strictly using Test-Driven Development (TDD) with Jest and Supertest, achieving 80%+ coverage.'
    },
    resources: [
      { title: 'Jest Documentation', type: 'docs', url: 'https://jestjs.io/docs/getting-started', provider: 'Official' },
      { title: 'Testing Node.js with Jest', type: 'video', url: 'https://www.youtube.com/watch?v=FgnxcUQ5vho', provider: 'Web Dev Simplified' },
      { title: 'JavaScript Testing Best Practices', type: 'article', url: 'https://github.com/goldbergyoni/javascript-testing-best-practices', provider: 'Yoni Goldberg' }
    ]
  },
  'system design': {
    skill: 'System Design',
    whyLearn: 'Essential for architecting large-scale, distributed systems and passing senior technical interviews.',
    estimatedTime: '4-8 Weeks',
    practiceProject: {
      title: 'Design a URL Shortener',
      description: 'Architect a highly available, scalable URL shortener (like bit.ly) addressing load balancing, database sharding, and caching.'
    },
    resources: [
      { title: 'System Design Primer', type: 'article', url: 'https://github.com/donnemartin/system-design-primer', provider: 'GitHub' },
      { title: 'Grokking the System Design Interview', type: 'course', url: 'https://www.educative.io/courses/grokking-the-system-design-interview', provider: 'Educative' },
      { title: 'System Design Interview Channel', type: 'video', url: 'https://www.youtube.com/c/SystemDesignInterview', provider: 'ByteByteGo' }
    ]
  },
  'typescript': {
    skill: 'TypeScript',
    whyLearn: 'Provides static typing to JavaScript, catching errors at compile-time and significantly improving DX and code maintainability.',
    estimatedTime: '2 Weeks',
    practiceProject: {
      title: 'Migrate a JS Project to TS',
      description: 'Take an existing JavaScript project and migrate it to TypeScript, creating custom interfaces for all data models.'
    },
    resources: [
      { title: 'TypeScript Handbook', type: 'docs', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', provider: 'Official' },
      { title: 'TypeScript Course for Beginners', type: 'video', url: 'https://www.youtube.com/watch?v=d56mG7DezGs', provider: 'freeCodeCamp' },
      { title: 'Total TypeScript', type: 'course', url: 'https://www.totaltypescript.com/', provider: 'Matt Pocock' }
    ]
  },
  'python': {
    skill: 'Python',
    whyLearn: 'The dominant language for AI, machine learning, and data engineering, known for its readability and massive ecosystem.',
    estimatedTime: '3-4 Weeks',
    practiceProject: {
      title: 'Data Analysis Pipeline',
      description: 'Write a Python script using Pandas to ingest CSV data, clean it, and output statistical summaries and visualizations.'
    },
    resources: [
      { title: 'Python Official Tutorial', type: 'docs', url: 'https://docs.python.org/3/tutorial/index.html', provider: 'Official' },
      { title: 'Python for Beginners', type: 'video', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', provider: 'Programming with Mosh' },
      { title: '100 Days of Code: The Complete Python Pro Bootcamp', type: 'course', url: 'https://www.udemy.com/course/100-days-of-code/', provider: 'Udemy' }
    ]
  }
};

export function getResourceForSkill(skill: string): LearningResource {
  if (!skill) {
    return {
      skill: '',
      whyLearn: '',
      estimatedTime: '',
      practiceProject: { title: '', description: '' },
      resources: [],
      isFallback: true
    };
  }
  
  const normalized = skill.toLowerCase().trim();
  if (STATIC_RESOURCES[normalized]) {
    return STATIC_RESOURCES[normalized];
  }
  
  // Fallback
  return {
    skill: skill,
    whyLearn: 'This skill is important for your target career path and was identified as a roadmap priority.',
    estimatedTime: 'Varies',
    practiceProject: {
      title: 'Community Resource Fallback',
      description: 'We do not have a curated project for this skill yet. Consider searching GitHub for beginner projects or asking the community.'
    },
    resources: [
      {
        title: 'Google Search',
        type: 'article',
        url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}`,
        provider: 'Google'
      },
      {
        title: 'YouTube Search',
        type: 'video',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial')}`,
        provider: 'YouTube'
      },
      {
        title: 'Official Documentation Search',
        type: 'docs',
        url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation')}`,
        provider: 'Official Docs'
      }
    ],
    isFallback: true
  };
}
