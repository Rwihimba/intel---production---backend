import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  if (err instanceof ZodError) {
    console.error(`[${timestamp}] ZodError:`, err.issues);
    res.status(400).json({
      error: 'Validation failed',
      code: 400,
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    console.error(`[${timestamp}] Error:`, err.stack ?? err.message);
    res.status(500).json({
      error: err.message,
      code: 500,
    });
    return;
  }

  console.error(`[${timestamp}] UnknownError:`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 500,
  });
}
