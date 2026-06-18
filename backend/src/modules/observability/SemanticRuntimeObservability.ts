import { RetrievalLatencyMonitor } from './RetrievalLatencyMonitor.js';
import { SemanticDriftTracker } from './SemanticDriftTracker.js';

export class SemanticRuntimeObservability {
  public latencyMonitor = new RetrievalLatencyMonitor();
  public driftTracker = new SemanticDriftTracker();

  // Facade for semantic observability
}
