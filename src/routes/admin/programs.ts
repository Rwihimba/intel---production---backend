import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit, paramStr } from '../../utils/audit';

const router = Router();

const programCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  total_courses: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

const programUpdateSchema = programCreateSchema.partial();

const courseCreateSchema = z.object({
  sequence_number: z.number().int().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

const courseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const deliverableCreateSchema = z.object({
  sequence_number: z.number().int().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

const deliverableUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const reorderSchema = z.object({
  course_ids: z.array(z.string().uuid()).min(1),
});

const reorderDeliverablesSchema = z.object({
  deliverable_ids: z.array(z.string().uuid()).min(1),
});

function allowAuthenticatedRead(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  next();
}

router.get('/programs', allowAuthenticatedRead, async (req: Request, res: Response) => {
  const { data: programs, error: programsErr } = await supabaseAdmin
    .from('programs')
    .select('id, code, name, description, total_courses, is_active')
    .eq('org_id', req.user.org_id)
    .order('code', { ascending: true });
  if (programsErr) throw programsErr;
  if (!programs || programs.length === 0) {
    res.json({ data: [] });
    return;
  }

  const programIds = programs.map((p) => p.id);

  const { data: courses, error: coursesErr } = await supabaseAdmin
    .from('courses')
    .select('id, program_id, sequence_number, name, description, is_active')
    .in('program_id', programIds)
    .order('sequence_number', { ascending: true });
  if (coursesErr) throw coursesErr;

  const courseIds = (courses ?? []).map((c) => c.id);
  let deliverables: Array<{
    id: string;
    course_id: string;
    sequence_number: number;
    name: string;
    description: string | null;
    is_active: boolean | null;
  }> = [];
  if (courseIds.length > 0) {
    const { data: dels, error: delsErr } = await supabaseAdmin
      .from('deliverables')
      .select('id, course_id, sequence_number, name, description, is_active')
      .in('course_id', courseIds)
      .order('sequence_number', { ascending: true });
    if (delsErr) throw delsErr;
    deliverables = dels ?? [];
  }

  const tree = programs.map((p) => ({
    ...p,
    courses: (courses ?? [])
      .filter((c) => c.program_id === p.id)
      .map((c) => ({
        ...c,
        deliverables: deliverables.filter((d) => d.course_id === c.id),
      })),
  }));

  res.json({ data: tree });
});

router.post('/programs', requireAdmin, async (req: Request, res: Response) => {
  const body = programCreateSchema.parse(req.body);
  const { data, error } = await supabaseAdmin
    .from('programs')
    .insert({
      org_id: req.user.org_id,
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      total_courses: body.total_courses ?? 0,
      is_active: body.is_active ?? true,
      created_by: req.user.id,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'program.create',
    entityType: 'programs',
    entityId: data.id,
    after: data,
  });

  res.status(201).json({ data });
});

router.patch('/programs/:id', requireAdmin, async (req: Request, res: Response) => {
  const body = programUpdateSchema.parse(req.body);
  const id = paramStr(req.params.id);

  const { data: before } = await supabaseAdmin
    .from('programs')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Program not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('programs')
    .update(body)
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'program.update',
    entityType: 'programs',
    entityId: id,
    before,
    after: data,
  });

  res.json({ data });
});

router.post('/programs/:id/courses', requireAdmin, async (req: Request, res: Response) => {
  const body = courseCreateSchema.parse(req.body);
  const programId = paramStr(req.params.id);

  const { data: program } = await supabaseAdmin
    .from('programs')
    .select('id')
    .eq('id', programId)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!program) {
    res.status(404).json({ error: 'Program not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      program_id: programId,
      org_id: req.user.org_id,
      sequence_number: body.sequence_number,
      name: body.name,
      description: body.description ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'course.create',
    entityType: 'courses',
    entityId: data.id,
    after: data,
  });

  res.status(201).json({ data: { ...data, deliverables: [] } });
});

router.patch('/courses/:id', requireAdmin, async (req: Request, res: Response) => {
  const body = courseUpdateSchema.parse(req.body);
  const id = paramStr(req.params.id);

  const { data: before } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Course not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(body)
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'course.update',
    entityType: 'courses',
    entityId: id,
    before,
    after: data,
  });

  res.json({ data });
});

router.post('/courses/reorder', requireAdmin, async (req: Request, res: Response) => {
  const body = reorderSchema.parse(req.body);

  for (let i = 0; i < body.course_ids.length; i += 1) {
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ sequence_number: i + 1 })
      .eq('id', body.course_ids[i])
      .eq('org_id', req.user.org_id);
    if (error) throw error;
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'course.reorder',
    entityType: 'courses',
    after: body,
  });

  res.json({ success: true });
});

router.post('/courses/:id/deliverables', requireAdmin, async (req: Request, res: Response) => {
  const body = deliverableCreateSchema.parse(req.body);
  const courseId = paramStr(req.params.id);

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!course) {
    res.status(404).json({ error: 'Course not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .insert({
      course_id: courseId,
      org_id: req.user.org_id,
      sequence_number: body.sequence_number,
      name: body.name,
      description: body.description ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deliverable.create',
    entityType: 'deliverables',
    entityId: data.id,
    after: data,
  });

  res.status(201).json({ data });
});

router.patch('/deliverables/:id', requireAdmin, async (req: Request, res: Response) => {
  const body = deliverableUpdateSchema.parse(req.body);
  const id = paramStr(req.params.id);

  const { data: before } = await supabaseAdmin
    .from('deliverables')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Deliverable not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .update(body)
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deliverable.update',
    entityType: 'deliverables',
    entityId: id,
    before,
    after: data,
  });

  res.json({ data });
});

router.delete('/deliverables/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);

  const { data: before } = await supabaseAdmin
    .from('deliverables')
    .select('*, course_id')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Deliverable not found', code: 404 });
    return;
  }

  const { count: learnersInProgress } = await supabaseAdmin
    .from('learner_course_progress')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', before.course_id)
    .eq('course_status', 'in_progress');

  const { error } = await supabaseAdmin
    .from('deliverables')
    .update({ is_active: false })
    .eq('id', id)
    .eq('org_id', req.user.org_id);
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deliverable.soft_delete',
    entityType: 'deliverables',
    entityId: id,
    before,
    after: { is_active: false, learners_in_progress: learnersInProgress ?? 0 },
  });

  res.json({
    success: true,
    warning:
      (learnersInProgress ?? 0) > 0
        ? `${learnersInProgress} learners are currently on this course`
        : null,
  });
});

router.post('/deliverables/reorder', requireAdmin, async (req: Request, res: Response) => {
  const body = reorderDeliverablesSchema.parse(req.body);

  for (let i = 0; i < body.deliverable_ids.length; i += 1) {
    const { error } = await supabaseAdmin
      .from('deliverables')
      .update({ sequence_number: i + 1 })
      .eq('id', body.deliverable_ids[i])
      .eq('org_id', req.user.org_id);
    if (error) throw error;
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deliverable.reorder',
    entityType: 'deliverables',
    after: body,
  });

  res.json({ success: true });
});

export default router;
