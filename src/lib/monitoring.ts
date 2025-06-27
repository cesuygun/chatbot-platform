// Simple monitoring and error tracking system
// In production, you'd want to use services like Sentry, LogRocket, or DataDog

export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  timestamp: Date;
}

export interface PerformanceEvent {
  name: string;
  duration: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

class MonitoringService {
  private errors: ErrorEvent[] = [];
  private performance: PerformanceEvent[] = [];
  private maxLogs = 1000; // Keep last 1000 events in memory

  logError(error: Error | string, context?: Record<string, unknown>, userId?: string) {
    const errorEvent: ErrorEvent = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      userId,
      timestamp: new Date(),
    };

    this.errors.push(errorEvent);
    
    // Keep only the last maxLogs errors
    if (this.errors.length > this.maxLogs) {
      this.errors = this.errors.slice(-this.maxLogs);
    }

    // In production, send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService('error', errorEvent);
    }

    console.error('Application Error:', errorEvent);
  }

  logPerformance(name: string, duration: number, metadata?: Record<string, unknown>) {
    const performanceEvent: PerformanceEvent = {
      name,
      duration,
      metadata,
      timestamp: new Date(),
    };

    this.performance.push(performanceEvent);
    
    // Keep only the last maxLogs performance events
    if (this.performance.length > this.maxLogs) {
      this.performance = this.performance.slice(-this.maxLogs);
    }

    // In production, send to external service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService('performance', performanceEvent);
    }

    console.log(`Performance: ${name} took ${duration}ms`, metadata);
  }

  private sendToExternalService(type: 'error' | 'performance', event: ErrorEvent | PerformanceEvent) {
    // In production, implement sending to external monitoring service
    // Example: Sentry, LogRocket, DataDog, etc.
    
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production') {
      console.log(`[${type.toUpperCase()}]`, event);
    }
  }

  getErrors(limit = 50): ErrorEvent[] {
    return this.errors.slice(-limit);
  }

  getPerformance(limit = 50): PerformanceEvent[] {
    return this.performance.slice(-limit);
  }

  clearLogs() {
    this.errors = [];
    this.performance = [];
  }
}

export const monitoring = new MonitoringService();

// Performance measurement decorator
export const measurePerformance = (name: string) => {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        monitoring.logPerformance(name, duration, { method: propertyKey });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        monitoring.logPerformance(name, duration, { 
          method: propertyKey, 
          error: true 
        });
        throw error;
      }
    };

    return descriptor;
  };
};

// Error boundary helper
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      monitoring.logError(
        error instanceof Error ? error : String(error),
        { context, args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg) }
      );
      throw error;
    }
  };
};

// API response monitoring
export const monitorApiResponse = (response: Response, endpoint: string) => {
  if (!response.ok) {
    monitoring.logError(`API Error: ${response.status} ${response.statusText}`, {
      endpoint,
      status: response.status,
      statusText: response.statusText,
    });
  }
}; 