<!-- Thanks for the PR! Fill in each section briefly. PRs without context get bounced. -->

## What does this PR do?

<!-- 1–3 sentences. What changes? What user-visible effect? -->

## Why?

<!-- Link to issue if one exists: "Closes #123". If not, explain the motivation. -->

## How was this tested?

<!-- "pnpm dev + manual test on /province/hcm/chat" is fine for small changes.
     For RAG / trust / persona changes, describe how you verified output quality. -->

## Locked-invariant check

I confirm this PR does NOT touch (or, if it does, I've opened an RFC issue and tagged it `locked-decision-touched`):

- [ ] AI-generated imagery is not introduced anywhere
- [ ] Every new `*_en` / `*_vi` field has `NOT NULL CHECK (length(...) > 0)` (or is a documented exception like `corpus_chunk.lang`)
- [ ] "Sài Gòn" / "TP.HCM" naming convention preserved
- [ ] No code path bypasses the fixer-verification requirement for `verified_fact.state = 'published'`
- [ ] No citation rendering allows a non-existent `factId`
- [ ] License headers / files unchanged (or change is documented)

## Bilingual content (if applicable)

- [ ] Both `_en` and `_vi` provided for any new content
- [ ] Vietnamese diacritics tested in headings (check `+5% line-height` rule from `globals.css`)
- [ ] No translation that says different things in EN vs VI (semantic equivalence)
- [ ] N/A — this PR has no bilingual content

## Persona voice (if applicable)

- [ ] Province this affects: `<province:slug>`
- [ ] Voice change justified with cultural reasoning in PR description above
- [ ] Sample utterances updated in `lib/persona/personas.ts`
- [ ] N/A — this PR is not persona-related

## Sign-off

- [ ] All my commits are signed off (`git commit -s`) per DCO
- [ ] I have read [`CONTRIBUTING.md`](../CONTRIBUTING.md) and agree my contribution is MIT-licensed

## Screenshots / demo

<!-- For UI changes: before / after. For chat changes: paste a transcript. -->
