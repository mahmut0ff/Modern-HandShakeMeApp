// Structured logging utility with correlation IDs

interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private log(level: string, message: string, data?: unknown): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...(data && { data }),
    };

    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: unknown): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('WARN', message, data);
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log('ERROR', message, { ...data, error: errorData });
  }

  debug(message: string, data?: unknown): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, data);
    }
  }
}

export const logger = new Logger();
