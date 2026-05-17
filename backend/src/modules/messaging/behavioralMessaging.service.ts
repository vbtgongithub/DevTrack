// src/modules/messaging/behavioralMessaging.service.ts — Orchestrates message selection
// Selects and sends behavioral messages based on user state and context

import { eventBus } from '../../shared/sse/eventBus.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';
import { messageArbiter } from './messageArbiter.js';
import { getTemplate } from './messageTemplates.js';
import type { IUnifiedRuntimeState } from '../../db/models/unifiedRuntimeState.model.js';

export interface BehavioralMessageRequest {
  userId: string;
  context: string;
  userState: IUnifiedRuntimeState;
}

export interface BehavioralMessageResult {
  sent: boolean;
  messageId?: string;
  template?: {
    tone: string;
    text: string;
    action?: { label: string; route: string };
  };
  reason?: string;
}

export class BehavioralMessagingService {
  /**
   * Select and send a behavioral message based on context and user state
   */
  async sendMessage(request: BehavioralMessageRequest): Promise<BehavioralMessageResult> {
    const { userId, context, userState } = request;

    try {
      // Determine tone based on user state
      const tone = this.determineTone(userState);

      // Get message priority
      const priority = messageArbiter.getPriority(context, {
        emotionalState: userState.emotionalState,
      });

      // Check if message should be sent (arbitration)
      const decision = await messageArbiter.shouldSend(userId, context, priority, {
        fatigueState: userState.fatigueState,
        emotionalState: userState.emotionalState,
      });

      if (!decision.allowed) {
        logger.info('[messaging] Message not allowed', {
          userId,
          context,
          reason: decision.reason,
        });
        return {
          sent: false,
          reason: decision.reason,
        };
      }

      // Get message template
      const template = getTemplate(context, tone);
      if (!template) {
        logger.warn('[messaging] No template found', { context, tone });
        return {
          sent: false,
          reason: 'no_template',
        };
      }

      // Generate message ID
      const messageId = `${context}-${userId}-${Date.now()}`;

      // Send via SSE
      await eventBus.emitBehavioralMessage(
        userId,
        messageId,
        template.tone as 'encouraging' | 'calm' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'silent',
        template.text,
        template.action,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour expiry
      );

      // Log decision to audit trail
      await this.logDecision(userId, messageId, context, tone, decision, template);

      logger.info('[messaging] Behavioral message sent', {
        userId,
        messageId,
        context,
        tone,
      });

      return {
        sent: true,
        messageId,
        template: {
          tone: template.tone,
          text: template.text,
          action: template.action,
        },
      };
    } catch (error) {
      logger.error('[messaging] Failed to send behavioral message', { error, userId, context });
      return {
        sent: false,
        reason: 'error',
      };
    }
  }

  /**
   * Determine message tone based on user emotional and fatigue state
   */
  private determineTone(userState: IUnifiedRuntimeState): string {
    const { emotionalState, fatigueState, recoveryState } = userState;

    // Recovery state takes precedence
    if (recoveryState === 'active') {
      return 'encouraging';
    }

    // High fatigue → calm tone
    if (fatigueState === 'high' || fatigueState === 'burnout') {
      return 'calm';
    }

    // Emotional state mapping
    switch (emotionalState) {
      case 'discouraged':
      case 'overwhelmed':
        return 'supportive';
      case 'motivated':
        return 'celebratory';
      case 'focused':
        return 'calm';
      case 'neutral':
        return 'encouraging';
      default:
        return 'encouraging';
    }
  }

  /**
   * Log messaging decision to Redis audit trail
   */
  private async logDecision(
    userId: string,
    messageId: string,
    context: string,
    tone: string,
    decision: { allowed: boolean; reason?: string },
    template: { tone: string; text: string }
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      const auditKey = `messaging:audit:${userId}`;
      const auditEntry = {
        messageId,
        context,
        tone,
        allowed: decision.allowed,
        reason: decision.reason,
        templateText: template.text,
        timestamp: new Date().toISOString(),
      };

      await redis.lpush(auditKey, JSON.stringify(auditEntry));
      await redis.ltrim(auditKey, 0, 99); // Keep last 100 entries
      await redis.expire(auditKey, 7 * 24 * 60 * 60); // 7 days retention
    } catch (error) {
      logger.error('[messaging] Failed to log decision', { error, userId, messageId });
    }
  }

  /**
   * Get message audit trail for a user
   */
  async getAuditTrail(userId: string, limit = 20): Promise<unknown[]> {
    try {
      const redis = getRedisClient();
      const auditKey = `messaging:audit:${userId}`;
      const entries = await redis.lrange(auditKey, 0, limit - 1);
      return entries.map((entry: string) => JSON.parse(entry));
    } catch (error) {
      logger.error('[messaging] Failed to get audit trail', { error, userId });
      return [];
    }
  }
}

export const behavioralMessagingService = new BehavioralMessagingService();
