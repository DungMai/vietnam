# Roadmap

Living document. Open an issue tagged `roadmap` to propose changes.

## Phase 1 (now → 2027-02) — Make 10 provinces credible

**Goal**: 10 Tier-1 provinces, each with enough fixer-verified content to demonstrably out-answer generic AI on local-specific questions.

**Success criteria** (from Studio STATUS.md row 8):
- 10K MAU + NPS ≥ 50 (6 months)
- All 10 Tier-1 provinces have verified-deep content (9 months)
- Ops cost ≤ $500/mo, runway ≥ 24 months

**In progress / shipped**:
- ✅ Tech stack (Next.js 15 + Supabase + Vercel + R2)
- ✅ RAG + 3-tier LLM router
- ✅ 10 persona system prompts
- ✅ Anti-scam loop (verified_fact state machine)
- ✅ Anonymous session + rate-limit
- ✅ Citation streaming + modal
- ✅ HCM seed data + 1 fixer (Linh-HCM)
- ✅ OSS pivot (this commit)

**Phase 1 todo** (open as issues):
- [ ] Magic-link email send (Resend wiring inside `/api/magic-link`)
- [ ] Community report AI pre-screen
- [ ] Asset upload + 4-checkpoint no-AI-imagery pipeline
- [ ] Stale fact demotion (scheduled job)
- [ ] Per-tier Sentry cost alarms
- [ ] Mobile chat UI polish
- [ ] Hà Nội seed data + fixer recruitment
- [ ] Đà Nẵng seed data + fixer recruitment
- [ ] Huế seed data + fixer recruitment
- [ ] TikTok share card asset selection (when assets exist)
- [ ] Tests — qa-engineer plan from Studio Stage 5

## Phase 2 (2027-Q1 → 2027-Q4) — Cultural depth

**Goal**: Move from "scam-aware travel info" to "the place to understand Vietnam through chat."

- Long-form cultural essays per province (history, festivals, food traditions)
- Direction B art upgrade — commissioned folk-modern motifs per province (10 illustrators, named credit)
- Diaspora-oriented feature: "What's happening in [Sài Gòn] this week" (verified)
- Bilingual content authoring UI for fixers (currently Supabase Studio is enough)

## Phase 3 (2027–onwards) — Tier 2 expansion + foreign business explorer

**Goal**: Broaden coverage + serve the third ICP.

- Tier-2 province coverage (24 provinces with AI-baseline + opt-in fixer upgrade)
- Foreign-business-explorer features: market entry, regional strengths, regulatory context — requires separate B2B sales motion
- Open data dump of verified facts (CC-BY-SA, separate from this MIT repo's code)
- Possible open-core: paid "verified concierge" tier for travelers with complex itineraries

## Not in scope (won't do)

- Bookings or payments — this is not an OTA
- Social features (follow, comment, profile) beyond chat history
- Full user accounts beyond email-attached anonymous
- Generative AI imagery — see [`NO_AI_IMAGERY.md`](NO_AI_IMAGERY.md)
- Coverage of provinces outside the 34 post-2025 administrative units (e.g. resurrecting pre-reform names as primary entities)
- Expansion to other countries (this is `vietnam` — that's the name)

## How decisions get made

See [`GOVERNANCE.md`](../GOVERNANCE.md). Locked-invariant changes go through 14-day RFC; everything else is normal PR review.
