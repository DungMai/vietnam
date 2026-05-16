# Security

## Reporting a vulnerability

**Do not open a public issue.** Email `dung@newera.inc` with subject line `SECURITY: <short description>`.

Expected response time: 72 hours to acknowledge, 14 days to triage and propose mitigation. We will credit the reporter in the fix release unless they prefer anonymity.

## Scope

In scope:

- The `vietnam` web application (this repo)
- Supabase schema and RPC functions
- Any code under `app/`, `lib/`, `components/`, `scripts/`, `supabase/`
- LLM prompt injection that bypasses citation / trust guarantees
- Bilingual content tampering (e.g. EN says one thing, VI says another)
- Anonymous-session / rate-limit bypass
- Cookie / magic-link auth issues

Out of scope (please don't report):

- Reports of generic AI being wrong about Vietnam (that's the wedge we exploit, not a bug)
- Issues in third-party services (Supabase, Vercel, Google AI, Anthropic, Resend) — report to them
- Spam / abuse on community surfaces (report to maintainers via normal channels)

## What counts as "trust wedge" security

Beyond classic OWASP, this project has a unique class of bug:

- **Hallucinated fact masquerading as verified**: if an LLM response shows a `[^factId]` citation that doesn't trace back to a real, fixer-signed row in `verified_fact` — that's a critical security issue. Treat it like injection.
- **Fixer impersonation**: if a community report or fact appears to be signed by a fixer who didn't sign it — critical.
- **No-AI-imagery bypass**: if a user-facing image is ever AI-generated despite our pipeline — critical (this kills the brand).

Please report these as security issues, not feature requests.

## Disclosure

We coordinate disclosure with the reporter. Default window: 30 days from acknowledgment to public disclosure, longer if mitigation requires migration.

## Responsible AI considerations

If you discover that our system reliably gives harmful advice (e.g. recommending a place that scams or harms users), that's a P0 fact-correction emergency — report via security email, NOT a public issue. We will block the response and demote the underlying fact within 24h.
