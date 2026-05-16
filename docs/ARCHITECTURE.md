# Architecture

A 1-page overview. For deep reading, source-of-truth specs live in [`02-SPECS/`](https://github.com/DungMai/vietnam/tree/main/02-SPECS) (not yet copied into the repo — open an issue if you want them in-repo).

## Request flow

```
Browser
  │  POST /api/chat { provinceSlug, message, locale }
  ▼
Next.js Node route
  │  ── 1. session cookie → anonymous_session
  │  ── 2. rate-limit check (RPC increment_session_msg)
  │  ── 3. RAG retrieval (RPC match_corpus_chunk, province + lang filtered)
  │  ── 4. pickTier({ retrievalConfidence })
  │  ── 5. buildSystemPrompt(persona + facts)
  │  ── 6. streamText() via @ai-sdk
  │
  ▼  SSE stream: meta → citation (preload) → token...token → done
Browser
  │  ChatSurface parses events
  │  [^factId] markers → CitationPill
  │  click → CitationModal
```

## 3-tier LLM router

| Tier | Model | When | Cost / 1M output |
|---|---|---|---|
| 1 | Gemini 2.5 Flash-Lite | Default for chat with retrieval confidence ≥ 0.55 | ~$0.30 |
| 2 | Sonnet 4.5 | Escalation: retrieval confidence < 0.55 OR complex narrative | ~$15 |
| 3 | Haiku 4.5 | Translation only (VI → EN editor pass) | ~$5 |

Implementation: [`lib/llm/router.ts`](../lib/llm/router.ts) + [`lib/llm/providers.ts`](../lib/llm/providers.ts).

Kill-switch modes: `normal` / `cheap-only` / `translate-only` / `kill` — used if costs spike beyond the $500/mo envelope.

## RAG — unified pgvector, province-filtered

One pgvector index, filtered at query time by `province_id` + `lang`. We chose this over 10 separate indexes to keep ops simple — one fixer demotion is one atomic SQL UPDATE that invalidates the response cache via FK trigger.

- Embedding: Gemini `gemini-embedding-001`, configured to 1536 dims
- Index: HNSW on `corpus_chunk.embedding` (cosine)
- Retrieval: SQL function `match_corpus_chunk(query_embedding, province_id, lang, k, min_similarity)`
- Confidence: `1 - cosine_distance` of top result (used by router)

Implementation: [`lib/rag/`](../lib/rag/) + migration [`0003_corpus_and_facts.sql`](../supabase/migrations/0003_corpus_and_facts.sql).

## Persona layer

Each of the 10 provinces has a persona spec in [`lib/persona/personas.ts`](../lib/persona/personas.ts) — voice markers, archetype, sample utterances (used for few-shot), never-says (anti-cringe), cultural sensitivity flags.

System prompt is assembled at request time: persona section + trust rules + retrieved facts (with `[^factId]` citation IDs) + bilingual rules.

Persona is **not** in the DB. It's code, versioned with Git. Voice changes require PR review.

## Trust loop (the wedge)

Facts are written by fixers (paid local verifiers, monthly rotation). Each fact:

1. Drafted (`state: 'draft'`)
2. Reviewed by fixer (`state: 'fixer_review'`)
3. Signed → `fixer_signature` row + `state: 'published'` + `expires_at: now() + 30 days`
4. After 30 days → `state: 'stale'` (still shown but flagged)
5. Demoted by community report or fixer re-review → `state: 'demoted'` (hidden)

Per-province quality score is computed from `province_quality_score` view: pct of published facts verified within 30 days. Cached nightly to `province.quality_score_cached`.

Implementation: migration [`0003`](../supabase/migrations/0003_corpus_and_facts.sql) + spec [`anti-scam-loop`](https://github.com/DungMai/vietnam/tree/main/02-SPECS/anti-scam-loop.md) (in Studio).

## Anonymous session + email gate

- Cookie `vn_sess` = `<sessionId>.<hmac>` — HMAC-signed, httpOnly, sameSite=lax
- Pre-gate cap: 20 messages / 24h rolling window
- Post-gate cap (email verified via magic link): 80 / 24h
- Magic link: 15-min single-use, sent via Resend
- Email-attached anonymous is NOT a user account — no profile, no social, no password

Implementation: [`lib/session/cookie.ts`](../lib/session/cookie.ts) + migrations `0004` + `0008`.

## Bilingual

Single SKU, one URL. Locale is `?lang=` URL param (default `en`).

Schema rule: every user-facing string is `*_en` + `*_vi` with `NOT NULL CHECK (length(...) > 0)` on both. Exception: `corpus_chunk.lang` discriminator (one chunk = one language per pgvector convention).

See [`BILINGUAL.md`](BILINGUAL.md).

## Stack at a glance

- **Runtime**: Next.js 15 App Router + RSC + streaming. Edge for OG cards, Node for chat (needs cookies + crypto).
- **DB**: Supabase Postgres + pgvector + Auth (anonymous).
- **LLM**: Vercel AI SDK + @ai-sdk/google + @ai-sdk/anthropic.
- **Email**: Resend.
- **Assets**: Cloudflare R2 (no-AI-imagery enforced — see [`NO_AI_IMAGERY.md`](NO_AI_IMAGERY.md)).
- **Hosting**: Vercel.
- **Budget**: $500/mo all-in (Gemini Flash-Lite default + 70% cache hit + 2 rotating fixers).
