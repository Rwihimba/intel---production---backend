import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit } from '../../utils/audit';

const router = Router();

const settingsSchema = z.object({
  working_days: z.array(z.string()).optional(),
  deal_cap_soft: z.number().int().positive().optional(),
  deal_cap_hard: z.number().int().positive().optional(),
  alert_threshold_pct: z.number().int().min(0).max(100).optional(),
  graduation_push_threshold_days: z.number().int().positive().optional(),
  timezone: z.string().optional(),
});

router.get('/settings', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (error) throw error;
  res.json({ data });
});

router.patch('/settings', requireAdmin, async (req: Request, res: Response) => {
  const body = settingsSchema.parse(req.body);

  const { data: before } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('org_id', req.user.org_id)
    .maybeSingle();

  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({ org_id: req.user.org_id, ...body }, { onConflict: 'org_id' })
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'settings.update',
    entityType: 'settings',
    entityId: req.user.org_id,
    before,
    after: data,
  });

  res.json({ data });
});

export default router;
