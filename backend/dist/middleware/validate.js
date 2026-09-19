"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
/**
 * Middleware generator for validating Express requests with Zod schemas.
 */
function validate(schema, location = 'body') {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req[location]);
            req[location] = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Bad Request',
                    message: 'Input validation failed',
                    issues: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
