import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin, requireAgent } from '../../middleware/roleGuard.middleware';

const router = Router();

const npsSchema = z.object({
  learner_id: z.string().uuid(),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(2000).optional(),
});

router.post('/nps', requireAgent, async (req: Request, res: Response) => {
  const body = npsSchema.parse(req.body);

  const { data: learner, error: learnerErr } = await supabaseAdmin
    .from('learners')
    .select('id, org_id')
    .eq('id', body.learner_id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (learnerErr) throw learnerErr;
  if (!learner) {
    res.status(404).json({ error: 'Learner not found', code: 404 });
    return;
  }

  const { error: insertErr } = await supabaseAdmin.from('nps_responses').insert({
    learner_id: body.learner_id,
    org_id: req.user.org_id,
    score: body.score,
    comment: body.comment ?? null,
    collected_by_agent_id: req.user.id,
  });
  if (insertErr) throw insertErr;

  await supabaseAdmin.from('value_ledger').insert({
    org_id: req.user.org_id,
    agent_id: req.user.id,
    deal_id: null,
    event_label: 'NPS Collection',
    value_rwf: 100,
    status: 'credited',
    credited_at: new Date().toISOString(),
  });

  res.status(201).json({ success: true });
});

router.get('/nps', requireAdmin, async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? req.query.from : null;
  const to = typeof req.query.to === 'string' ? req.query.to : null;

  let q = supabaseAdmin
    .from('nps_responses')
    .select('id, score, comment, collected_at, learner_id, learners(first_name, last_name)')
    .eq('org_id', req.user.org_id)
    .order('collected_at', { ascending: false });
  if (from) q = q.gte('collected_at', from);
  if (to) q = q.lte('collected_at', to);

  const { data, error } = await q;
  if (error) throw error;

  const rows = data ?? [];
  const scores = rows.map((r) => r.score ?? 0);
  const count = rows.length;
  const avgScore = count > 0 ? scores.reduce((s, v) => s + v, 0) / count : null;

  const distribution: Record<number, number> = {};
  for (let i = 0; i <= 10; i += 1) distribution[i] = 0;
  for (const r of rows) {
    if (typeof r.score === 'number') distribution[r.score] = (distribution[r.score] ?? 0) + 1;
  }

  const recent = rows.slice(0, 10).map((r) => {
    const learnerRel = r.learners as unknown as { first_name: string; last_name: string } | null;
    return {
      id: r.id,
      score: r.score,
      comment: r.comment,
      collected_at: r.collected_at,
      learner_name: learnerRel ? `${learnerRel.first_name} ${learnerRel.last_name}` : null,
    };
  });

  res.json({
    avg_score: avgScore,
    count,
    distribution,
    recent,
  });
});

export default router;
