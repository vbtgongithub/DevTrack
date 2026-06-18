import { logger } from '../../shared/logger.js';

export interface EvidenceNode {
  evidenceId: string;
  source: string; // e.g., 'leetcode-submission', 'github-commit', 'dependency'
  type: 'dsa' | 'skill' | 'project' | 'roadmap' | 'benchmark';
  timestamp: Date;
  data: any;
  confidence: number; // 0-100
}

export interface EvidenceLink {
  insightId: string;
  insightType: string; // e.g., 'topic-mastery', 'skill-verification', 'project-credibility'
  evidenceIds: string[];
  reasoning: string;
  contributionWeight: number; // How much this evidence contributes to the insight
}

export interface EvidenceChain {
  chainId: string;
  userId: string;
  rootInsight: string; // e.g., 'overall-readiness-score'
  nodes: EvidenceNode[];
  links: EvidenceLink[];
  createdAt: Date;
  isComplete: boolean;
}

class EvidenceChainSystemClass {
  private chains: Map<string, EvidenceChain> = new Map();
  private evidenceNodes: Map<string, EvidenceNode> = new Map();
  private links: Map<string, EvidenceLink> = new Map();

  /**
   * Create a new evidence chain for an insight
   */
  createChain(userId: string, rootInsight: string): EvidenceChain {
    const chainId = this.generateChainId(userId, rootInsight);
    
    const chain: EvidenceChain = {
      chainId,
      userId,
      rootInsight,
      nodes: [],
      links: [],
      createdAt: new Date(),
      isComplete: false,
    };

    this.chains.set(chainId, chain);
    logger.info('[EvidenceChainSystem] Created evidence chain', { chainId, userId, rootInsight });

    return chain;
  }

  /**
   * Add an evidence node to a chain
   */
  addEvidenceNode(
    chainId: string,
    source: string,
    type: EvidenceNode['type'],
    data: any,
    confidence: number
  ): EvidenceNode {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const evidenceId = this.generateEvidenceId(chainId, source);
    const node: EvidenceNode = {
      evidenceId,
      source,
      type,
      timestamp: new Date(),
      data,
      confidence,
    };

    this.evidenceNodes.set(evidenceId, node);
    chain.nodes.push(node);
    this.chains.set(chainId, chain);

    logger.info('[EvidenceChainSystem] Added evidence node', { evidenceId, chainId, source });

    return node;
  }

  /**
   * Link evidence to an insight
   */
  linkEvidenceToInsight(
    chainId: string,
    insightId: string,
    insightType: string,
    evidenceIds: string[],
    reasoning: string,
    contributionWeight: number
  ): EvidenceLink {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const linkId = this.generateLinkId(insightId, evidenceIds);
    const link: EvidenceLink = {
      insightId,
      insightType,
      evidenceIds,
      reasoning,
      contributionWeight,
    };

    this.links.set(linkId, link);
    chain.links.push(link);
    this.chains.set(chainId, chain);

    logger.info('[EvidenceChainSystem] Linked evidence to insight', { 
      linkId, 
      insightId, 
      evidenceCount: evidenceIds.length 
    });

    return link;
  }

  /**
   * Mark a chain as complete
   */
  markChainComplete(chainId: string): void {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    chain.isComplete = true;
    this.chains.set(chainId, chain);

    logger.info('[EvidenceChainSystem] Marked chain complete', { chainId });
  }

  /**
   * Get a chain by ID
   */
  getChain(chainId: string): EvidenceChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all chains for a user
   */
  getUserChains(userId: string): EvidenceChain[] {
    return Array.from(this.chains.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get evidence for a specific insight
   */
  getEvidenceForInsight(insightId: string): EvidenceNode[] {
    const relevantLinks = Array.from(this.links.values())
      .filter(l => l.insightId === insightId);
    
    const evidenceIds = new Set<string>();
    relevantLinks.forEach(link => {
      link.evidenceIds.forEach(id => evidenceIds.add(id));
    });

    const evidence: EvidenceNode[] = [];
    evidenceIds.forEach(id => {
      const node = this.evidenceNodes.get(id);
      if (node) evidence.push(node);
    });

    return evidence;
  }

  /**
   * Explain an insight with its evidence chain
   */
  explainInsight(insightId: string): {
    insightId: string;
    evidence: EvidenceNode[];
    reasoning: string[];
    totalConfidence: number;
  } {
    const evidence = this.getEvidenceForInsight(insightId);
    const relevantLinks = Array.from(this.links.values())
      .filter(l => l.insightId === insightId);
    
    const reasoning = relevantLinks.map(l => l.reasoning);
    
    let totalConfidence = 0;
    let totalWeight = 0;
    
    relevantLinks.forEach(link => {
      const linkEvidence = link.evidenceIds
        .map(id => this.evidenceNodes.get(id))
        .filter((n): n is EvidenceNode => n !== undefined);
      
      const avgEvidenceConfidence = linkEvidence.length > 0
        ? linkEvidence.reduce((sum, n) => sum + n.confidence, 0) / linkEvidence.length
        : 0;
      
      totalConfidence += avgEvidenceConfidence * link.contributionWeight;
      totalWeight += link.contributionWeight;
    });
    
    const finalConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;

    return {
      insightId,
      evidence,
      reasoning,
      totalConfidence: Math.round(finalConfidence),
    };
  }

  /**
   * Get audit trail for a user's readiness
   */
  getAuditTrail(userId: string): {
    chains: EvidenceChain[];
    totalEvidence: number;
    totalLinks: number;
    averageConfidence: number;
  } {
    const userChains = this.getUserChains(userId);
    const totalEvidence = userChains.reduce((sum, c) => sum + c.nodes.length, 0);
    const totalLinks = userChains.reduce((sum, c) => sum + c.links.length, 0);
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    userChains.forEach(chain => {
      chain.nodes.forEach(node => {
        totalConfidence += node.confidence;
        confidenceCount++;
      });
    });
    
    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return {
      chains: userChains,
      totalEvidence,
      totalLinks,
      averageConfidence: Math.round(averageConfidence),
    };
  }

  /**
   * Generate chain ID
   */
  private generateChainId(userId: string, rootInsight: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}-${rootInsight}-${timestamp}-${random}`;
  }

  /**
   * Generate evidence ID
   */
  private generateEvidenceId(chainId: string, source: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${chainId}-${source}-${timestamp}-${random}`;
  }

  /**
   * Generate link ID
   */
  private generateLinkId(insightId: string, evidenceIds: string[]): string {
    const evidenceHash = evidenceIds.sort().join('-');
    const timestamp = Date.now();
    return `${insightId}-${evidenceHash}-${timestamp}`;
  }

  /**
   * Get system statistics
   */
  getStats(): {
    totalChains: number;
    totalEvidenceNodes: number;
    totalLinks: number;
    completedChains: number;
    averageChainSize: number;
  } {
    const chains = Array.from(this.chains.values());
    const completedChains = chains.filter(c => c.isComplete).length;
    const averageChainSize = chains.length > 0
      ? chains.reduce((sum, c) => sum + c.nodes.length, 0) / chains.length
      : 0;

    return {
      totalChains: this.chains.size,
      totalEvidenceNodes: this.evidenceNodes.size,
      totalLinks: this.links.size,
      completedChains,
      averageChainSize: Math.round(averageChainSize),
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.chains.clear();
    this.evidenceNodes.clear();
    this.links.clear();
    logger.info('[EvidenceChainSystem] Cleared all data');
  }
}

export const EvidenceChainSystem = new EvidenceChainSystemClass();
