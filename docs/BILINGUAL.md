# Bilingual EN / VI — the rules

Single SKU. One brand. One repository. **No** split-language deployments.

## SQL convention

Every user-facing string column is **parallel** `*_en` / `*_vi`, both `NOT NULL CHECK (length(...) > 0)`.

```sql
-- ✅ correct
create table province (
    display_name_persona_en text not null check (length(display_name_persona_en) > 0),
    display_name_persona_vi text not null check (length(display_name_persona_vi) > 0),
    ...
);

-- ❌ wrong — schema can't enforce bilingual completeness
create table province (
    display_name jsonb  -- { en, vi } — no CHECK to ensure both exist
);

-- ❌ wrong — orphan-row risk
create table province_translation (
    province_id uuid,
    lang text,           -- can have rows for one lang and not other
    display_name text
);
```

**Exception**: `corpus_chunk` uses a `lang` discriminator. Each chunk is embedded in one language for ANN retrieval. The pair is enforced upstream (you only embed a chunk in VI if the source fact has both `*_en` and `*_vi`).

## Content type matrix

| Type | EN required | VI required | Notes |
|---|---|---|---|
| `verified_fact.body` | yes | yes | Schema CHECK |
| `province.display_name_persona` | yes | yes | Schema CHECK |
| `province.display_name_admin` | yes | yes | Schema CHECK |
| `province.persona_archetype` | yes | yes | Schema CHECK |
| `province.legacy_admin_note` | both-or-neither | both-or-neither | Schema CHECK constraint `legacy_note_bilingual_pair` |
| `scam_warning.title` / `body` | yes | yes | Schema CHECK |
| `community_report.body` | one-of (user input) | one-of | `body_lang` discriminator — we don't force user to translate |
| `corpus_chunk.body` | one-of | one-of | `lang` discriminator (embeddings are per-language) |
| Code, commit messages, comments | English only | — | Lingua franca for global contributors |

## Diacritic typography

Vietnamese has 134 unique diacritic combinations. Many typefaces mis-handle them.

- **Use**: Inter + Be Vietnam Pro (sans), Source Serif Pro / Crimson Pro (serif), JetBrains Mono.
- **Avoid**: Times New Roman, default macOS fonts that don't ship Vietnamese subsets, "free Google fonts" without explicit VI coverage.

Rendering rule: VN headings get **+5% line-height** (defined in [`app/globals.css`](../app/globals.css)) to prevent diacritic clash with descenders.

## Toggle UX

- Lives at the top-right of every page (component: [`BilingualToggle`](../components/BilingualToggle.tsx))
- URL param `?lang=en` or `?lang=vi`
- Persistent per session via cookie (locale stored on `anonymous_session.locale`)
- `<html lang>` updates accordingly so screen readers and font fallback work

## Translation workflow

For new verified facts: fixers write in VN (their native language), AI (Tier 3 Haiku) translates to EN, an EN editor pass reviews. The reviewed EN goes to `body_en`.

We do **not** auto-publish AI translations without review. Quality of EN is part of the wedge.

## What to test in a bilingual PR

Before opening a PR that touches user-facing strings:

1. ✅ Both `_en` and `_vi` filled
2. ✅ Same meaning in both (no Easter eggs, no "Vietnamese gets the spicier version")
3. ✅ Diacritics render correctly in headings (test on `/province/hue` page — `Huế` is a stress test)
4. ✅ No untranslated VN word stuck in EN mode without an inline gloss
5. ✅ "Sài Gòn" used in persona voice, "TP.HCM" only in admin labels — never together in one sentence

## What NOT to do

- ❌ Don't split EN and VI into different domains. We're one product.
- ❌ Don't auto-translate at render time. Translations are content, not output.
- ❌ Don't show "[VN]" or "[EN]" labels on facts. The whole UI is bilingual; the language is signaled by the toggle, not annotations.
- ❌ Don't make VN headings unreadable by using a non-Vietnamese-aware typeface. Test diacritics.
