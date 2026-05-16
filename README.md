# vietnam

> Ten AI agents. One per Tier-1 Vietnamese province. Fixer-verified, scam-aware, bilingual EN/VI.
>
> *Mười AI. Mỗi tỉnh một con. Có fixer địa phương xác minh, cảnh báo lừa đảo, song ngữ Anh–Việt.*

**Open source · MIT · community-built**
[github.com/DungMai/vietnam](https://github.com/DungMai/vietnam)

---

## 🌏 What this is *(EN)*

A chat-first product where each Tier-1 Vietnamese administrative unit has **its own AI persona** with its own voice, cultural knowledge, and locally-verified facts. Built to help three audiences:

1. **Travelers** — Don't get scammed. Get real local prices, real verified venues, real warnings. The wedge: generic AI (Perplexity, ChatGPT, Google AI Overviews) hallucinates closed restaurants and outdated routes for Vietnam. We don't.
2. **Culture learners** — Whether you're VN diaspora, a curious foreigner, or a Vietnamese student — chat with a province like chatting with a knowledgeable friend from there.
3. **Foreign business explorers** *(later phase)* — Understand a Vietnamese province as a market and partner.

**Locked invariants** (these are the product — do not regress):

- ✅ Every fact is **fixer-verified** (local human review, monthly rotation cadence)
- ✅ When we don't have a verified answer, we **say so** — no guessing
- ✅ **No AI-generated imagery, ever** — photos come from fixers and partnered VN photographers
- ✅ **Bilingual completeness** at SQL level (every `*_en` / `*_vi` pair NOT NULL CHECK)
- ✅ Personas speak as **"Sài Gòn", "Hà Nội"** — not administrative codes

---

## 🌏 Đây là gì *(VI)*

Sản phẩm chat-first nơi mỗi đơn vị hành chính cấp tỉnh ở VN (10 tỉnh Tier-1, theo cấu trúc sau cải cách 2025) có **một AI persona riêng** — giọng nói riêng, hiểu biết văn hoá riêng, dữ liệu địa phương đã được xác minh. Phục vụ 3 nhóm người dùng:

1. **Du khách** — Đừng bị lừa. Lấy giá địa phương thực, quán đã xác minh, cảnh báo lừa đảo cập nhật. Điểm khác biệt: AI chung chung (Perplexity, ChatGPT, Google AI Overviews) trả lời sai lệch về VN — quán đã đóng cửa, tuyến đường lỗi thời. Chúng tôi thì không.
2. **Người tìm hiểu văn hoá** — Việt kiều, người nước ngoài, học sinh sinh viên VN — chat với một tỉnh như chat với người bạn am hiểu của vùng đó.
3. **Người nước ngoài đánh giá cơ hội kinh doanh** *(giai đoạn sau)* — Hiểu một tỉnh VN như một thị trường / đối tác.

**Bất biến đã chốt** (đây CHÍNH LÀ sản phẩm — không PR nào được phá):

- ✅ Mỗi dữ kiện đều có **fixer xác minh** (người địa phương review, lịch xoay vòng hàng tháng)
- ✅ Không có dữ kiện xác minh thì **nói thẳng** — không đoán
- ✅ **Không bao giờ dùng ảnh AI tạo** — ảnh từ fixer và nhiếp ảnh gia VN đối tác
- ✅ **Song ngữ đầy đủ** ở mức SQL (mọi cặp `*_en` / `*_vi` đều NOT NULL CHECK)
- ✅ Persona xưng **"Sài Gòn", "Hà Nội"** — không phải mã hành chính

---

## 🤝 Who can contribute

**Anyone.** Especially welcoming Vietnamese developers — most discussion happens bilingually. You don't need to know Vietnamese to contribute to code. You don't need to know TypeScript to contribute facts, persona voice tweaks, or translations.

| You can help with | Where to start |
|---|---|
| Code (TS / Next.js / Postgres) | [`CONTRIBUTING.md`](CONTRIBUTING.md) → "First code PR" |
| Fact corrections (you know a province well) | [Open a fact-correction issue](https://github.com/DungMai/vietnam/issues/new?template=fact_correction.yml) |
| Persona voice refinement (you're from that province) | [`docs/PERSONAS.md`](docs/PERSONAS.md) → open a PR |
| Vietnamese translation review | [`CONTRIBUTING.md`](CONTRIBUTING.md) → "Translation review" |
| New scam pattern report | [Open a scam-report issue](https://github.com/DungMai/vietnam/issues/new?template=scam_report.yml) |
| Fixer interest (paid, monthly trip) | Email `dung@newera.inc` |

---

## 🚀 Get it running locally

```bash
git clone git@github.com:DungMai/vietnam.git
cd vietnam
pnpm install

# Local Supabase (Postgres + pgvector)
brew install supabase/tap/supabase   # if needed
supabase start
# copy keys into .env.local — see .env.example

pnpm db:migrate
pnpm db:seed
pnpm rag:ingest                       # needs GOOGLE_GENERATIVE_AI_API_KEY
pnpm dev                              # → http://localhost:3000
```

Try chatting with Saigon: <http://localhost:3000/province/hcm/chat>

---

## 🧱 Stack

**Next.js 15** (App Router, RSC, streaming) · **Supabase** (Postgres + pgvector) · **Vercel** · **Cloudflare R2** · **Vercel AI SDK** (Gemini Flash-Lite default, Sonnet 4.5 escalation, Haiku 4.5 translation) · **Resend** (email gate) · **Tailwind**

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the 3-tier LLM router, RAG retrieval, and trust-loop design.

---

## 📁 Repo map

```
app/              Next.js App Router (pages + API routes)
components/       UI components (chat surface, citation pill, etc.)
lib/              llm, rag, persona, session, trust, i18n
supabase/         migrations + seed
scripts/          ingest CLI + ops
types/            shared TS domain types
docs/             public documentation for contributors
.github/          CI, PR template, issue templates
```

---

## 🛡 Trust & safety

- Report a security issue: see [`SECURITY.md`](SECURITY.md). **Do not** open a public issue for vulnerabilities.
- Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — Contributor Covenant 2.1. Vietnamese context matters; be respectful of regional history (Huế royal heritage, Hải Phòng war heritage, An Giang post-2025 merger).
- How decisions are made: [`GOVERNANCE.md`](GOVERNANCE.md).

---

## 📜 License

**MIT.** See [`LICENSE`](LICENSE). The OSS core is and will remain MIT. Future paid features (if any) will be built as separate proprietary extensions on top of this MIT core — the public source stays public.

By contributing you agree your contribution is licensed under MIT (sign your commits with `git commit -s` to confirm — see DCO note in [`CONTRIBUTING.md`](CONTRIBUTING.md)).

---

## 🙏 Credits

Started by [Dung Mai](https://github.com/DungMai) as a personal open-source project. Built with the Studio process — specs, design, and decisions live separately; what you see here is the working product distilled.

Fixers, translators, persona voice contributors, and code authors are credited in releases and on the homepage. Everyone who's verified a fact is part of the product.
