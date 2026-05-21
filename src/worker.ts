import 'dotenv/config';
import { startDealDispatchJob } from './jobs/dealDispatch.job';
import { startAgentReminderJob } from './jobs/agentReminder.job';
import { startMetricRefreshJob } from './jobs/metricRefresh.job';
import { startColdLeadAgingJob } from './jobs/coldLeadAging.job';
import { startDealExpiryJob } from './jobs/dealExpiry.job';
import {
  startCsvProcessingWorker,
  startCsvRollbackWorker,
} from './jobs/csvProcessing.job';

function main(): void {
  startDealDispatchJob();
  startAgentReminderJob();
  startMetricRefreshJob();
  startColdLeadAgingJob();
  startDealExpiryJob();

  startCsvProcessingWorker();
  startCsvRollbackWorker();

  console.log('Worker started — 5 jobs registered');
  console.log('  deal-dispatch:  0 7 * * 1-5');
  console.log('  agent-reminder: 0 16 * * 1-5');
  console.log('  metric-refresh: */5 * * * *');
  console.log('  cold-lead-aging: 0 6 * * *');
  console.log('  deal-expiry:    0 22 * * 1-5');
  console.log('Queue workers attached: csv-processing, csv-rollback');
}

try {
  main();
} catch (err) {
  console.error('Worker failed to start:', err);
  process.exit(1);
}
