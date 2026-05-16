# The anti-scam loop

This is the wedge. The reason this product exists vs Perplexity / ChatGPT / Google AI Overviews.

## The problem

Generic AI hallucinates about Vietnam. Documented examples:

- Perplexity recommended **Cai Be floating market** to a tourist — it's been closed since COVID.
- ChatGPT confidently described **restaurants in Saigon that no longer exist** with current-sounding hours.
- Google AI Overviews lists tourist taxi prices that are 3× the actual metered fare.

Generic AI cannot get these facts right because:
- Training data is months/years old.
- No source attribution per fact.
- No incentive to say "I don't know."

## The loop

```
   ┌─ Fixer trip (monthly rotation, 2 fixers / 10 provinces)
   │
   ▼
verified_fact (draft) → fixer_review → published (state machine in migration 0003)
   │                                    └─ requires fixer_signature row
   ▼
corpus_chunk (embedded into pgvector, lang-discriminated)
   │
   ▼
Chat retrieval ──► LLM with FACTS section + citation rule
                    │
                    ▼
                  Response with [^factId] markers
                    │
                    ▼ (client renders to CitationPill)
                  User sees ✓ Verified by Linh — Apr 2026
                    │
                    ▼ (tap)
                  CitationModal: full fact + source + "Report outdated"
                    │
                    └─► community_report → fixer review → fact demoted or refreshed
```

## The state machine (verified_fact.state)

```
draft ───► fixer_review ───► published ───► stale (30+ days)
                              │
                              └──► demoted (by community report or fixer re-review)
```

Published facts MUST have `fixer_signature_id` set. Enforced by SQL CHECK constraint. No code path bypasses this.

## "We don't know" — the honesty rule

When retrieval returns nothing (or only stale facts), the system prompt instructs the model to reply with the `dontKnow` copy from [`lib/i18n/locale.ts`](../lib/i18n/locale.ts):

> "We don't have a fixer-verified answer for that yet. Here's what we know without verification —"

We **prefer honesty over polish**. A user who hears "we don't know" once trusts the verified answer the next time. A user who catches us bluffing once never trusts us again.

## Per-province quality score

Computed from view `province_quality_score`:

```sql
score = pct(published facts with verified_at >= now() - 30 days)
```

Shown to users as a chip on every province card and chat header (e.g. "Cần Thơ: 72% Verified Local"). This is **intentionally visible** even when low — honesty over polish.

Cached to `province.quality_score_cached` nightly to avoid recomputation per request.

## Community reports

Anyone can submit a scam report via the issue template or in-product flow. Reports are queued, AI pre-screened (Tier 1 Gemini Flash-Lite for spam filter), then fixer-reviewed.

Tier promotion rules (in `scam_warning.tier`):

| Tier | Trigger |
|---|---|
| `advisory` | 1 fixer signature OR 3 corroborating community reports |
| `alert` | Fixer escalation OR 7 reports in 14 days |
| `red` | Fixer red-flag OR 15 reports in 7 days |

## Why this is a 12–18 month moat

Generic AI will catch up — they always do. But the moat compounds:
- **Year 1**: Fixer-verified facts about post-2025 reform that generic AI still trains on old maps (e.g. "Phú Quốc is in An Giang now"). Closes by mid-2027 as generic AI retrains.
- **Year 1–onwards**: Brand recognition + community moat — fixers are paid, reviewers are credited, contributors care. The community moat outlasts the freshness moat.

This is documented in the project's [`00-IDEA.md`](https://github.com/DungMai/vietnam/blob/main/00-IDEA.md) (in Studio — open an issue if you want it in-repo).
