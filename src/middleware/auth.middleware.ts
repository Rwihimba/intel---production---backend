import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseClient } from '../lib/supabase';

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

function unauthorized(res: Response): Response {
  return res.status(401).json({ error: 'Unauthorized', code: 401 });
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.header('Authorization') ?? req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    unauthorized(res);
    return;
  }

  const token = header.slice(7).trim();
  if (!token) {
    unauthorized(res);
    return;
  }

  const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !authData?.user) {
    unauthorized(res);
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, org_id, email, full_name, role, is_active')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.is_active === false) {
    unauthorized(res);
    return;
  }

  req.user = {
    id: profile.id,
    org_id: profile.org_id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
  };

  next();
}
