// src/modules/recommendations/engines/dependencyGraph.ts
import { Schema } from 'mongoose';
import { IntelligenceRecommendation } from '../../../db/models/intelligenceRecommendation.model.js';

export class RecommendationDependencyGraph {
  
  static async resolveDependencies(resumeProfileId: string | Schema.Types.ObjectId): Promise<void> {
    const activeRecs = await IntelligenceRecommendation.find({ resumeProfileId, state: 'active' });
    
    // Categorize
    const atsRecs = activeRecs.filter(r => r.category === 'ats');
    const credibilityRecs = activeRecs.filter(r => r.category === 'credibility');
    const infraRecs = activeRecs.filter(r => r.category === 'infrastructure');
    const semanticRecs = activeRecs.filter(r => r.category === 'semantic');

    const modifiedRecs: typeof activeRecs = [];

    // Rule 1: ATS issues block everything else.
    if (atsRecs.length > 0) {
      const atsIds = atsRecs.map(r => r._id.toString());
      
      const toUpdate = [...credibilityRecs, ...infraRecs, ...semanticRecs];
      for (const rec of toUpdate) {
        if (!rec.dependencies) rec.dependencies = [];
        const existingStrIds = rec.dependencies.map(id => id.toString());
        for (const atsIdStr of atsIds) {
          if (!existingStrIds.includes(atsIdStr)) {
            rec.dependencies.push(atsIdStr as any);
            if (!modifiedRecs.includes(rec)) modifiedRecs.push(rec);
          }
        }
      }
    }

    // Rule 2: Basic Credibility blocks Infrastructure / Semantic
    if (credibilityRecs.length > 0) {
      const credIds = credibilityRecs.map(r => r._id.toString());
      
      const toUpdate = [...infraRecs, ...semanticRecs];
      for (const rec of toUpdate) {
        if (!rec.dependencies) rec.dependencies = [];
        const existingStrIds = rec.dependencies.map(id => id.toString());
        for (const credIdStr of credIds) {
          if (!existingStrIds.includes(credIdStr)) {
            rec.dependencies.push(credIdStr as any);
            if (!modifiedRecs.includes(rec)) modifiedRecs.push(rec);
          }
        }
      }
    }

    if (modifiedRecs.length > 0) {
      await Promise.all(modifiedRecs.map(rec => rec.save()));
    }
  }
}
