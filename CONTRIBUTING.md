# Contributing to `vietnam`

Welcome — and *xin chào* if you found this from a Vietnamese channel. This guide tells you how to contribute code, content, fact corrections, or persona voice improvements.

📖 **VN bản ở phía dưới — scroll xuống.**

---

## 🇬🇧 English

### TL;DR

1. Fork the repo, branch off `main`
2. Make your change
3. **Sign your commits**: `git commit -s` (this adds a DCO sign-off — required)
4. Open a PR against `main`, fill in the template
5. CI must pass + 1 reviewer approval → merge

### First-time setup

```bash
git clone git@github.com:yourhandle/vietnam.git
cd vietnam
pnpm install
supabase start
cp .env.example .env.local
# fill in Supabase keys from `supabase start` output
# add GOOGLE_GENERATIVE_AI_API_KEY (free tier from Google AI Studio works)
pnpm db:migrate
pnpm db:seed
pnpm rag:ingest
pnpm dev
```

If anything in those steps doesn't work cleanly, **that's a bug — open an issue**. We want first-time setup to be friction-less.

### What to work on

Look for issues tagged:
- **`good first issue`** — small, well-scoped, ideal for first PR
- **`help wanted`** — anyone can grab
- **`area:<...>`** — pick a domain you're comfortable with (rag, persona, ui, bilingual, trust, etc.)
- **`province:<slug>`** — pick a province you know well (especially welcome for fact corrections + persona voice tweaks)

If you have an idea that's not in an issue, **open a discussion first** (GitHub Discussions tab) — saves you from writing code that doesn't get merged.

### Locked invariants — DO NOT touch in a regular PR

The product depends on these being non-negotiable. PRs that touch any of these get `locked-decision-touched` label and need **owner approval** (Dung Mai) — see [`GOVERNANCE.md`](GOVERNANCE.md) for the strategic-change RFC process.

1. ❗ **No AI-generated imagery** — anywhere, ever (see [`docs/NO_AI_IMAGERY.md`](docs/NO_AI_IMAGERY.md))
2. ❗ **Bilingual SQL NOT NULL CHECK** on every `*_en` / `*_vi` pair (see [`docs/BILINGUAL.md`](docs/BILINGUAL.md))
3. ❗ **"Sài Gòn" in persona voice / "TP.HCM" in admin labels** — never mixed in one sentence (see [`docs/PERSONAS.md`](docs/PERSONAS.md))
4. ❗ **Fixer-verified trust loop** — `verified_fact.state = 'published'` requires a `fixer_signature_id`
5. ❗ **10 Tier-1 provinces** scope for V1
6. ❗ **MIT license** for this repo
7. ❗ **Citation contract** — every `[^factId]` rendered to the user must resolve to a real row in `verified_fact`. No hallucinated citations.

### Code style

- **TypeScript strict** — no `any` without comment justifying it
- **Conventional Commits** for commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`
- **English** for code, comments, commit messages (TS code), commit messages — VN-language stays in user-facing content
- No formatters fight: we use `prettier` defaults; just run `pnpm format` before pushing
- Component naming: PascalCase. Hook naming: `useXxx`. SQL: snake_case. Migration files: `NNNN_description.sql`
- File header comments only when non-obvious (the locked invariants files do this)

### DCO sign-off (required)

Every commit must be signed off. This is a lightweight "I wrote this and have the right to submit it" attestation — no CLA bureaucracy.

```bash
git commit -s -m "feat: your change"
# → adds "Signed-off-by: Your Name <your@email>" to the commit
```

If you forgot, amend: `git commit --amend -s --no-edit` (last commit) or interactive rebase for older commits.

PRs without sign-off on all commits cannot be merged.

### PR review process

1. Open PR against `main` from your fork's feature branch
2. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) — yes, all sections
3. CI runs automatically:
   - Lint (`pnpm lint`)
   - Type check (`pnpm typecheck`)
   - Build (`pnpm build`)
   - DCO sign-off check
4. Wait for review. Be patient — reviewers are humans with day jobs.
5. Address feedback by pushing new commits (don't force-push during review; squash happens at merge)
6. 1 reviewer approval + CI green = merge by reviewer (squash merge)
7. PRs touching `locked-decision-touched` need 14 days discussion + owner approval

### Contributing fact corrections (no code required)

If you know a province well and we've got a fact wrong:

- Open a [fact correction issue](.github/ISSUE_TEMPLATE/fact_correction.yml)
- Include: province, what's wrong, what's right, evidence (photo / receipt / dated source)
- A fixer will review and update the DB row directly (you don't write SQL)
- You'll be credited if the correction lands

### Contributing persona voice

Each province has a persona with a voice signature (see [`docs/PERSONAS.md`](docs/PERSONAS.md)). If you grew up in / live in a province and feel the voice is off:

- Open a PR editing `lib/persona/personas.ts` for that province
- Justify each change with cultural reasoning in the PR body (we won't merge "I think it sounds better")
- Tag with `province:<slug>` and `area:persona`

### Translation review

We translate VI → EN via AI, then need human review. If you're bilingual:

- Browse open issues tagged `area:bilingual` + `help wanted`
- Or open a PR fixing a specific translation that reads wrong

---

## 🇻🇳 Tiếng Việt

### Tóm tắt

1. Fork repo, tạo branch từ `main`
2. Sửa code / nội dung
3. **Sign commit**: `git commit -s` (DCO sign-off — bắt buộc)
4. Mở PR vào `main`, điền template
5. CI pass + 1 reviewer approve → merge

### Bắt đầu lần đầu

```bash
git clone git@github.com:yourhandle/vietnam.git
cd vietnam
pnpm install
supabase start
cp .env.example .env.local
# điền Supabase keys lấy từ output của `supabase start`
# thêm GOOGLE_GENERATIVE_AI_API_KEY (free tier từ Google AI Studio đủ dùng)
pnpm db:migrate
pnpm db:seed
pnpm rag:ingest
pnpm dev
```

Nếu bước nào fail, **đó là bug — mở issue**. Setup phải mượt cho người mới.

### Làm gì để bắt đầu

Tìm issue có label:
- **`good first issue`** — task nhỏ, dễ vào
- **`help wanted`** — ai cũng pick được
- **`area:<...>`** — chọn lĩnh vực bạn quen (rag, persona, ui, bilingual, trust...)
- **`province:<slug>`** — chọn tỉnh bạn rành (đặc biệt welcome cho fact correction + chỉnh voice persona)

Nếu bạn có ý tưởng chưa có issue — **mở discussion trước** (tab GitHub Discussions). Tránh viết code không được merge.

### Bất biến đã chốt — KHÔNG đụng trong PR thường

Sản phẩm phụ thuộc vào những thứ này. PR đụng đến chúng được gắn label `locked-decision-touched` + cần owner approval (Dung Mai). Xem [`GOVERNANCE.md`](GOVERNANCE.md).

1. ❗ **Không ảnh AI tạo** — nơi nào cũng cấm
2. ❗ **Song ngữ SQL NOT NULL CHECK** cho mọi cặp `*_en` / `*_vi`
3. ❗ **"Sài Gòn" cho voice persona / "TP.HCM" cho label hành chính** — không trộn trong 1 câu
4. ❗ **Fixer xác minh** — `verified_fact.state = 'published'` bắt buộc có `fixer_signature_id`
5. ❗ **10 tỉnh Tier-1** cho V1
6. ❗ **License MIT** cho repo này
7. ❗ **Citation contract** — mọi `[^factId]` hiển thị cho user phải trỏ về row thực trong `verified_fact`. Không bịa citation.

### Quy ước code

- **TypeScript strict** — không dùng `any` nếu không có comment giải thích
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`
- **Tiếng Anh** cho code, comment, commit message. Tiếng Việt cho content user-facing.
- Không tranh formatter: `prettier` mặc định; chạy `pnpm format` trước push
- Đặt tên: Component PascalCase, Hook `useXxx`, SQL snake_case, migration `NNNN_description.sql`

### DCO sign-off (bắt buộc)

Mỗi commit phải sign-off. Đây là cách "Tôi viết cái này và có quyền submit" gọn nhẹ — không cần CLA rườm rà.

```bash
git commit -s -m "feat: your change"
# → thêm "Signed-off-by: Your Name <your@email>" vào commit
```

Quên thì amend: `git commit --amend -s --no-edit`.

PR không sign-off đầy đủ commit thì không merge được.

### Đóng góp fact correction (không cần code)

Nếu bạn rành 1 tỉnh và phát hiện chúng tôi sai:

- Mở [fact correction issue](.github/ISSUE_TEMPLATE/fact_correction.yml)
- Bao gồm: tỉnh, cái sai, cái đúng, bằng chứng (ảnh / hoá đơn / nguồn ngày tháng)
- Một fixer sẽ review và update DB trực tiếp (bạn không cần viết SQL)
- Có credit nếu correction được merge

### Đóng góp voice persona

Mỗi tỉnh có persona với voice signature (xem [`docs/PERSONAS.md`](docs/PERSONAS.md)). Nếu bạn lớn lên / sống ở 1 tỉnh và thấy voice chưa đúng:

- Mở PR sửa `lib/persona/personas.ts` cho tỉnh đó
- Justify mỗi thay đổi bằng lý do văn hoá trong PR body (không merge "tôi thấy nghe hay hơn")
- Gắn tag `province:<slug>` và `area:persona`

---

## Questions

- Code questions: GitHub Discussions
- Sensitive issues: `dung@newera.inc`
- General: open a discussion, we'll see it
