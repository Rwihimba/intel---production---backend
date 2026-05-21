import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { kigaliNow } from '../utils/dateHelpers';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function processOrg(orgId: string, orgName: string | null, today: Date): Promise<void> {
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 86400 * 1000);
  const fourteenStr = ymd(fourteenDaysAgo);

  const { data: learners, error: learnersErr } = await supabaseAdmin
    .from('learners')
    .select('id')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .not('phone_number', 'is', null);
  if (learnersErr) throw learnersErr;
  if (!learners || learners.length === 0) {
    console.log(
      `[${new Date().toISOString()}] [cold-lead-aging] org=${orgName ?? orgId} cold_leads_14plus_days=0`
    );
    return;
  }

  const learnerIds = learners.map((l) => l.id);

  const { data: deals, error: dealsErr } = await supabaseAdmin
    .from('deals')
    .select('learner_id, assigned_date')
    .in('learner_id', learnerIds)
    .order('assigned_date', { ascending: false });
  if (dealsErr) throw dealsErr;

  const latestByLearner = new Map<string, string>();
  for (const d of deals ?? []) {
    if (!d.assigned_date) continue;
    if (!latestByLearner.has(d.learner_id)) {
      latestByLearner.set(d.learner_id, d.assigned_date);
    }
  }

  let agingCount = 0;
  for (const lid of learnerIds) {
    const last = latestByLearner.get(lid);
    if (!last || last < fourteenStr) {
      agingCount += 1;
    }
  }

  console.log(
    `[${new Date().toISOString()}] [cold-lead-aging] org=${orgName ?? orgId} cold_leads_14plus_days=${agingCount}`
  );
}

export function startColdLeadAgingJob(): void {
  cron.schedule(
    '0 6 * * *',
    async () => {
      const today = kigaliNow();
      console.log(`[${new Date().toISOString()}] [cold-lead-aging] running for ${ymd(today)}`);

      const { data: orgs, error } = await supabaseAdmin
        .from('organisations')
        .select('id, name');

      if (error) {
        console.error(`[${new Date().toISOString()}] [cold-lead-aging] org query failed:`, error);
        return;
      }

      for (const org of orgs ?? []) {
        try {
          await processOrg(org.id, org.name, today);
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] [cold-lead-aging] org=${org.id} failed:`,
            err
          );
        }
      }
    },
    { timezone: 'Africa/Kigali' }
  );
}
