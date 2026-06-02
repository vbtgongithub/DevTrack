export interface EvidenceNode {
  id: string;
  type: 'claim' | 'evidence' | 'metric';
  label: string;
  source: string;
  confidence: number;
}

export interface EvidenceEdge {
  source: string;
  target: string;
  relationship: 'supports' | 'contradicts' | 'quantifies';
  weight: number;
}

export class EvidenceGraph {
  private nodes: Map<string, EvidenceNode> = new Map();
  private edges: EvidenceEdge[] = [];

  addNode(node: EvidenceNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: EvidenceEdge) {
    this.edges.push(edge);
  }

  buildGraph(claims: string[], signals: any[]) {
    // Scaffold evidence graph bridging claims (resume text) to signals (database)
    claims.forEach((claim, idx) => {
      const claimId = `claim_${idx}`;
      this.addNode({
        id: claimId,
        type: 'claim',
        label: claim,
        source: 'resume',
        confidence: 0.5
      });
    });

    signals.forEach((signal, idx) => {
      const sigId = `sig_${idx}`;
      this.addNode({
        id: sigId,
        type: 'evidence',
        label: `${signal.source} verified`,
        source: signal.source,
        confidence: signal.consistency / 100
      });

      // Dummy linkage for structural purposes
      if (claims.length > 0) {
         this.addEdge({
           source: sigId,
           target: `claim_0`,
           relationship: signal.verificationStatus === 'weak' ? 'contradicts' : 'supports',
           weight: signal.consistency / 100
         });
      }
    });
  }

  getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }
}
