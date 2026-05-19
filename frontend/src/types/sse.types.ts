// ============================================================================
// sse.types.ts — SSE Event Type Definitions
// ============================================================================
// Centralized type definitions for Server-Sent Events.
// ============================================================================

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export type SseEventType =
  // Runtime state (primary)
  | 'runtime_state_patch'
  
  // Gamification events
  | 'xp_updated'
  | 'level_up'
  | 'streak_milestone'
  | 'streak_at_risk'
  | 'achievement_unlocked'
  
  // Sync events
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  
  // Notification events
  | 'notification_created'
  | 'mission_completed'
  
  // DSA events
  | 'new_submission'
  
  // System events
  | 'heartbeat';

// ---------------------------------------------------------------------------
// Event Payloads
// ---------------------------------------------------------------------------

/**
 * XP Updated Event
 * Emitted when user earns XP
 */
export interface XpUpdatedPayload {
  xpAwarded: number;
  newTotalXp: number;
  source: 'leetcode' | 'codeforces' | 'github' | 'codechef' | 'manual';
  reason: string;
}

/**
 * Level Up Event
 * Emitted when user reaches a new level
 */
export interface LevelUpPayload {
  newLevel: number;
  totalXp: number;
  levelName: string;
  levelTitle: string;
  unlockedFeatures?: string[];
}

/**
 * Streak Milestone Event
 * Emitted on streak milestones (7, 14, 30, 60, 100, 200, 365 days)
 */
export interface StreakMilestonePayload {
  days: number;
  xpBonus: number;
  milestone: 'weekly' | 'biweekly' | 'monthly' | 'legendary';
}

/**
 * Streak At Risk Event
 * Emitted when user hasn't completed activity today
 */
export interface StreakAtRiskPayload {
  currentStreak: number;
  hoursRemaining: number;
  lastActivityDate: string;
}

/**
 * Achievement Unlocked Event
 * Emitted when user unlocks an achievement
 */
export interface AchievementUnlockedPayload {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedAt: string;
}

/**
 * Sync Started Event
 * Emitted when platform sync begins
 */
export interface SyncStartedPayload {
  platform: 'leetcode' | 'codeforces' | 'github' | 'codechef';
  syncId: string;
  startedAt: string;
}

/**
 * Sync Completed Event
 * Emitted when platform sync completes successfully
 */
export interface SyncCompletedPayload {
  platform: 'leetcode' | 'codeforces' | 'github' | 'codechef';
  syncId: string;
  duration: number;
  stats: {
    ingested: number;
    updated: number;
    skipped: number;
  };
  completedAt: string;
}

/**
 * Sync Failed Event
 * Emitted when platform sync fails
 */
export interface SyncFailedPayload {
  platform: 'leetcode' | 'codeforces' | 'github' | 'codechef';
  syncId: string;
  error: string;
  retryable: boolean;
  failedAt: string;
}

/**
 * Notification Created Event
 * Emitted when a new notification is created
 */
export interface NotificationCreatedPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

/**
 * Mission Completed Event
 * Emitted when user completes a mission
 */
export interface MissionCompletedPayload {
  missionId: string;
  missionName: string;
  xpReward: number;
  completedAt: string;
}

/**
 * New Submission Event
 * Emitted when a new DSA submission is detected
 */
export interface NewSubmissionPayload {
  platform: 'leetcode' | 'codeforces' | 'codechef';
  problemId: string;
  problemTitle: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error';
  language: string;
  submittedAt: string;
}

/**
 * Runtime State Patch Event
 * Emitted for real-time state updates
 */
export interface RuntimeStatePatchPayload {
  path: string;
  value: any;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Event Envelope
// ---------------------------------------------------------------------------

/**
 * SSE Event Envelope
 * Wraps all SSE events with metadata
 */
export interface SseEventEnvelope<T = any> {
  id: string;
  type: SseEventType;
  timestamp: string;
  userId: string;
  payload?: T;
  stats?: {
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    rating?: number;
  };
}

// ---------------------------------------------------------------------------
// Typed Event Interfaces
// ---------------------------------------------------------------------------

export interface XpUpdatedEvent extends SseEventEnvelope<XpUpdatedPayload> {
  type: 'xp_updated';
}

export interface LevelUpEvent extends SseEventEnvelope<LevelUpPayload> {
  type: 'level_up';
}

export interface StreakMilestoneEvent extends SseEventEnvelope<StreakMilestonePayload> {
  type: 'streak_milestone';
}

export interface StreakAtRiskEvent extends SseEventEnvelope<StreakAtRiskPayload> {
  type: 'streak_at_risk';
}

export interface AchievementUnlockedEvent extends SseEventEnvelope<AchievementUnlockedPayload> {
  type: 'achievement_unlocked';
}

export interface SyncStartedEvent extends SseEventEnvelope<SyncStartedPayload> {
  type: 'sync_started';
}

export interface SyncCompletedEvent extends SseEventEnvelope<SyncCompletedPayload> {
  type: 'sync_completed';
}

export interface SyncFailedEvent extends SseEventEnvelope<SyncFailedPayload> {
  type: 'sync_failed';
}

export interface NotificationCreatedEvent extends SseEventEnvelope<NotificationCreatedPayload> {
  type: 'notification_created';
}

export interface MissionCompletedEvent extends SseEventEnvelope<MissionCompletedPayload> {
  type: 'mission_completed';
}

export interface NewSubmissionEvent extends SseEventEnvelope<NewSubmissionPayload> {
  type: 'new_submission';
}

export interface RuntimeStatePatchEvent extends SseEventEnvelope<RuntimeStatePatchPayload> {
  type: 'runtime_state_patch';
}

export interface HeartbeatEvent extends SseEventEnvelope {
  type: 'heartbeat';
}

// ---------------------------------------------------------------------------
// Union Type
// ---------------------------------------------------------------------------

/**
 * Union of all possible SSE events
 */
export type SseEvent =
  | XpUpdatedEvent
  | LevelUpEvent
  | StreakMilestoneEvent
  | StreakAtRiskEvent
  | AchievementUnlockedEvent
  | SyncStartedEvent
  | SyncCompletedEvent
  | SyncFailedEvent
  | NotificationCreatedEvent
  | MissionCompletedEvent
  | NewSubmissionEvent
  | RuntimeStatePatchEvent
  | HeartbeatEvent;

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isXpUpdatedEvent(event: SseEvent): event is XpUpdatedEvent {
  return event.type === 'xp_updated';
}

export function isLevelUpEvent(event: SseEvent): event is LevelUpEvent {
  return event.type === 'level_up';
}

export function isStreakMilestoneEvent(event: SseEvent): event is StreakMilestoneEvent {
  return event.type === 'streak_milestone';
}

export function isStreakAtRiskEvent(event: SseEvent): event is StreakAtRiskEvent {
  return event.type === 'streak_at_risk';
}

export function isAchievementUnlockedEvent(event: SseEvent): event is AchievementUnlockedEvent {
  return event.type === 'achievement_unlocked';
}

export function isSyncCompletedEvent(event: SseEvent): event is SyncCompletedEvent {
  return event.type === 'sync_completed';
}

export function isSyncFailedEvent(event: SseEvent): event is SyncFailedEvent {
  return event.type === 'sync_failed';
}

export function isNotificationCreatedEvent(event: SseEvent): event is NotificationCreatedEvent {
  return event.type === 'notification_created';
}

export function isMissionCompletedEvent(event: SseEvent): event is MissionCompletedEvent {
  return event.type === 'mission_completed';
}

export function isNewSubmissionEvent(event: SseEvent): event is NewSubmissionEvent {
  return event.type === 'new_submission';
}

export function isRuntimeStatePatchEvent(event: SseEvent): event is RuntimeStatePatchEvent {
  return event.type === 'runtime_state_patch';
}

export function isHeartbeatEvent(event: SseEvent): event is HeartbeatEvent {
  return event.type === 'heartbeat';
}
