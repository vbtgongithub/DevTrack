// src/infrastructure/queues/ErrorClassifier.ts
export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export class ErrorClassifier {
  /**
   * Classify standard generic errors based on their messages or properties
   */
  static classify(error: any): RetryableError | NonRetryableError {
    if (error instanceof RetryableError || error instanceof NonRetryableError) {
      return error;
    }

    const message = (error?.message || '').toLowerCase();
    
    // AI / Network typical transient errors
    if (
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('connection refused') ||
      message.includes('mongo') || // Basic mongo transient catch
      message.includes('lock') 
    ) {
      return new RetryableError(`[Transient] ${error.message}`, error);
    }

    // Default everything else to non-retryable to prevent poison messages looping
    return new NonRetryableError(`[Fatal] ${error.message || 'Unknown error'}`, error);
  }
}
