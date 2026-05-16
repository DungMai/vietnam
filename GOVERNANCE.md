# Governance

How decisions get made in the `vietnam` project. Light-weight by design. We are an open source community project, not a foundation; this is a working document, not a legal one.

---

## Roles

| Role | Who | What they can do |
|---|---|---|
| **Owner** | Dung Mai ([@DungMai](https://github.com/DungMai)) | Final say on locked invariants, license, major direction; manages repo settings, releases, secrets |
| **Maintainer** | (Vacant — opens as trust builds) | Review and merge PRs; triage issues; propose roadmap items; cannot change locked invariants |
| **Reviewer** | (Promoted from contributors) | Approve PRs (1 approval required for merge to `main`); cannot merge directly |
| **Contributor** | Anyone with a merged PR | Recognized in release notes |
| **Fixer** | Paid local verifiers (separate from code contributors) | Sign verified facts in the DB; no GitHub permissions implied |

How to become a Reviewer / Maintainer:
- **Reviewer**: 3+ merged PRs of solid quality OR meaningful issue triage over 1+ month → ping owner in an issue with subject "Reviewer nomination: @yourhandle"
- **Maintainer**: 6+ months as active Reviewer with consistent good judgment, AND has demonstrated understanding of the locked invariants (no-AI-imagery, bilingual completeness, fixer trust loop) → owner promotes by adding to CODEOWNERS

---

## Locked invariants (cannot be changed by PR alone)

These are the product. Changing them is a strategic pivot, not a PR. PRs that touch these get the `locked-decision-touched` label and require **owner approval** plus a documented rationale.

1. **10 Tier-1 provinces** as the V1 scope (not 34, not 63). Tier-2 expansion requires Phase 2 conversation.
2. **No AI-generated imagery anywhere**, ever. See [`docs/NO_AI_IMAGERY.md`](docs/NO_AI_IMAGERY.md).
3. **Bilingual EN/VI completeness** enforced at SQL level. See [`docs/BILINGUAL.md`](docs/BILINGUAL.md).
4. **Fixer-verified trust loop** — `verified_fact` requires a `fixer_signature_id` to reach `state = 'published'`.
5. **"Sài Gòn" persona / "TP.HCM" admin** naming split (and parallel rule for other provinces).
6. **MIT license for the core repo**. (Future commercial features may be built as separate proprietary extensions — see "Future commercial" below.)
7. **Mission framing** — culture education + anti-scam travel + foreign-business intel. Other use cases require Owner conversation, not just a PR.

---

## Decision flow

```
Issue/proposal → Discussion → PR (if code) or RFC issue (if design)
              → Reviewer approval (1+) + CI passing
              → Merge to main
              → Released in next batch
```

For non-code changes (roadmap, persona voice direction, new province priorities):
- Open an **RFC issue** with the `rfc` label
- Discussion stays open at least 7 days
- Owner makes the final call after community input; reasoning posted in the issue close

For locked-invariant proposals (very rare):
- Open RFC issue with `locked-decision-touched` label
- Discussion stays open at least 14 days
- Owner decides; if approved, GOVERNANCE.md and relevant `docs/` are updated in the same PR

---

## Future commercial

The OSS core (this repo) is and will remain **MIT-licensed**. If proprietary / paid features are built in the future, they will live in **separate repositories** (not this one). The boundary:

- ✅ MIT-licensed core: chat surface, RAG, persona system, citation rendering, anti-scam loop, bilingual rendering, share cards, basic admin
- 🔒 Possible future closed/proprietary (separate repo): premium fixer marketplace, B2B tourism-board dashboards, deep historical archives, AI translation premium tiers

Contributors to this repo retain copyright over their contributions under the MIT terms. Building closed-source features on top of MIT-licensed code is allowed by the license itself — no contributor permission needed for that path.

We **do not** use a CLA. We **do** ask contributors to sign-off commits (`git commit -s`) per [DCO](https://developercertificate.org/) — a lightweight "I have the right to submit this" attestation. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Conflict resolution

If reviewers disagree on a PR:
1. Discuss in the PR comments.
2. If unresolved after 3 days, ping the Owner.
3. Owner decides; reasoning is posted.

If a contributor and reviewer disagree on a fact correction:
1. The fixer for that province (or another fixer rotation if conflict of interest) has authority.
2. If no fixer is available, the fact is marked `state = 'demoted'` pending review — better to show "we don't know" than to show wrong.

---

## Changes to this document

Open a PR. Label it `governance`. Discussion stays open 7 days minimum. Owner approval required to merge.
