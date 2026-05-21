import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin, requireAgent } from '../../middleware/roleGuard.middleware';

const router = Router();

async function buildBreakdown(orgId: string, agentId: string | null) {
  let q = supabaseAdmin
    .from('value_ledger')
    .select(
      `
      id, value_rwf, event_label, status, credited_at, created_at,
      deal_id,
      deals(deal_type, learner_id, learners(first_name, last_name))
    `
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (agentId) q = q.eq('agent_id', agentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const deal = row.deals as unknown as
      | {
          deal_type: string | null;
          learners: { first_name: string; last_name: string } | null;
        }
      | null;
    return {
      id: row.id,
      date: row.credited_at ?? row.created_at,
      learner_name: deal?.learners
        ? `${deal.learners.first_name} ${deal.learners.last_name}`
        : null,
      deal_type: deal?.deal_type ?? null,
      event_label: row.event_label,
      value_rwf: row.value_rwf,
      status: row.status,
    };
  });
}

router.get('/value/me', requireAgent, async (req: Request, res: Response) => {
  const breakdown = await buildBreakdown(req.user.org_id, req.user.id);
  const total = breakdown
    .filter((b) => b.status === 'credited')
    .reduce((s, b) => s + (b.value_rwf ?? 0), 0);
  res.json({ data: { total_credited_rwf: total, breakdown } });
});

router.get('/value', requireAdmin, async (req: Request, res: Response) => {
  const agentId = typeof req.query.agent_id === 'string' ? req.query.agent_id : null;
  const breakdown = await buildBreakdown(req.user.org_id, agentId);
  const total = breakdown
    .filter((b) => b.status === 'credited')
    .reduce((s, b) => s + (b.value_rwf ?? 0), 0);
  res.json({ data: { total_credited_rwf: total, breakdown } });
});

export default router;
