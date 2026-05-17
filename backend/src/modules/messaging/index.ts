// src/modules/messaging/index.ts — Messaging module barrel export
export { behavioralMessagingService } from './behavioralMessaging.service.js';
export type { BehavioralMessageRequest, BehavioralMessageResult } from './behavioralMessaging.service.js';
export { messageArbiter } from './messageArbiter.js';
export type { MessageDecision, MessagePriority } from './messageArbiter.js';
export { getTemplate } from './messageTemplates.js';
export type { MessageTemplate } from './messageTemplates.js';
