import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { supabaseAdmin } from '../lib/supabase';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        org_id: string;
        email: string;
        full_name: string;
        role: 'admin' | 'agent' | 'ambassador';
      };
    }
  }
}

// Supabase signs access tokens with asymmetric ES256 (ECC P-256) keys.
// We verify them locally against the project's public JWKS. jose fetches
// the key set once and caches it in memory, refreshing only when a token's
// `kid` is missing from the cache — so there is ZERO Supabase Auth network
// round-trip per request (the old getUser() call is gone).
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, { algorithms: ['ES256'] });

    if (!payload.sub) {
      res.status(401).json({ error: 'Unauthorized', code: 401 });
      return;
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, org_id, email, full_name, role, is_active')
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized', code: 401 });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ error: 'Account is deactivated', code: 401 });
      return;
    }

    req.user = {
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
  }
}
