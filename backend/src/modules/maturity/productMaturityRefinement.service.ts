// src/modules/maturity/productMaturityRefinement.service.ts — Product Maturity Refinement Service
// Phase-K: Product Maturity Refinement - Trust, clarity, focus, resilience, sustainable momentum

import { logger } from '../../shared/logger.js';

export interface ProductMaturityMetrics {
  trust: number; // 0-100, higher = more trusted
  clarity: number; // 0-100, higher = clearer
  focus: number; // 0-100, higher = better focus
  resilience: number; // 0-100, higher = more resilient
  sustainableMomentum: number; // 0-100, higher = more sustainable
  overallMaturityScore: number; // 0-100
  recommendations: string[];
}

export const productMaturityRefinement = {
  // ─── Get Product Maturity Metrics ───────────────────────────────────────────────
  async getProductMaturityMetrics(dateRange: { start: Date; end: Date }): Promise<ProductMaturityMetrics> {
    // In a real implementation, this would aggregate data from various validation services
    const trust = 82;
    const clarity = 75;
    const focus = 78;
    const resilience = 80;
    const sustainableMomentum = 76;

    const overallMaturityScore = (trust + clarity + focus + resilience + sustainableMomentum) / 5;

    const recommendations = this.generateMaturityRecommendations(
      trust,
      clarity,
      focus,
      resilience,
      sustainableMomentum,
      overallMaturityScore
    );

    return {
      trust,
      clarity,
      focus,
      resilience,
      sustainableMomentum,
      overallMaturityScore,
      recommendations,
    };
  },

  // ─── Generate Maturity Recommendations ────────────────────────────────────────────
  generateMaturityRecommendations(
    trust: number,
    clarity: number,
    focus: number,
    resilience: number,
    sustainableMomentum: number,
    overallMaturityScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (trust < 70) {
      recommendations.push('Low trust - improve transparency and reduce pressure');
    }

    if (clarity < 70) {
      recommendations.push('Low clarity - simplify UX and improve communication');
    }

    if (focus < 70) {
      recommendations.push('Low focus - reduce distractions and improve flow preservation');
    }

    if (resilience < 70) {
      recommendations.push('Low resilience - improve recovery and comeback experience');
    }

    if (sustainableMomentum < 70) {
      recommendations.push('Low sustainable momentum - shift from extrinsic to intrinsic motivation');
    }

    if (overallMaturityScore < 70) {
      recommendations.push('Overall maturity below 70 - comprehensive refinement needed');
    } else if (overallMaturityScore < 80) {
      recommendations.push('Maturity is good but room for improvement');
    }

    if (recommendations.length === 0) {
      recommendations.push('Product maturity is excellent - maintain current direction');
    }

    return recommendations;
  },

  // ─── Validate Against Maturity Targets ─────────────────────────────────────────────
  async validateAgainstMaturityTargets(targets: {
    trust: number;
    clarity: number;
    focus: number;
    resilience: number;
    sustainableMomentum: number;
  }): Promise<{
    currentMetrics: ProductMaturityMetrics;
    gaps: Record<string, { current: number; target: number; gap: number }>;
    priorityAreas: string[];
    recommendations: string[];
  }> {
    const currentMetrics = await this.getProductMaturityMetrics({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    const gaps: Record<string, { current: number; target: number; gap: number }> = {
      trust: { current: currentMetrics.trust, target: targets.trust, gap: targets.trust - currentMetrics.trust },
      clarity: { current: currentMetrics.clarity, target: targets.clarity, gap: targets.clarity - currentMetrics.clarity },
      focus: { current: currentMetrics.focus, target: targets.focus, gap: targets.focus - currentMetrics.focus },
      resilience: { current: currentMetrics.resilience, target: targets.resilience, gap: targets.resilience - currentMetrics.resilience },
      sustainableMomentum: { current: currentMetrics.sustainableMomentum, target: targets.sustainableMomentum, gap: targets.sustainableMomentum - currentMetrics.sustainableMomentum },
    };

    const priorityAreas = Object.entries(gaps)
      .filter(([_, data]) => data.gap > 10)
      .map(([area, _]) => area)
      .sort((a, b) => gaps[b].gap - gaps[a].gap);

    const recommendations = priorityAreas.map(area => {
      const gap = gaps[area].gap;
      return `Improve ${area} - ${gap.toFixed(1)} point gap to target`;
    });

    if (recommendations.length === 0) {
      recommendations.push('All maturity targets met or exceeded - maintain current performance');
    }

    return {
      currentMetrics,
      gaps,
      priorityAreas,
      recommendations,
    };
  },

  // ─── Get Maturity Evolution Timeline ───────────────────────────────────────────────
  async getMaturityEvolutionTimeline(): Promise<Array<{
    date: Date;
    overallScore: number;
    trust: number;
    clarity: number;
    focus: number;
    resilience: number;
    sustainableMomentum: number;
    keyChanges: string[];
  }>> {
    // In a real implementation, this would track maturity changes over time
    return [
      {
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        overallScore: 65,
        trust: 70,
        clarity: 60,
        focus: 65,
        resilience: 68,
        sustainableMomentum: 62,
        keyChanges: ['Initial baseline measurement'],
      },
      {
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        overallScore: 70,
        trust: 75,
        clarity: 68,
        focus: 72,
        resilience: 72,
        sustainableMomentum: 65,
        keyChanges: ['Reduced notification pressure', 'Improved onboarding'],
      },
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        overallScore: 75,
        trust: 80,
        clarity: 72,
        focus: 76,
        resilience: 78,
        sustainableMomentum: 70,
        keyChanges: ['Simplified workspace', 'Improved recovery messaging'],
      },
    ];
  },
};

export default productMaturityRefinement;
