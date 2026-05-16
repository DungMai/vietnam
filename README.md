# vietnam — scaffold

10 AI agents, one per Tier-1 Vietnamese province. Bilingual EN/VI. Fixer-verified anti-scam content. Mission-led, $500/mo budget.

This is a **scaffolded skeleton** generated from the Studio specs in `../02-SPECS/` and `../03-DECISIONS/`. It boots, migrations apply cleanly, and the home + flagship-province routes render. Business logic stubs return `TODO`. Build from here.

---

## Stack

- **Runtime**: Next.js 15 (App Router, RSC, streaming)
- **DB**: Supabase Postgres + pgvector (unified vector index, province metadata filter)
- **LLM**: Vercel AI SDK with 3-tier routing — Gemini Flash-Lite default, Sonnet 4.5 swing, Haiku for translation
- **Hosting**: Vercel (Edge for OG cards + streaming chat)
- **Email**: Resend (15-min magic links)
- **Assets**: Cloudflare R2 (fixer-sourced photos only — see no-AI-imagery enforcement)
- **i18n**: parallel `*_en` / `*_vi` columns with NOT NULL CHECK constraints (single bilingual SKU)

## Spec map

| Implementation area | Source-of-truth spec |
|---|---|
| Tech stack rationale | `../03-DECISIONS/0001-tech-stack.md` |
| RAG + persona | `../03-DECISIONS/0002-rag-and-persona-architecture.md` |
| Cost monitoring | `../03-DECISIONS/0003-llm-cost-monitoring.md` |
| Anti-scam loop | `../02-SPECS/anti-scam-loop.md` |
| Content + fixer | `../02-SPECS/content-corpora-and-fixer.md` |
| Rate-limit + email gate | `../02-SPECS/anonymous-rate-limit-and-email-gate.md` |
| Bilingual content | `../02-SPECS/bilingual-content-and-rendering.md` |
| Trust citation rendering | `../02-SPECS/trust-citation-rendering.md` |
| TikTok share cards | `../02-SPECS/tiktok-share-cards.md` |

---

## Get it running

```bash
# 1. Install deps
pnpm install

# 2. Local Supabase
brew install supabase/tap/supabase
supabase start
# Copy keys output by `supabase start` into .env.local (see .env.example for shape)

# 3. Migrations + seed
pnpm db:migrate
pnpm db:seed

# 4. Ingest seeded facts into pgvector corpus
#    Needs GOOGLE_GENERATIVE_AI_API_KEY in .env.local
pnpm rag:ingest

# 5. Dev
pnpm dev
# → http://localhost:3000
```

## Project layout

```
app/
  layout.tsx            Root layout, bilingual locale provider
  page.tsx              Discovery feed (10 province cards)
  province/[slug]/
    page.tsx            Province landing (hero + tonight panel + scam-watch)
    chat/page.tsx       Chat with the province agent
  api/
    chat/route.ts       SSE streaming chat (see trust-citation-rendering §SSE)
    citation/route.ts   GET verified-fact payload
    report/route.ts     POST community scam report
    magic-link/route.ts POST email gate magic-link issue + GET callback
    og/route.tsx        @vercel/og share-card generation
components/              Stubs for design-system §6 inventory
lib/
  supabase/             Browser + server clients
  llm/                  3-tier router + provider adapters
  i18n/                 ?lang= canonical URL handling
  trust/                Citation payload assembly
supabase/
  migrations/           SQL migrations in spec order
  seed.sql              HCM (Sài Gòn) flagship + 1 fixer + 5 verified facts
types/domain.ts         Shared TS types matching SQL schemas
```

## What IS wired (Stage 4 pass — 2026-05-16)

- ✅ 3-tier LLM router (Gemini Flash-Lite / Sonnet 4.5 / Haiku 4.5) with kill-switch modes
- ✅ pgvector RAG retrieval via `match_corpus_chunk` RPC, province + lang filtered
- ✅ Gemini embeddings (1536-dim) for ingestion + query
- ✅ Anonymous session cookie (HMAC-signed) with 20-msg/day rolling cap
- ✅ Atomic rate-limit counter via `increment_session_msg` RPC
- ✅ Streaming chat endpoint with SSE token/citation/done events
- ✅ Per-province persona system prompts (10 personas, EN+VI)
- ✅ Inline `[^factId]` → CitationPill rendering on the client
- ✅ Citation modal with stale-flag + report-outdated CTA
- ✅ LLM cost logged to `llm_call_log` for daily rollup
- ✅ Ingestion CLI: `pnpm rag:ingest`

## What's NOT yet wired

- Magic-link email send (Resend API call inside `app/api/magic-link/route.ts` — schema exists, send call is TODO)
- Community report AI pre-screen (inserts to `community_report`, no AI screen yet)
- Asset pipeline (no-AI-imagery enforcement at upload — schema noted, no upload route yet)
- Stale fact demotion job (cron / supabase scheduled)
- Sentry hooks for cost alarms
- Admin / fixer dashboard (use Supabase Studio for Phase 1)
- Tests — Stage 5 (Harden) adds qa-engineer's test plan

## Likely small fixes you'll hit on first run

- AI SDK v4 model option shape may differ from what providers expect (Gemini embedding `providerOptions.google` keys). Adjust per current `@ai-sdk/google` docs if `embedMany` throws.
- Supabase nested select syntax for `fixer_signature(fixer:fixer(...))` may need a junction view. If the citation lookup in `/api/chat` returns empty `fixer`, drop the join and fetch fixer separately.
- `gemini-2.5-flash-lite` model ID — if Google bumps the version, update `MODEL.tier1Chat` in `lib/llm/providers.ts`.

## Locked decisions you cannot regress without re-running specs

- **No AI-generated imagery anywhere**, ever. (`STATUS.md` row 18 + `content-corpora-and-fixer.md` §4-checkpoint enforcement.)
- **"Sài Gòn" for persona voice fields; "TP.HCM" for admin labels.** Never mixed in one sentence. (`STATUS.md` row 19.)
- **Bilingual completeness enforced at SQL level** via NOT NULL CHECK on every `*_en` / `*_vi` pair.
- **Cache-hit rate ≥ 70%** is load-bearing for the $500/mo budget. (`0003-llm-cost-monitoring.md`.)

---

Built from Studio specs by CPO scaffold pass, 2026-05-16.
