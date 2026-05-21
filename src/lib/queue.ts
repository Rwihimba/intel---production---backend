import { Queue, Worker, Processor, JobsOptions } from 'bullmq';
import IORedis, { Redis } from 'ioredis';

let connection: Redis | null = null;

function getConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('Missing REDIS_URL environment variable');
  }
  if (!connection) {
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, {
    connection: getConnection(),
    defaultJobOptions,
  });
  queues.set(name, queue);
  return queue;
}

export function createWorker(name: string, processor: Processor): Worker {
  const worker = new Worker(name, processor, {
    connection: getConnection(),
  });

  worker.on('error', (err: Error) => {
    console.error(`[${new Date().toISOString()}] [worker:${name}] error:`, err);
  });

  worker.on('failed', (job, err) => {
    if (!job) {
      console.error(
        `[${new Date().toISOString()}] [worker:${name}] job failed (no job context): ${err.message}`
      );
      return;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      const dealId =
        (job.data && typeof job.data === 'object' && 'dealId' in job.data
          ? (job.data as { dealId?: unknown }).dealId
          : undefined) ?? 'n/a';
      console.error(
        `[${new Date().toISOString()}] [worker:${name}] job ${job.id} failed after ${job.attemptsMade} attempts (deal=${String(dealId)}): ${err.message}`
      );
    }
  });

  return worker;
}
