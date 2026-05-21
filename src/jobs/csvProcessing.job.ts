import { Job, Worker } from 'bullmq';
import { createWorker } from '../lib/queue';
import {
  processHealthSheet,
  processActivitySheet,
} from '../services/csvProcessor.service';

interface CsvJobData {
  fileUrl: string;
  objectPath?: string;
  programId: string;
  sheetType: 'health' | 'activity';
  orgId: string;
  uploadedBy: string;
}

interface RollbackJobData {
  uploadHistoryId: string;
  orgId: string;
  programId: string | null;
  sheetType: 'health' | 'activity';
  fileUrl: string | null;
  requestedBy: string;
}

async function processCsvJob(job: Job<CsvJobData>): Promise<unknown> {
  const { fileUrl, programId, sheetType, orgId, uploadedBy } = job.data;
  await job.updateProgress(10);
  const result =
    sheetType === 'health'
      ? await processHealthSheet(fileUrl, programId, orgId, uploadedBy)
      : await processActivitySheet(fileUrl, programId, orgId, uploadedBy);
  await job.updateProgress(100);
  return result;
}

async function processRollbackJob(job: Job<RollbackJobData>): Promise<unknown> {
  console.log(
    `[${new Date().toISOString()}] [csv-rollback] queued for upload=${job.data.uploadHistoryId}`
  );
  return { status: 'queued', upload_history_id: job.data.uploadHistoryId };
}

export function startCsvProcessingWorker(): Worker {
  return createWorker('csv-processing', processCsvJob as unknown as Parameters<typeof createWorker>[1]);
}

export function startCsvRollbackWorker(): Worker {
  return createWorker('csv-rollback', processRollbackJob as unknown as Parameters<typeof createWorker>[1]);
}
