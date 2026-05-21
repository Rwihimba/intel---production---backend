import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { getResend, RESEND_FROM } from '../lib/resend';
import { kigaliNow } from '../utils/dateHelpers';

const DEFAULT_SOFT_CAP = 30;

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function loadSoftCap(orgId: string): Promise<number> {
  const { data: row } = await supabaseAdmin
    .from('settings')
    .select('deal_cap_soft')
    .eq('org_id', orgId)
    .maybeSingle();
  return row?.deal_cap_soft ?? DEFAULT_SOFT_CAP;
}

async function processOrg(orgId: string, todayStr: string): Promise<void> {
  const softCap = await loadSoftCap(orgId);
  const threshold = Math.floor(softCap * 0.67);

  const { data: agents } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .in('role', ['agent', 'ambassador']);

  for (const agent of agents ?? []) {
    if (!agent.email) continue;

    const { count: attempts, error: countErr } = await supabaseAdmin
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('assigned_date', todayStr)
      .neq('status', 'pending');

    if (countErr) {
      console.error(
        `[${new Date().toISOString()}] [agent-reminder] count failed for agent=${agent.id}:`,
        countErr
      );
      continue;
    }

    const done = attempts ?? 0;
    if (done >= threshold) continue;

    const remaining = Math.max(0, softCap - done);
    if (remaining === 0) continue;

    try {
      await getResend().emails.send({
        from: RESEND_FROM,
        to: agent.email,
        subject: `INTEL — ${remaining} deals still waiting today`,
        text: `Hi ${agent.full_name ?? 'there'}, you have ${remaining} deals remaining in your queue today. Your team is counting on you. View your queue: ${process.env.FRONTEND_URL ?? ''}/agent`,
      });
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] [agent-reminder] email failed for agent=${agent.id}:`,
        err
      );
    }
  }
}

export function startAgentReminderJob(): void {
  cron.schedule(
    '0 16 * * 1-5',
    async () => {
      const todayStr = ymd(kigaliNow());
      console.log(`[${new Date().toISOString()}] [agent-reminder] running for ${todayStr}`);

      const { data: orgs, error } = await supabaseAdmin
        .from('organisations')
        .select('id');

      if (error) {
        console.error(`[${new Date().toISOString()}] [agent-reminder] org query failed:`, error);
        return;
      }

      for (const org of orgs ?? []) {
        try {
          await processOrg(org.id, todayStr);
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] [agent-reminder] org=${org.id} failed:`,
            err
          );
        }
      }
    },
    { timezone: 'Africa/Kigali' }
  );
}
