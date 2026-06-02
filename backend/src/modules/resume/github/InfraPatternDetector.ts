// src/modules/resume-intelligence/github/InfraPatternDetector.ts
export class InfraPatternDetector {
  async detectPatterns(_content: any): Promise<any> {
    return { hasDocker: true, hasKubernetes: false };
  }
}
