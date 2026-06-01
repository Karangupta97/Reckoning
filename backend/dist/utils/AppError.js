/**
 * Application error primitives.
 *
 * `AppError` is the single error type the API layer throws on purpose. The
 * global error handler inspects it to produce a safe, structured JSON
 * response. Anything that is NOT an `AppError` is treated as an unexpected
 * fault and collapsed to a generic 500 (no internals leaked to the client).
 */
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
    statusCode;
    /** Marks errors that are expected and safe to expose. Always `true` here. */
    isOperational;
    /** Stable, machine-readable error code (SNAKE_CASE). */
    code;
    /** Optional field-level details (e.g. Zod validation issues). */
    details;
    /** Extra client-safe fields merged into the response `error` object. */
    meta;
    /**
     * @param message    Client-safe error message.
     * @param statusCode HTTP status code (defaults to 500).
     * @param options    Optional code, field-level details, meta, and cause.
     */
    constructor(message, statusCode = 500, options = {}) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = options.code;
        this.details = options.details;
        this.meta = options.meta;
        if (options.cause !== undefined) {
            // Preserve the cause for server-side logging without exposing it.
            this.cause = options.cause;
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
    static validation(details, message = "Validation failed.") {
        return new AppError(message, 400, { code: "VALIDATION_ERROR", details });
    }
}
//# sourceMappingURL=AppError.js.map