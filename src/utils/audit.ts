import { supabaseAdmin } from '../lib/supabase';
import type { Json } from '../types/database.types';

export interface AuditEntry {
  orgId: string;
  actorId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabaseAdmin.from('audit_log').insert({
    org_id: entry.orgId,
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    before_state: (entry.before ?? null) as Json | null,
    after_state: (entry.after ?? null) as Json | null,
    ip_address: entry.ipAddress ?? null,
  });
  if (error) {
    console.error(`[${new Date().toISOString()}] [audit_log] insert failed:`, error);
  }
}

export function nextWorkingDay(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  else if (day === 0) d.setDate(d.getDate() + 1);
  return d;
}

export function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export function queryStr(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}
