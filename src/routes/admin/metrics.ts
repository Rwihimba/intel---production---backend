import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit, paramStr } from '../../utils/audit';
import { computeMetrics } from '../../services/metrics.service';

const router = Router();

const metricsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  program: z.enum(['fa', 'fla', 'both']).optional(),
});

const targetPatchSchema = z.object({
  target_value: z.number().positive(),
});

router.get('/metrics', requireAdmin, async (req: Request, res: Response) => {
  const parsed = metricsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query', code: 400, details: parsed.error.issues });
    return;
  }
  const { from, to, program } = parsed.data;
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 86400 * 1000);

  let programId: string | null = null;
  if (program && program !== 'both') {
    const code = program.toUpperCase();
    const { data: prog } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('org_id', req.user.org_id)
      .eq('code', code)
      .maybeSingle();
    programId = prog?.id ?? null;
  }

  const result = await computeMetrics(req.user.org_id, programId, fromDate, toDate);
  res.json({ data: result });
});

router.get('/targets', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('targets')
    .select('*')
    .eq('org_id', req.user.org_id)
    .order('key', { ascending: true });
  if (error) throw error;
  res.json({ data });
});

router.patch('/targets/:key', requireAdmin, async (req: Request, res: Response) => {
  const body = targetPatchSchema.parse(req.body);
  const key = paramStr(req.params.key);

  const { data: before } = await supabaseAdmin
    .from('targets')
    .select('*')
    .eq('org_id', req.user.org_id)
    .eq('key', key)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Target not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('targets')
    .update({ target_value: body.target_value, updated_by: req.user.id })
    .eq('org_id', req.user.org_id)
    .eq('key', key)
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'target.update',
    entityType: 'targets',
    entityId: key,
    before,
    after: data,
  });

  res.json({ data });
});

router.get('/alerts', requireAdmin, async (req: Request, res: Response) => {
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, watch: 2 };

  const { data, error } = await supabaseAdmin
    .from('alerts')
    .select('*')
    .eq('org_id', req.user.org_id)
    .is('resolved_at', null);
  if (error) throw error;

  const sorted = (data ?? []).slice().sort((a, b) => {
    const aOrder = severityOrder[a.severity] ?? 99;
    const bOrder = severityOrder[b.severity] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aTime = a.detected_at ? new Date(a.detected_at).getTime() : 0;
    const bTime = b.detected_at ? new Date(b.detected_at).getTime() : 0;
    return bTime - aTime;
  });

  res.json({ data: sorted });
});

export default router;
