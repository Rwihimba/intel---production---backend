import { Resend } from 'resend';

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }
    client = new Resend(key);
  }
  return client;
}

export const RESEND_FROM = process.env.RESEND_FROM ?? 'INTEL <noreply@intel.app>';
