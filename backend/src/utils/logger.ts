/**
 * Structured logger for the RoadWatch AI backend.
 *
 * Provides a minimal, zero-dependency structured logging interface. Each method
 * prefixes the output with a timestamp and level tag, making log aggregation
 * and searching straightforward.
 *
 * Replace the console-based implementation with a production logger (pino,
 * winston) when the need arises — the interface remains unchanged.
 */

/** Log levels supported by the logger. */
type LogLevel = "debug" | "info" | "warn" | "error";

/** ISO timestamp prefix for structured log output. */
function prefix(level: LogLevel): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
}

/**
 * Structured application logger.
 *
 * All methods are safe to call in any environment. They never throw.
 */
export const logger = {
  /**
   * Debug-level log (verbose, development-only insights).
   *
   * @param message Human-readable message.
   * @param meta    Optional structured data.
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.debug(prefix("debug"), message, meta ?? "");
  },

  /**
   * Informational log (normal operational events).
   *
   * @param message Human-readable message.
   * @param meta    Optional structured data.
   */
  info(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.info(prefix("info"), message, meta ?? "");
  },

  /**
   * Warning log (recoverable issues, degraded behaviour).
   *
   * @param message Human-readable message.
   * @param meta    Optional structured data.
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(prefix("warn"), message, meta ?? "");
  },

  /**
   * Error log (failures requiring attention).
   *
   * @param message Human-readable message.
   * @param meta    Optional structured data.
   */
  error(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(prefix("error"), message, meta ?? "");
  },
} as const;
