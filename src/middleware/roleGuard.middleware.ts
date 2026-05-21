import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'agent' | 'ambassador';

function forbidden(res: Response): void {
  res.status(403).json({ error: 'Forbidden', code: 403 });
}

function guard(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowed.includes(req.user.role)) {
      forbidden(res);
      return;
    }
    next();
  };
}

export const requireAdmin = guard(['admin']);
export const requireAgent = guard(['agent']);
export const requireAmbassador = guard(['ambassador']);
export const requireAgentOrAmbassador = guard(['agent', 'ambassador']);
