/**
 * Daily cost alarm check.
 *
 * Queries the `llm_cost_daily` view (migration 0006) for the last 7 days,
 * compares against per-tier thresholds (03-DECISIONS/0003-llm-cost-monitoring.md),
 * and emails the founder via Resend if any threshold is breached.
 *
 * Run via:
 *   pnpm cost:check
 *
 * Schedule daily via the same scheduler that runs db:demote-stale.
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { costAlertEmail } from '../lib/email/templates/cost-alert';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@vietnam.app';
const FOUNDER_EMAIL = process.env.FOUNDER_ALERT_EMAIL;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Thresholds from 03-DECISIONS/0003-llm-cost-monitoring.md §alarms
const THRESHOLDS_7D = { 1: 40, 2: 25, 3: 20 } as const;
const TOTAL_WARNING = 60;
const TOTAL_CRITICAL = 100;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface CostRow {
  tier: 1 | 2 | 3;
  total_cost_usd: number | string;
}

async function main() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('llm_cost_daily')
    .select('tier, total_cost_usd')
    .gte('day', sevenDaysAgo);

  if (error) {
    console.error('llm_cost_daily query failed:', error.message);
    process.exit(2);
  }

  const byTier: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const row of (data ?? []) as CostRow[]) {
    const tier = Number(row.tier) as 1 | 2 | 3;
    byTier[tier] = (byTier[tier] ?? 0) + Number(row.total_cost_usd);
  }
  const total = byTier[1] + byTier[2] + byTier[3];

  const breaches: Array<{ tier: 1 | 2 | 3; cost7d: number; threshold: number }> = [];
  for (const tier of [1, 2, 3] as const) {
    if (byTier[tier] > THRESHOLDS_7D[tier]) {
      breaches.push({ tier, cost7d: byTier[tier], threshold: THRESHOLDS_7D[tier] });
    }
  }

  const severity: 'warning' | 'critical' | null =
    total >= TOTAL_CRITICAL ? 'critical' : total >= TOTAL_WARNING || breaches.length > 0 ? 'warning' : null;

  console.log(JSON.stringify({
    period: `7d ending ${new Date().toISOString().slice(0, 10)}`,
    byTier,
    total,
    breaches,
    severity,
  }));

  if (!severity) {
    console.log('✓ All cost thresholds within budget.');
    return;
  }

  if (!FOUNDER_EMAIL || !RESEND_KEY) {
    console.warn('FOUNDER_ALERT_EMAIL or RESEND_API_KEY not set — printing alert only.');
    return;
  }

  const tmpl = costAlertEmail({ tierBreaches: breaches, totalCost7d: total, severity });
  const resend = new Resend(RESEND_KEY);
  const { data: sent, error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: FOUNDER_EMAIL,
    subject: tmpl.subject,
    html: tmpl.html,
    text: tmpl.text,
    tags: [
      { name: 'kind', value: 'cost-alert' },
      { name: 'severity', value: severity },
    ],
  });
  if (sendErr) {
    console.error('Alert email send failed:', sendErr.message);
    process.exit(3);
  }
  console.log(`✓ Alert email sent: ${sent?.id ?? 'unknown id'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
