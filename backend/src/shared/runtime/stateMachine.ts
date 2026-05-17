// src/shared/runtime/stateMachine.ts
// Deterministic state-machine core for DevTrack progression saga workflows.

import { logger } from '../logger.js';

export type OrchestrationState =
  | 'PENDING'
  | 'VALIDATING'
  | 'NORMALIZING'
  | 'PROCESSING'
  | 'COMPENSATING'
  | 'REPLAYING'
  | 'QUARANTINED'
  | 'FAILED'
  | 'COMPLETED';

export type OrchestrationEvent =
  | 'TRIGGER_INGEST'
  | 'VALIDATE_PAYLOAD'
  | 'NORMALIZE_SCHEMA'
  | 'START_PROGRESSION'
  | 'ABUSE_SUSPECTED'
  | 'REPLAY_RUN'
  | 'TRIGGER_COMPENSATION'
  | 'FAIL_TRANSACTION'
  | 'COMPLETE_TRANSACTION';

export interface StateTransitionResult {
  success: boolean;
  from: OrchestrationState;
  to: OrchestrationState;
  reason?: string;
}

export interface TransitionContext {
  sagaId: string;
  userId: string;
  traceId: string;
  correlationId: string;
  replayMode?: boolean;
}

// Allowed state transitions map to enforce strict invariant validation.
const ALLOWED_TRANSITIONS: Record<OrchestrationState, OrchestrationState[]> = {
  PENDING: ['VALIDATING', 'FAILED'],
  VALIDATING: ['NORMALIZING', 'QUARANTINED', 'COMPENSATING', 'FAILED'],
  NORMALIZING: ['PROCESSING', 'COMPENSATING', 'FAILED'],
  PROCESSING: ['COMPLETED', 'QUARANTINED', 'COMPENSATING', 'FAILED'],
  COMPENSATING: ['FAILED', 'PENDING'],
  REPLAYING: ['VALIDATING', 'COMPLETED', 'FAILED'],
  QUARANTINED: ['VALIDATING', 'FAILED', 'COMPLETED'],
  FAILED: [],
  COMPLETED: ['REPLAYING'],
};

export class OrchestrationStateMachine {
  private currentState: OrchestrationState = 'PENDING';
  private transitionHistory: Array<{
    timestamp: Date;
    event: OrchestrationEvent;
    from: OrchestrationState;
    to: OrchestrationState;
  }> = [];

  constructor(
    private readonly context: TransitionContext,
    initialState: OrchestrationState = 'PENDING'
  ) {
    this.currentState = initialState;
  }

  public getCurrentState(): OrchestrationState {
    return this.currentState;
  }

  public getHistory() {
    return [...this.transitionHistory];
  }

  /**
   * Deterministically transitions the orchestration state.
   * Enforces strict safety rules, validation, and tracing consistency.
   */
  public transition(
    event: OrchestrationEvent,
    targetState: OrchestrationState
  ): StateTransitionResult {
    const fromState = this.currentState;
    
    // Check Replay isolation bounds
    if (this.context.replayMode && targetState === 'COMPENSATING') {
      logger.warn('[state-machine] Blocked COMPENSATION sequence inside REPLAY mode', {
        sagaId: this.context.sagaId,
        traceId: this.context.traceId,
      });
      return {
        success: false,
        from: fromState,
        to: fromState,
        reason: 'Compensation triggers are blocked during Replay operations',
      };
    }

    const allowed = ALLOWED_TRANSITIONS[fromState];
    if (!allowed || !allowed.includes(targetState)) {
      const reason = `Invalid transition from ${fromState} to ${targetState}`;
      logger.error('[state-machine] Transition validation failed', new Error(reason), {
        sagaId: this.context.sagaId,
        traceId: this.context.traceId,
      });
      return {
        success: false,
        from: fromState,
        to: fromState,
        reason,
      };
    }

    // Apply the transition
    this.currentState = targetState;
    this.transitionHistory.push({
      timestamp: new Date(),
      event,
      from: fromState,
      to: targetState,
    });

    logger.info('[state-machine] Transition complete', {
      sagaId: this.context.sagaId,
      event,
      from: fromState,
      to: targetState,
      traceId: this.context.traceId,
    });

    return {
      success: true,
      from: fromState,
      to: targetState,
    };
  }
}
