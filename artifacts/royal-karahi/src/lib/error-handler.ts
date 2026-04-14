/**
 * Centralized Production Error Handler
 * Supports levels and contextual logging for enterprise observability.
 */

type ErrorLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";

interface ErrorContext {
  userId?: string | number;
  route?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class ProductionLogger {
  /**
   * Logs an event with context and level.
   * In Vercel/Production, this outputs to stdout for aggregation.
   */
  static log(level: ErrorLevel, message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      level,
      message,
      timestamp,
      context,
    };

    // Logging to console (which Vercel/Next logs capture)
    switch (level) {
      case "ERROR":
      case "CRITICAL":
        console.error(JSON.stringify(payload));
        break;
      case "WARN":
        console.warn(JSON.stringify(payload));
        break;
      default:
        console.log(JSON.stringify(payload));
    }

    // In a real enterprise app, we would also send to Sentry/Datadog here:
    // Sentry.captureMessage(message, { level, extra: context });
  }

  static error(message: string, context?: ErrorContext) {
    this.log("ERROR", message, context);
  }

  static warn(message: string, context?: ErrorContext) {
    this.log("WARN", message, context);
  }

  static info(message: string, context?: ErrorContext) {
    this.log("INFO", message, context);
  }
}
