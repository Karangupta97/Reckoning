/**
 * Zod validation middleware.
 *
 * Wraps a Zod schema describing the `body`, `query`, and/or `params` of a
 * request. On success the parsed (and coerced) values replace the originals
 * so downstream handlers receive clean, typed data. On failure it throws an
 * {@link AppError} with field-level details, which the global error handler
 * renders as a 400 response.
 */
import { AppError } from "../utils/AppError.js";
/**
 * Flatten a `ZodError` into the API's field-level error shape.
 *
 * @param error  The Zod error to convert.
 * @param prefix Segment name (`body`/`query`/`params`) prepended to paths.
 * @returns Field-level error descriptors.
 */
function toFieldErrors(error, prefix) {
    return error.issues.map((issue) => {
        const path = issue.path.join(".");
        return {
            field: path ? `${prefix}.${path}` : prefix,
            message: issue.message,
        };
    });
}
/**
 * Build an Express middleware that validates the configured request segments.
 *
 * @param schemas Map of `body`/`query`/`params` Zod schemas to apply.
 * @returns Express middleware enforcing the schemas.
 *
 * @example
 * router.post("/register", validate({ body: registerSchema }), controller.register);
 */
export function validate(schemas) {
    return (req, _res, next) => {
        const fieldErrors = [];
        for (const segment of ["body", "query", "params"]) {
            const schema = schemas[segment];
            if (!schema)
                continue;
            const result = schema.safeParse(req[segment]);
            if (result.success) {
                // Express 5 `req.query`/`req.params` are getter-only; assign safely.
                Object.defineProperty(req, segment, {
                    value: result.data,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                });
            }
            else {
                fieldErrors.push(...toFieldErrors(result.error, segment));
            }
        }
        if (fieldErrors.length > 0) {
            next(AppError.validation(fieldErrors));
            return;
        }
        next();
    };
}
//# sourceMappingURL=validate.js.map