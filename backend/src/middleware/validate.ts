import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

/**
 * Middleware generator for validating Express requests with Zod schemas.
 */
export function validate(schema: ZodSchema, location: RequestLocation = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req[location]);
      req[location] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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
