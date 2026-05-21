import { Router, Request, Response } from 'express';
import { paramStr } from '../../utils/audit';
import multer from 'multer';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { getQueue } from '../../lib/queue';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const uploadFormSchema = z.object({
  program_id: z.string().uuid(),
  sheet_type: z.enum(['health', 'activity']),
});

const STORAGE_BUCKET = 'uploads';
const CSV_QUEUE = 'csv-processing';
const ROLLBACK_QUEUE = 'csv-rollback';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

router.post('/uploads', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'file is required (multipart field "file")', code: 400 });
    return;
  }

  const parsed = uploadFormSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      code: 400,
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    });
    return;
  }
  const { program_id, sheet_type } = parsed.data;

  const { data: program } = await supabaseAdmin
    .from('programs')
    .select('id')
    .eq('id', program_id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!program) {
    res.status(404).json({ error: 'Program not found', code: 404 });
    return;
  }

  const timestamp = Date.now();
  const objectPath = `${req.user.org_id}/${program_id}/${sheet_type}/${timestamp}.csv`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, req.file.buffer, {
      contentType: 'text/csv',
      upsert: false,
    });
  if (uploadErr) {
    res.status(500).json({ error: `storage upload failed: ${uploadErr.message}`, code: 500 });
    return;
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
  if (signErr || !signed?.signedUrl) {
    res.status(500).json({ error: `signed url failed: ${signErr?.message}`, code: 500 });
    return;
  }

  const job = await getQueue(CSV_QUEUE).add('process', {
    fileUrl: signed.signedUrl,
    objectPath,
    programId: program_id,
    sheetType: sheet_type,
    orgId: req.user.org_id,
    uploadedBy: req.user.id,
  });

  res.status(202).json({ job_id: job.id, status: 'processing' });
});

router.get('/uploads/status/:job_id', requireAdmin, async (req: Request, res: Response) => {
  const job = await getQueue(CSV_QUEUE).getJob(paramStr(req.params.job_id));
  if (!job) {
    res.status(404).json({ error: 'Job not found', code: 404 });
    return;
  }
  const state = await job.getState();
  const progress = job.progress;
  const result = state === 'completed' ? job.returnvalue : undefined;
  const error = state === 'failed' ? job.failedReason : undefined;
  res.json({ status: state, progress, result, error });
});

router.get('/uploads', requireAdmin, async (req: Request, res: Response) => {
  const programId = typeof req.query.program_id === 'string' ? req.query.program_id : null;

  let q = supabaseAdmin
    .from('upload_history')
    .select('*')
    .eq('org_id', req.user.org_id)
    .eq('is_active', true)
    .order('uploaded_at', { ascending: false })
    .limit(6);
  if (programId) q = q.eq('program_id', programId);

  const { data, error } = await q;
  if (error) throw error;
  res.json({ data });
});

router.delete('/uploads/:id/rollback', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);

  const { data: row, error: lookupErr } = await supabaseAdmin
    .from('upload_history')
    .select('id, org_id, program_id, sheet_type, file_url')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  if (!row) {
    res.status(404).json({ error: 'Upload not found', code: 404 });
    return;
  }

  await getQueue(ROLLBACK_QUEUE).add('rollback', {
    uploadHistoryId: row.id,
    orgId: row.org_id,
    programId: row.program_id,
    sheetType: row.sheet_type,
    fileUrl: row.file_url,
    requestedBy: req.user.id,
  });

  res.status(202).json({ status: 'rollback_queued' });
});

export default router;
