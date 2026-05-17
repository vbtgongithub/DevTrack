// frontend/src/runtime/reconciliation.ts
// Sequence-aware frontend state reconciliation runtime coordinator.

export interface ProgressionMessage {
  sequence: number;
  userId: string;
  xpAwarded: number;
  currentXp: number;
  currentLevel: number;
  currentStreak: number;
  eventId: string;
  traceId: string;
}

export interface CoordinatorConfig {
  queryClient: any; // TanStack Query QueryClient instance
  onStateReconciled?: (state: Partial<ProgressionMessage>) => void;
  onOutofOrderDetected?: (expected: number, received: number) => void;
}

export class ReconciliationCoordinator {
  private lastAppliedSequence = 0;
  private pendingBuffer: ProgressionMessage[] = [];
  private readonly config: CoordinatorConfig;
  private readonly queryClient: any;

  constructor(config: CoordinatorConfig) {
    this.config = config;
    this.queryClient = config.queryClient;
    
    // Attempt to recover hydration checkpoint from SessionStorage to support page refresh continuity
    const storedSeq = sessionStorage.getItem('devtrack:reconciliation:sequence');
    if (storedSeq) {
      this.lastAppliedSequence = parseInt(storedSeq, 10);
    }
  }

  public getLastSequence(): number {
    return this.lastAppliedSequence;
  }

  /**
   * Reset local sequence cache (e.g. on user logout).
   */
  public reset(): void {
    this.lastAppliedSequence = 0;
    this.pendingBuffer = [];
    sessionStorage.removeItem('devtrack:reconciliation:sequence');
  }

  /**
   * Safe, sequence-validated state mutation.
   * Discards stale out-of-order messages and invalidates query caches atomically.
   */
  public reconcile(message: ProgressionMessage): void {
    const receivedSeq = message.sequence;

    // Rule 1: Discard old, stale, or duplicated events
    if (receivedSeq <= this.lastAppliedSequence) {
      console.warn(
        `[reconciliation] Stale event discarded. Sequence: ${receivedSeq}, last applied: ${this.lastAppliedSequence}`
      );
      return;
    }

    // Rule 2: Handle out-of-order gap. Queue in buffer if it is a future jump
    if (receivedSeq > this.lastAppliedSequence + 1) {
      console.warn(
        `[reconciliation] Sequence gap detected! Expected: ${this.lastAppliedSequence + 1}, got: ${receivedSeq}. Buffering event.`
      );
      this.pendingBuffer.push(message);
      this.pendingBuffer.sort((a, b) => a.sequence - b.sequence);
      
      if (this.config.onOutofOrderDetected) {
        this.config.onOutofOrderDetected(this.lastAppliedSequence + 1, receivedSeq);
      }
      return;
    }

    // Rule 3: Valid sequence increment (+1)
    this.applyStateChange(message);

    // Rule 4: Process buffered messages that can now be applied
    this.drainBuffer();
  }

  private applyStateChange(message: ProgressionMessage): void {
    this.lastAppliedSequence = message.sequence;
    sessionStorage.setItem('devtrack:reconciliation:sequence', String(message.sequence));

    // Force invalidation of the TanStack cache keys relating to dashboard status
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      this.queryClient.invalidateQueries({ queryKey: ['profile-progression'] });
    }

    if (this.config.onStateReconciled) {
      this.config.onStateReconciled(message);
    }

    console.log(
      `[reconciliation] Successfully reconciled sequence ${message.sequence} (Event ID: ${message.eventId})`
    );
  }

  private drainBuffer(): void {
    while (this.pendingBuffer.length > 0) {
      const nextMessage = this.pendingBuffer[0];
      if (nextMessage.sequence === this.lastAppliedSequence + 1) {
        this.pendingBuffer.shift();
        this.applyStateChange(nextMessage);
      } else if (nextMessage.sequence <= this.lastAppliedSequence) {
        // Stale element in buffer
        this.pendingBuffer.shift();
      } else {
        // Gap still remains
        break;
      }
    }
  }
}
