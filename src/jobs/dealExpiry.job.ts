import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { kigaliNow } from '../utils/dateHelpers';
import type { Enums } from '../types/database.types';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function severityFor(ratio: number): Enums<'alert_severity'> {
  if (ratio >= 0.5) return 'critical';
  if (ratio >= 0.4) return 'warning';
  return 'watch';
}

async function processOrg(orgId: string, todayStr: string): Promise<void> {
  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from('deals')
    .select('id, agent_id')
    .eq('org_id', orgId)
    .eq('assigned_date', todayStr)
    .eq('status', 'pending');
  if (pendingErr) throw pendingErr;
  if (!pending || pending.length === 0) return;

  const ids = pending.map((d) => d.id);
  const { error: updateErr } = await supabaseAdmin
    .from('deals')
    .update({
      status: 'attempted',
      outcome_positive: false,
      reason_category: 'no_contact',
      reason_detail: 'Deal expired — not attempted today',
    })
    .in('id', ids);
  if (updateErr) throw updateErr;

  const expiredByAgent = new Map<string, number>();
  for (const d of pending) {
    if (!d.agent_id) continue;
    expiredByAgent.set(d.agent_id, (expiredByAgent.get(d.agent_id) ?? 0) + 1);
  }

  for (const [agentId, expiredCount] of expiredByAgent) {
    const { count: totalCount, error: countErr } = await supabaseAdmin
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('assigned_date', todayStr);
    if (countErr) {
      console.error(
        `[${new Date().toISOString()}] [deal-expiry] count failed for agent=${agentId}:`,
        countErr
      );
      continue;
    }
    const total = totalCount ?? 0;
    if (total === 0) continue;

    const ratio = expiredCount / total;
    if (ratio > 0.3) {
      const expiredPct = Math.round(ratio * 1000) / 10;
      const { error: alertErr } = await supabaseAdmin.from('alerts').insert({
        org_id: orgId,
        metric_key: `deal_expiry_rate:${agentId}`,
        current_value: expiredPct,
        target_value: 30,
        gap_pct: expiredPct - 30,
        severity: severityFor(ratio),
        screen_link: `/admin/agents/${agentId}`,
      });
      if (alertErr) {
        console.error(
          `[${new Date().toISOString()}] [deal-expiry] alert insert failed for agent=${agentId}:`,
          alertErr
        );
      }
    }
  }

  console.log(
    `[${new Date().toISOString()}] [deal-expiry] org=${orgId} expired=${pending.length}`
  );
}

export function startDealExpiryJob(): void {
  cron.schedule(
    '0 22 * * 1-5',
    async () => {
      const todayStr = ymd(kigaliNow());
      console.log(`[${new Date().toISOString()}] [deal-expiry] running for ${todayStr}`);

      const { data: orgs, error } = await supabaseAdmin
        .from('organisations')
        .select('id');

      if (error) {
        console.error(`[${new Date().toISOString()}] [deal-expiry] org query failed:`, error);
        return;
      }

      for (const org of orgs ?? []) {
        try {
          await processOrg(org.id, todayStr);
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] [deal-expiry] org=${org.id} failed:`,
            err
          );
        }
      }
    },
    { timezone: 'Africa/Kigali' }
  );
}
