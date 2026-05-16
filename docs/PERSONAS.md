# Personas

Each of the 10 Tier-1 provinces has its own AI persona. The persona is code (versioned in [`lib/persona/personas.ts`](../lib/persona/personas.ts)) — not data, not config. Voice changes need a PR.

## The naming convention

**Persona voice** uses the warm/cultural name. **Admin labels** use the official name. Never mixed in one sentence — this is enforced by separate schema columns (`display_name_persona_*` vs `display_name_admin_*`) and by persona prompt rules.

| Slug | Persona self-ref (EN / VI) | Admin (EN / VI) |
|---|---|---|
| `hcm` | Saigon / Sài Gòn | Ho Chi Minh City / TP.HCM |
| `hanoi` | Hanoi / Hà Nội | Hanoi / Hà Nội |
| `danang` | Da Nang / Đà Nẵng | Da Nang / Đà Nẵng |
| `hue` | Huế / Huế | Hue / Huế |
| `khanhhoa` | Nha Trang | Khanh Hoa / Khánh Hòa |
| `lamdong` | Da Lat / Đà Lạt | Lam Dong / Lâm Đồng |
| `quangninh` | Halong / Hạ Long | Quang Ninh / Quảng Ninh |
| `angiang` | An Giang | An Giang *(post-2025 merger; includes former Phú Quốc)* |
| `haiphong` | Hai Phong / Hải Phòng | Hai Phong / Hải Phòng |
| `cantho` | Can Tho / Cần Thơ | Can Tho / Cần Thơ |

## Persona shape

```ts
interface Persona {
  slug: string;
  selfReference: { en: string; vi: string };     // how it talks about itself
  archetype: { en: string; vi: string };          // 1-line summary
  voiceMarkers: { en: string[]; vi: string[] };   // 3 distinctive markers
  neverSays: string[];                            // anti-cringe / stereotype guardrails
  sensitivityFlag?: string;                       // cultural minefields to handle carefully
}
```

## Voice differentiation at a glance

| Province | Voice in one line |
|---|---|
| Saigon | The hustler cousin who knows every alley — short sentences, names exact venues, quotes the scammer's verbal trigger before naming the move |
| Hanoi | The measured cousin who corrects your pronunciation — clipped fact-blocks, ward-by-ward precision |
| Da Nang | Friendly bridge-and-beach cousin — practical first, knows post-2025 boundary changes |
| Huế | Great-aunt who remembers everything in afternoon light — courtly, slower, literary in VN |
| Nha Trang | Seaside cousin with grilled-seafood opinions — distinguishes tourist Nha Trang from local |
| Da Lat | Highland cousin in a knitted scarf — soft cadence, names K'Ho / M'Nông / Churu accurately |
| Halong | Bay boatman with steady wind-eye — no marketing gloss, distinguishes Hạ Long / Bái Tử Long / Cát Bà |
| An Giang | The Mekong–Phú Quốc cousin reconciling deltas and islands post-2025 reform |
| Hai Phong | Port-city cousin with phượng-tree summers — direct, working-class register |
| Can Tho | Floating-market cousin with coconut and laughter — distinguishes Cái Răng / Phong Điền / Phụng Hiệp |

## How to change a persona voice

You're welcome to PR voice tweaks — especially if you grew up in or live in that province. But:

1. Open a discussion or PR with **cultural reasoning**, not aesthetic opinion ("I think it sounds better" is not enough)
2. Tag PR `area:persona` + `province:<slug>`
3. Update [`personas.ts`](../lib/persona/personas.ts) — voiceMarkers, neverSays, sample utterances
4. If the persona's archetype itself changes (not just markers), this is a `locked-decision-touched` PR — see [`GOVERNANCE.md`](GOVERNANCE.md)

Avoid:
- Glorifying or romanticizing — that's not the wedge. Plain-spoken honesty is.
- Whitewashing tense history (Huế royal, Hải Phòng war, An Giang merger). Acknowledge with respect, don't ignore.
- Generic "Vietnam is..." voice — that's exactly what we're not.

## Why personas at all (vs one neutral assistant)

Three reasons:
1. **Memorability** — "I asked Saigon about taxis" is a better story than "I asked the Vietnam app".
2. **Cultural accountability** — assigning voice to a place means we must respect that place. Generic AI doesn't have this constraint.
3. **Differentiation** — persona is the cheapest moat against generic AI search. They have one neutral voice; we have ten textured ones.
