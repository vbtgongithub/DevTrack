// src/shared/sse/index.ts — SSE module barrel export
export { eventBus } from './eventBus.js';
export type { SseClient, SseEvent, SseEventType, SseMetricsSnapshot } from './eventBus.js';
export { handleSseRequest } from './sseHandler.js';