export const ROLE_SKILL_MATRIX: Record<string, string[]> = {
  'Backend Developer': [
    'Node.js',
    'Express',
    'MongoDB',
    'SQL',
    'Docker',
    'Redis',
    'Testing',
    'CI/CD',
    'System Design',
    'Authentication',
    'Caching'
  ],
  'Frontend Developer': [
    'React',
    'JavaScript',
    'TypeScript',
    'CSS',
    'HTML',
    'Tailwind CSS',
    'Next.js',
    'Redux',
    'Webpack',
    'Testing',
    'Accessibility'
  ],
  'Full Stack Developer': [
    'React',
    'Node.js',
    'Express',
    'MongoDB',
    'SQL',
    'TypeScript',
    'Docker',
    'Redis',
    'Testing',
    'CI/CD',
    'HTML',
    'CSS',
    'Tailwind CSS'
  ],
  'DevOps Engineer': [
    'Docker',
    'Kubernetes',
    'CI/CD',
    'Jenkins',
    'GitHub Actions',
    'AWS',
    'GCP',
    'Prometheus',
    'Grafana',
    'Terraform',
    'Linux'
  ],
  'AI Engineer': [
    'Python',
    'PyTorch',
    'TensorFlow',
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'LLMs',
    'Vector Databases',
    'OpenAI',
    'Data Pipelines'
  ],
  'Data Analyst': [
    'SQL',
    'Python',
    'Pandas',
    'NumPy',
    'Tableau',
    'Power BI',
    'Excel',
    'Data Visualization',
    'Statistics',
    'Data Cleaning'
  ],
  'Mobile Developer': [
    'React Native',
    'Flutter',
    'Swift',
    'Kotlin',
    'iOS',
    'Android',
    'Mobile Design',
    'API Integration',
    'Testing',
    'App Store Deployment'
  ]
};

export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const s = skill.trim().toLowerCase();
  
  const mappings: Record<string, string> = {
    'nodejs': 'node.js',
    'node js': 'node.js',
    'node': 'node.js',
    'expressjs': 'express',
    'express js': 'express',
    'express': 'express',
    'mongodb': 'mongodb',
    'mongo db': 'mongodb',
    'mongo': 'mongodb',
    'reactjs': 'react',
    'react js': 'react',
    'react': 'react',
    'typescript': 'typescript',
    'ts': 'typescript',
    'javascript': 'javascript',
    'js': 'javascript',
    'docker': 'docker',
    'redis': 'redis',
    'sql': 'sql',
    'postgresql': 'sql',
    'postgres': 'sql',
    'mysql': 'sql',
    'sqlite': 'sql',
    'caching': 'caching',
    'authentication': 'authentication',
    'auth': 'authentication',
    'system design': 'system design',
    'testing': 'testing',
    'ci/cd': 'ci/cd',
    'cicd': 'ci/cd',
    'github actions': 'ci/cd',
    'jenkins': 'ci/cd',
    'pipelines': 'ci/cd',
    'kubernetes': 'kubernetes',
    'k8s': 'kubernetes',
    'aws': 'aws',
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'terraform': 'terraform',
    'linux': 'linux',
    'python': 'python',
    'pytorch': 'pytorch',
    'tensorflow': 'tensorflow',
    'machine learning': 'machine learning',
    'ml': 'machine learning',
    'deep learning': 'deep learning',
    'nlp': 'nlp',
    'llm': 'llms',
    'llms': 'llms',
    'vector databases': 'vector databases',
    'openai': 'openai',
    'data pipelines': 'data pipelines',
    'pandas': 'pandas',
    'numpy': 'numpy',
    'tableau': 'tableau',
    'power bi': 'power bi',
    'excel': 'excel',
    'data visualization': 'data visualization',
    'statistics': 'statistics',
    'data cleaning': 'data cleaning',
    'react native': 'react native',
    'flutter': 'flutter',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'ios': 'ios',
    'android': 'android',
    'mobile design': 'mobile design',
    'api integration': 'api integration',
    'app store deployment': 'app store deployment',
    'tailwind': 'tailwind css',
    'tailwindcss': 'tailwind css',
    'css': 'css',
    'html': 'html',
    'nextjs': 'next.js',
    'next.js': 'next.js',
    'redux': 'redux',
    'webpack': 'webpack',
    'accessibility': 'accessibility',
    'a11y': 'accessibility'
  };

  return mappings[s] || s.replace(/[^a-z0-9. -]/g, '');
}

export function getRequiredSkills(dreamRole: string): string[] {
  const roleName = dreamRole || 'Backend Developer';
  if (ROLE_SKILL_MATRIX[roleName]) {
    return ROLE_SKILL_MATRIX[roleName];
  }
  
  // Case-insensitive, loose keyword match
  const normalizedSearch = roleName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(ROLE_SKILL_MATRIX)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedSearch.includes(normalizedKey) || normalizedKey.includes(normalizedSearch)) {
      return value;
    }
  }
  
  return ROLE_SKILL_MATRIX['Backend Developer'];
}
