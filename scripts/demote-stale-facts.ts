/**
 * Daily stale-fact demotion.
 * Calls the SQL function demote_stale_facts() (migration 0010).
 *
 * Run via:
 *   pnpm db:demote-stale
 *
 * Schedule options (pick one when deploying):
 *   - Supabase scheduled function (pg_cron via Database → Cron in dashboard)
 *   - GitHub Actions workflow on a schedule
 *   - cron-job.org hitting an authenticated /api/cron endpoint
 *   - External scheduler (Vercel cron / Trigger.dev / etc.)
 *
 * The script uses the service role key — DO NOT expose to the browser.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase.rpc('demote_stale_facts');
  if (error) {
    console.error('demote_stale_facts failed:', error.message);
    process.exit(2);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const demotedCount = row?.demoted_count ?? 0;
  const sampleIds: string[] = row?.sample_ids ?? [];

  console.log(JSON.stringify({
    startedAt,
    finishedAt: new Date().toISOString(),
    demotedCount,
    sampleIds: sampleIds.slice(0, 10),
  }));

  if (demotedCount > 0) {
    console.log(`✓ Demoted ${demotedCount} stale facts.`);
  } else {
    console.log('No stale facts to demote.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
