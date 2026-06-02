import { logger } from '../../../shared/logger.js';
import { KeywordSemanticMatcher } from './KeywordSemanticMatcher.js';
import { RoleExpectationMatcher } from './RoleExpectationMatcher.js';
import { RealEmbeddingPipeline } from '../../ai/embedding/RealEmbeddingPipeline.js';
import { SemanticSimilarityService } from '../../ai/retrieval/SemanticSimilarityService.js';

export class ATSSemanticAlignmentEngine {
  private keywordMatcher: KeywordSemanticMatcher;
  private roleMatcher: RoleExpectationMatcher;

  constructor(pipeline: RealEmbeddingPipeline, similarity: SemanticSimilarityService) {
    this.keywordMatcher = new KeywordSemanticMatcher(pipeline, similarity);
    this.roleMatcher = new RoleExpectationMatcher(pipeline, similarity);
  }

  async alignResumeToJD(resumeText: string, jdText: string, jdKeywords: string[]): Promise<any> {
    logger.info('[ATSSemanticAlignmentEngine] Aligning resume to JD semantically');
    const keywordMatches = await this.keywordMatcher.matchKeywords(resumeText, jdKeywords);
    const roleMatch = await this.roleMatcher.matchRoleExpectation(resumeText, jdText);

    return {
      keywordMatches: Object.fromEntries(keywordMatches),
      roleMatchScore: roleMatch,
      overallAlignment: (roleMatch + (Array.from(keywordMatches.values()).reduce((a,b)=>a+b,0) / jdKeywords.length)) / 2
    };
  }
}
