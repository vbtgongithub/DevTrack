// src/shared/syncState.ts — Lightweight sync state singleton
// Tracks global scheduler state for observability and lock coordination.

export type SyncStatus = 'idle' | 'running' | 'error';

export interface SyncStateSnapshot {
  status: SyncStatus;
  lastSyncStartedAt: string | null;
  lastSyncCompletedAt: string | null;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  lastSyncDurationMs: number | null;
  totalSyncs: number;
  failedSyncs: number;
}

class SyncState {
  private _status: SyncStatus = 'idle';
  private _lastSyncStartedAt: Date | null = null;
  private _lastSyncCompletedAt: Date | null = null;
  private _lastSyncStatus: 'success' | 'partial' | 'failed' | null = null;
  private _lastSyncDurationMs: number | null = null;
  private _totalSyncs = 0;
  private _failedSyncs = 0;

  get status(): SyncStatus {
    return this._status;
  }

  get lastSyncStartedAt(): string | null {
    return this._lastSyncStartedAt?.toISOString() ?? null;
  }

  get lastSyncCompletedAt(): string | null {
    return this._lastSyncCompletedAt?.toISOString() ?? null;
  }

  get lastSyncStatus(): 'success' | 'partial' | 'failed' | null {
    return this._lastSyncStatus;
  }

  get lastSyncDurationMs(): number | null {
    return this._lastSyncDurationMs;
  }

  get totalSyncs(): number {
    return this._totalSyncs;
  }

  get failedSyncs(): number {
    return this._failedSyncs;
  }

  beginSync(): void {
    this._status = 'running';
    this._lastSyncStartedAt = new Date();
  }

  completeSync(
    status: 'success' | 'partial' | 'failed',
    durationMs: number
  ): void {
    this._status = status === 'failed' ? 'error' : 'idle';
    this._lastSyncCompletedAt = new Date();
    this._lastSyncStatus = status;
    this._lastSyncDurationMs = durationMs;
    this._totalSyncs++;

    if (status === 'failed') {
      this._failedSyncs++;
    }
  }

  getSnapshot(): SyncStateSnapshot {
    return {
      status: this._status,
      lastSyncStartedAt: this.lastSyncStartedAt,
      lastSyncCompletedAt: this.lastSyncCompletedAt,
      lastSyncStatus: this._lastSyncStatus,
      lastSyncDurationMs: this._lastSyncDurationMs,
      totalSyncs: this._totalSyncs,
      failedSyncs: this._failedSyncs,
    };
  }
}

// Module-level singleton — shared across the entire process
export const syncState = new SyncState();
