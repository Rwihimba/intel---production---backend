import { Router, Request, Response } from 'express';
import { paramStr } from '../../utils/audit';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAmbassador } from '../../middleware/roleGuard.middleware';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  date: z.string(),
  expected_attendance: z.number().int().min(0).optional(),
  attendee_link: z.string().url().optional(),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  actual_attendance: z.number().int().min(0),
});

router.get('/events', requireAmbassador, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('ambassador_id', req.user.id)
    .order('date', { ascending: true });
  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const enriched = (data ?? []).map((e) => {
    const eventDate = new Date(e.date);
    const diffMs = eventDate.getTime() - today.getTime();
    const countdownDays = Math.ceil(diffMs / 86400000);
    return { ...e, countdown_days: countdownDays };
  });
  res.json({ data: enriched });
});

router.post('/events', requireAmbassador, async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);
  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({
      ambassador_id: req.user.id,
      org_id: req.user.org_id,
      name: body.name,
      location: body.location ?? null,
      date: body.date,
      expected_attendance: body.expected_attendance ?? 0,
      attendee_link: body.attendee_link ?? null,
      notes: body.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ data });
});

router.patch('/events/:id/complete', requireAmbassador, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);
  const body = completeSchema.parse(req.body);

  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('id')
    .eq('id', id)
    .eq('ambassador_id', req.user.id)
    .maybeSingle();
  if (!existing) {
    res.status(404).json({ error: 'Event not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update({
      status: 'completed',
      actual_attendance: body.actual_attendance,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  res.json({ data });
});

export default router;
