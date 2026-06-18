export interface ResumeFeatureVector {
  backendScore: number;
  frontendScore: number;
  infraScore: number;
  architectureScore: number;
  deploymentScore: number;
  dsaScore: number;
  projectDepthScore: number;
}

export interface ConfidenceEnvelope {
  confidence: number;
  evidenceCount: number;
  evidenceSources: string[];
  reasoning?: string;
}

export interface CredibilitySignal {
  source: string;
  consistency: number;
  verificationStatus: 'verified' | 'partial' | 'weak';
}

export interface IntelligenceResult<T> {
  data: T;
  confidence: ConfidenceEnvelope;
  metadata: {
    runtimeVersion: string;
    schemaVersion: string;
    replayCompatibilityVersion: string;
    generatedAt: string;
  };
}

export interface EvaluationContract {
  score: number;
  confidence: number;
  sample_size: number;
  failure_modes: string[];
  evaluation_version: string;
}


export interface ParsedSection {
  title: string;
  content: string;
  originalText: string;
}

export interface ExtractedEntity {
  value: string;
  confidence: number;
  source_section: string;
  evidence_window: string;
}

export interface ParsedResume {
  sections: ParsedSection[];
  skills: ExtractedEntity[];
  projects: ExtractedEntity[];
  education: ExtractedEntity[];
  experience: ExtractedEntity[];
  technologies: ExtractedEntity[];
}

