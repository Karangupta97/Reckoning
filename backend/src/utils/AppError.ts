/**
 * Application error primitives.
 *
 * `AppError` is the single error type the API layer throws on purpose. The
 * global error handler inspects it to produce a safe, structured JSON
 * response. Anything that is NOT an `AppError` is treated as an unexpected
 * fault and collapsed to a generic 500 (no internals leaked to the client).
 */

/** A single field-level validation problem, surfaced to API consumers. */
export interface FieldError {
  /** Dotted path to the offending field, e.g. `"password"`. */
  field: string;
  /** Human-readable, safe-to-expose message. */
  message: string;
}

/** Optional extras accepted by the {@link AppError} constructor. */
export interface AppErrorOptions {
  /** Stable, machine-readable error code (SNAKE_CASE), e.g. `INVALID_CREDENTIALS`. */
  code?: string;
  /** Field-level details (typically from Zod validation). */
  details?: ReadonlyArray<FieldError>;
  /**
   * Extra, client-safe fields merged into the response `error` object
   * (e.g. `{ minutesRemaining: 12 }` for a lockout). Must never contain
   * secrets — it is serialised verbatim to the client.
   */
  meta?: Readonly<Record<string, unknown>>;
  /** Underlying cause, kept server-side only (never serialised). */
  cause?: unknown;
}

/**
 * Operational, expected error carrying an HTTP status code.
 *
 * Throw this anywhere in the service/controller layers when you want a
 * specific HTTP status and a client-safe message. Never put secrets,
 * stack traces, or third-party error internals into `message`.
 *
 * @example
 * throw new AppError("Invalid email or password", 401, { code: "INVALID_CREDENTIALS" });
 */
export class AppError extends Error {
  /** HTTP status code to send to the client. */
  public readonly statusCode: number;

  /** Marks errors that are expected and safe to expose. Always `true` here. */
  public readonly isOperational: boolean;

  /** Stable, machine-readable error code (SNAKE_CASE). */
  public readonly code?: string;

  /** Optional field-level details (e.g. Zod validation issues). */
  public readonly details?: ReadonlyArray<FieldError>;

  /** Extra client-safe fields merged into the response `error` object. */
  public readonly meta?: Readonly<Record<string, unknown>>;

  /**
   * @param message    Client-safe error message.
   * @param statusCode HTTP status code (defaults to 500).
   * @param options    Optional code, field-level details, meta, and cause.
   */
  constructor(message: string, statusCode = 500, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = options.code;
    this.details = options.details;
    this.meta = options.meta;
    if (options.cause !== undefined) {
      // Preserve the cause for server-side logging without exposing it.
      (this as { cause?: unknown }).cause = options.cause;
    }
    // Restore prototype chain (required when targeting ES5/ES2015 classes).
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, AppError);
  }

  /**
   * Convenience factory for 400 Bad Request validation failures.
   *
   * @param details Field-level validation problems.
   * @param message Optional summary message.
   */
  public static validation(
    details: ReadonlyArray<FieldError>,
    message = "Validation failed.",
  ): AppError {
    return new AppError(message, 400, { code: "VALIDATION_ERROR", details });
  }
}
