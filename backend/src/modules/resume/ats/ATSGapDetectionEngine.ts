import { logger } from '../../../shared/logger.js';

export interface IGapDetectionResult {
  score: number;
  gaps: {
    type: 'keyword' | 'formatting' | 'section' | 'project_depth' | 'infra_tech' | 'quantified_impact' | 'deployment' | 'engineering_depth';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }[];
  summary: string;
}

/**
 * ATSGapDetectionEngine
 * 
 * Focuses on REAL engineering analysis by detecting gaps in:
 * - Infrastructure terminology
 * - Deployment evidence
 * - Engineering depth
 * - Quantified impact
 */
export class ATSGapDetectionEngine {
  /**
   * Detect gaps in resume content
   */
  async detectGaps(content: string): Promise<IGapDetectionResult> {
    logger.info('[ATSGapDetection] Starting gap detection');
    
    const gaps: IGapDetectionResult['gaps'] = [];
    let score = 100;

    // 1. Detect Infrastructure Terminology Gaps
    const infraGaps = this.checkInfrastructureTerminology(content);
    gaps.push(...infraGaps);
    score -= infraGaps.length * 5;

    // 2. Detect Deployment Evidence Gaps
    const deploymentGaps = this.checkDeploymentEvidence(content);
    gaps.push(...deploymentGaps);
    score -= deploymentGaps.length * 10;

    // 3. Detect Engineering Depth Gaps
    const depthGaps = this.checkEngineeringDepth(content);
    gaps.push(...depthGaps);
    score -= depthGaps.length * 8;

    // 4. Detect Quantified Impact Gaps
    const impactGaps = this.checkQuantifiedImpact(content);
    gaps.push(...impactGaps);
    score -= impactGaps.length * 7;

    // 5. Detect Weak Project Descriptions
    const projectGaps = this.checkProjectDescriptions(content);
    gaps.push(...projectGaps);
    score -= projectGaps.length * 6;

    // 6. Basic ATS Gaps (Keywords, Sections, Formatting)
    const basicGaps = this.checkBasicATSGaps(content);
    gaps.push(...basicGaps);
    score -= basicGaps.length * 4;

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      gaps,
      summary: this.generateSummary(score, gaps),
    };
  }

  private checkInfrastructureTerminology(content: string): IGapDetectionResult['gaps'] {
    const infraKeywords = [
      'docker', 'kubernetes', 'k8s', 'terraform', 'aws', 'gcp', 'azure', 
      'ci/cd', 'jenkins', 'github actions', 'monitoring', 'prometheus', 
      'grafana', 'elk', 'terraform', 'ansible', 'cloudformation'
    ];
    
    const contentLower = content.toLowerCase();
    const found = infraKeywords.filter(k => contentLower.includes(k));
    
    if (found.length < 3) {
      return [{
        type: 'infra_tech',
        severity: 'warning',
        message: 'Weak infrastructure and DevOps terminology detected',
        suggestion: 'Include specific infrastructure tools like Docker, Kubernetes, or Cloud provider names (AWS/GCP).'
      }];
    }
    return [];
  }

  private checkDeploymentEvidence(content: string): IGapDetectionResult['gaps'] {
    const deploymentPatterns = [
      /deployed\s+(to|on|using)/i,
      /live\s+at/i,
      /production\s+environment/i,
      /hosted\s+on/i,
      /vercel|netlify|heroku|digitalocean|s3|ec2/i
    ];

    const hasDeployment = deploymentPatterns.some(p => p.test(content));
    
    if (!hasDeployment) {
      return [{
        type: 'deployment',
        severity: 'critical',
        message: 'No clear evidence of production deployment',
        suggestion: 'Explicitly mention where your projects are deployed and provide live links if possible.'
      }];
    }
    return [];
  }

  private checkEngineeringDepth(content: string): IGapDetectionResult['gaps'] {
    const depthKeywords = [
      'distributed systems', 'scalability', 'concurrency', 'optimization',
      'latency', 'throughput', 'architecture', 'microservices', 'caching',
      'redis', 'kafka', 'message queue', 'load balancing', 'sharding', 'indexing'
    ];

    const contentLower = content.toLowerCase();
    const found = depthKeywords.filter(k => contentLower.includes(k));

    if (found.length < 2) {
      return [{
        type: 'engineering_depth',
        severity: 'warning',
        message: 'Limited evidence of deep engineering concepts',
        suggestion: 'Discuss system design challenges like scalability, concurrency, or performance optimization.'
      }];
    }
    return [];
  }

  private checkQuantifiedImpact(content: string): IGapDetectionResult['gaps'] {
    const impactPattern = /\d+%\s+|\d+\s*ms\s+|\d+\s*x\s+|reduced\s+|increased\s+|improved\s+/i;
    
    if (!impactPattern.test(content)) {
      return [{
        type: 'quantified_impact',
        severity: 'warning',
        message: 'Missing quantified engineering impact',
        suggestion: 'Use metrics to describe your impact (e.g., "Reduced latency by 20%", "Scaled to 10k users").'
      }];
    }
    return [];
  }

  private checkProjectDescriptions(content: string): IGapDetectionResult['gaps'] {
    // Check if project descriptions are too short or non-existent
    const projectSection = content.match(/projects[\s\S]*?(experience|education|skills|$)/i);
    if (!projectSection || projectSection[0].length < 100) {
      return [{
        type: 'project_depth',
        severity: 'critical',
        message: 'Weak or missing project descriptions',
        suggestion: 'Elaborate on your projects, focusing on the technical challenges and your specific contributions.'
      }];
    }
    return [];
  }

  private checkBasicATSGaps(content: string): IGapDetectionResult['gaps'] {
    const gaps: IGapDetectionResult['gaps'] = [];
    const contentLower = content.toLowerCase();

    // Check for standard sections
    const standardSections = ['experience', 'education', 'skills'];
    standardSections.forEach(section => {
      if (!contentLower.includes(section)) {
        gaps.push({
          type: 'section',
          severity: 'critical',
          message: `Missing standard section: ${section}`,
          suggestion: `Ensure your resume has a clearly labeled "${section}" section.`
        });
      }
    });

    // Formatting checks (simple heuristics)
    if (content.includes('\t\t') || /\s{10,}/.test(content)) {
      gaps.push({
        type: 'formatting',
        severity: 'info',
        message: 'Potential multi-column or complex layout detected',
        suggestion: 'Use a simple single-column layout for maximum ATS compatibility.'
      });
    }

    return gaps;
  }

  private generateSummary(score: number, gaps: IGapDetectionResult['gaps']): string {
    if (score >= 90) return 'Strong engineering resume with good ATS compatibility.';
    if (score >= 70) return 'Decent resume, but lacks some critical engineering depth and infrastructure details.';
    if (score >= 50) return 'Moderate gaps detected in engineering evidence and technical impact.';
    return 'Significant gaps detected. Resume lacks evidence of production-grade engineering and depth.';
  }
}
