import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { ymd } from '../utils/audit';
import { kigaliNow } from '../utils/dateHelpers';

export const publicHealthRouter = Router();
export const authedHealthRouter = Router();

publicHealthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

authedHealthRouter.get('/me', async (req: Request, res: Response) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;
  const todayStr = ymd(kigaliNow());

  const [pendingResp, alertsResp, queueResp] = await Promise.all([
    supabaseAdmin
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('approval_status', 'pending_admin'),
    supabaseAdmin
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('resolved_at', null),
    role === 'agent' || role === 'ambassador'
      ? supabaseAdmin
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', userId)
          .eq('assigned_date', todayStr)
      : Promise.resolve({ count: 0 }),
  ]);

  res.json({
    user: req.user,
    counts: {
      pending_approvals: pendingResp.count ?? 0,
      active_alerts: alertsResp.count ?? 0,
      queue_size: queueResp.count ?? 0,
    },
  });
});
