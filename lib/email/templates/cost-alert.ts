interface Args {
  tierBreaches: Array<{ tier: 1 | 2 | 3; cost7d: number; threshold: number }>;
  totalCost7d: number;
  severity: 'warning' | 'critical';
}

/**
 * Cost-alarm email — sent to FOUNDER_ALERT_EMAIL when LLM spend breaches thresholds.
 * See 03-DECISIONS/0003-llm-cost-monitoring.md §alarms.
 */
export const costAlertEmail = ({ tierBreaches, totalCost7d, severity }: Args) => {
  const subj =
    severity === 'critical'
      ? '🚨 vietnam.app — LLM cost CRITICAL'
      : '⚠️ vietnam.app — LLM cost warning';

  const lines = tierBreaches.map(
    (b) => `Tier ${b.tier}: $${b.cost7d.toFixed(2)} over 7 days (threshold $${b.threshold})`,
  );

  const text =
    `${severity === 'critical' ? 'CRITICAL' : 'WARNING'}: LLM spend exceeded threshold.\n\n` +
    `Total last 7 days: $${totalCost7d.toFixed(2)}\n\n` +
    `Breached tiers:\n${lines.map((l) => `  - ${l}`).join('\n')}\n\n` +
    `Suggested actions (in order):\n` +
    `  1. Check cache-hit rate in llm_cost_daily view\n` +
    `  2. If hit rate dropped, investigate the prompt/retrieval pipeline\n` +
    `  3. Toggle LLM kill-switch to 'cheap-only' temporarily\n` +
    `  4. If sustained, raise the $500/mo budget or cut a feature\n\n` +
    `Run \`pnpm dev\` and visit /admin/cost (when wired) for the full breakdown.`;

  const html =
    `<!doctype html><html><body style="font-family:Inter,sans-serif;color:#1A1A1A;padding:24px;">` +
    `<h2 style="color:${severity === 'critical' ? '#8B1A1A' : '#D9A24A'};">${subj}</h2>` +
    `<p>Total last 7 days: <strong>$${totalCost7d.toFixed(2)}</strong></p>` +
    `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` +
    `<p style="margin-top:24px;color:#4A4A4A;">Suggested actions: cache-hit check → router kill-switch → budget review.</p>` +
    `</body></html>`;

  return { subject: subj, text, html };
};
