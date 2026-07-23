# PROJECT CONTEXT — FitDNA (YouCam Apparel VTO Hackathon)

> This file is the persistent memory for this project. Open Code: read this in full
> before doing anything, and **update the "Log" and "Decisions" sections at the end of
> every work session** — that's how continuity across sessions works here.

## 1. The competition (facts, not vibes)

- **Hackathon:** YouCam API Skin AI & Apparel VTO Hackathon, hosted by Perfect Corp on Devpost.
  https://youcam-api.devpost.com/
- **Deadline:** Aug 17, 2026 @ 11:45am EDT
- **Track we're entering:** Apparel Virtual Try-On (not Skin AI, not combined)
- **Prizes:** $5,000 (1st) / $1,000 (2nd) / 5,000 API units ≈ $275 (3rd–5th) + blog feature
- **1,000 free API units** included with registration (~$179 value) — budget usage, don't burn testing credits carelessly.

### What actually gets judged
1. **Technological Implementation** — real, non-trivial integration of the Apparel VTO API, working end to end.
2. **Design** — a coherent product experience, not a tech demo.
3. **Potential Impact** — a credible, specific real-world problem, solved for a real audience.
4. **Quality of the Idea** — non-obvious use of the API; judges explicitly said they don't want "a wrapper around a single API call."

### Submission requirements (don't miss any of these)
- Public (or shared-private) code repo with full source + setup instructions
- Text description of features/functionality + the retail/consumer value case
- Screenshots
- 1–3 min demo video (judges won't watch past 3 min), uploaded publicly to YouTube/Vimeo/Youku, must show the app running on its target device, must explain which YouCam API is used, no unlicensed third-party trademarks/music
- Must explain how the project was newly built or significantly updated *during* the submission period
- Winner obligations: exit interview + blog feature consent

## 2. The API (Perfect Corp YouCam API — Apparel VTO) — **VERIFIED 2026-07-17**

- Docs: https://docs.perfectcorp.com/develop/introduction  ·  API Reference: https://docs.perfectcorp.com/reference/ai_clothes/v2.0
- **Version: V2.0 S2S (use this, not v1).** Confirmed against live docs 2026-07-17.
- **Async task pattern (V2):**
  1. **Auth** — **V2 uses the API Key directly as a Bearer token.** `Authorization: Bearer <PERFECTCORP_API_KEY>`. No `client_id`/`id_token`/`access_token` exchange (that was the old v1 flow — the original context doc's auth description was WRONG for this hackathon; do not implement it).
  2. **Upload** — `POST /s2s/v2.0/file/{feature}` → returns an upload `requests.url` + `file_id`. `PUT` the image bytes to `requests.url`. OR skip upload entirely by passing a **public image URL** in the task payload (used in dev to avoid ngrok).
  3. **Start task** — `POST /s2s/v2.0/task/{feature}` with `source_file_id` (user/selfie) + `reference_file_id` (garment) + config → returns `task_id`.
  4. **Poll** — `GET /s2s/v2.0/task/{feature}/{task_id}` until `task_status` is `success` or `error`.
  5. **Result** — success includes `result.url` (download URL for the try-on image).
- **Base host (VERIFIED):** `https://yce-api-01.perfectcorp.com` (the old `makeupar.com` host in the original doc is outdated).
- **Confirmed endpoints for our scope:**
  - Clothes: `POST /s2s/v2.0/file/cloth`, `POST /s2s/v2.0/task/cloth`, `GET /s2s/v2.0/task/cloth/{task_id}`, `GET /s2s/v2.0/task/template/cloth`
  - Shoes: `POST /s2s/v2.0/file/shoes`, `POST /s2s/v2.0/task/shoes`, `GET /s2s/v2.0/task/shoes/{task_id}`
  - (Note: payload shapes differ per category — clothes uses `source_file_id`/`reference_file_id`; shoes adds `style` + `gender`. Don't assume one schema fits all.)
- **Credentials — already generated, handle with care:**
  - A single **API Key** was generated in the Perfect Console. Store it as `PERFECTCORP_API_KEY` in `.env` (gitignored).
  - Never paste the actual key value into chat — reference it only as the env var name.
  - Don't repeat the leaked-HF-token incident from Lumora: keep it out of the repo.
- **MIRROR gotcha (still valid):** Perfect Corp needs a **public, reachable image URL** for source/reference images when not uploading. Dev plan: upload via File API from the server (server has outbound net), OR run behind ngrok. For the demo, server-side upload avoids the public-URL problem entirely.
- **Rate limits:** 100 req / 5 min per IP, 100 req / min per token — both must hold. Budget the 1,000 free units.

## 3. Idea direction — **LOCKED 2026-07-17 (expanded 2026-07-17 to include Skin AI)**

**Locked direction: A + light B, now spanning BOTH Apparel VTO and Skin AI tracks.**

The hackathon brief is *"will this fit, will this look right, is it worth the return shipping — replace that guess with confidence."* Straight visual try-on alone is the "obvious" use judges said they're tired of. FitDNA pairs the YouCam APIs with scoring layers on top:

- **Core (A — Fit Confidence Score):** Upload a selfie + a garment product image. YouCam generates the try-on render (Clothes + Shoes). FitDNA estimates the user's body proportions, normalizes the garment's brand size chart to a common scheme, and outputs a **0–100 Fit Confidence Score** with a recommended size and plain-language reasoning. The non-obvious layer judges want — real logic on top of the API call.
- **Skin AI (added feature):** Upload a selfie → YouCam **Skin AI** (`/task/skin-analysis`) scores wrinkles, pores, oiliness, radiance, dark circles, moisture, eye bags, age spots, redness, and skin type. FitDNA's `lib/skinscore.ts` translates the raw `score_info` into a **Skin Confidence summary** (0–100 overall + per-concern bars + product-direction advice). Same "score on top of the API" pattern, applied to skincare — so users buy products that fit their face, not the hype.
- **Light B (Wardrobe / Style Profile):** The app remembers each user's past try-ons/sizes/keep-or-reject decisions in `localStorage` and surfaces an evolving "Fit Profile" — what sizes/brands tend to fit them, what they've tried, what they kept.

**Multi-page structure (locked):** `/` landing (hero + "what it does"), `/try-on` (Apparel VTO + Fit Confidence), `/skin` (Skin AI analysis), `/profile` (Fit Profile / wardrobe memory). Shared `Nav` in `layout.tsx`.

**Garment scope (locked):** Clothes + Shoes. **Skin scope (locked):** Skin AI (SD feature set). Both Apparel + Skin tracks entered.
**Submission type (locked):** Solo.
**Name:** FitDNA — your genetic fit (and skin) signature, decoded.

Why this pick: it's the most defensible under "Potential Impact" + "Quality of the Idea" because the value isn't just *seeing* the garment or *seeing* a skin mask — it's the confidence number solving the return-shipping / wrong-product problem the hackathon names, and the scoring logic is clearly more than a wrapper.

## 4. Tech stack (locked — confirm/adjust)

- **Frontend/Backend: Next.js (App Router) + Tailwind + TypeScript.** Actual scaffold is **Next.js 16.2.x + React 19 + Tailwind v4** (newer than the original "Next 14" default — fine, use what's installed). API routes (Route Handlers) serve as the backend so the YouCam calls stay server-side (key never hits the client).
- **YouCam calls happen only in Route Handlers** using `fetch` + `Authorization: Bearer <PERFECTCORP_API_KEY>`.
- **Image handling:** server-side upload via the File API (server has outbound net) — avoids the public-URL/ngrok problem for dev. For production deploy (Vercel) the same flow works since Vercel can reach Perfect Corp; garment/selfie images are uploaded from the server, not required to be public.
- **Fit Profile storage (light B):** browser `localStorage` (no DB) — body profile + try-on history + keep/reject. Scoped per browser; good enough for a hackathon demo and keeps scope tiny.
- **Deployment:** Vercel (frontend + route handlers together). Note: long VTO polls must complete within the route handler / serverless timeout — implement client-side polling against our own `/api/tryon/status` endpoint so we don't block on a single request.

## 5. Repo hygiene for judging

- README must be self-sufficient: setup, env vars needed (`PERFECTCORP_API_KEY` etc.), how to run
- Keep the API key out of the repo (`.env`, gitignored) — a leaked key has bitten this dev before (see Lumora HF token incident), don't repeat it here
- Repo must show it was built or substantially updated *within* the submission window — keep commit history honest and dated

## 6. Open decisions (fill in as resolved)

- [x] Final idea locked: **A + light B** (Fit Confidence Score core + light Wardrobe/Style Profile).
- [x] Garment category scope: **Clothes + Shoes** (bags/jewelry deferred).
- [x] Solo submission.
- [x] Confirmed API facts (2026-07-17): V2.0, `Bearer <API_KEY>` auth, host `yce-api-01.perfectcorp.com`, endpoints `file/cloth|shoes`, `task/cloth|shoes`, `task/{feature}/{task_id}`.
- [ ] First successful end-to-end VTO call with real API key (blocked on key being present in `.env`).
- [ ] Validate exact `task/shoes` request body (`style` + `gender` values) against live reference before coding shoes path.

## 7. Log

*(Open Code: append a dated one-line entry here each session — what was built, what broke, what's next.)*

- 2026-07-17 — Context doc created. Project named FitDNA. Track: Apparel VTO. API key + secret key generated (stored via env vars, not in repo). Idea direction not yet locked (leaning A: Fit Confidence Score).
- 2026-07-17 — **Idea LOCKED: A + light B** (Fit Confidence Score + light Wardrobe/Style Profile). Scope locked: Clothes + Shoes, solo. Verified live API facts: V2.0, `Bearer <API_KEY>` auth (old v1 client_id/id_token flow was WRONG), host `yce-api-01.perfectcorp.com`, endpoints `file/{cloth,shoes}` + `task/{cloth,shoes}` + `task/{feature}/{task_id}`. Scaffolded Next.js 16 app present (default page). Next: create `.env.example`, server-side YouCam client lib, fit-scoring logic, API routes, UI, README; run lint+build.
- 2026-07-17 — **Scaffold complete & building.** Created `lib/perfectcorp.ts` (V2 client: file upload, start task, poll), `lib/fitscore.ts` (cloth + shoe confidence scoring w/ sample brand charts), `lib/profile.ts` (localStorage Fit Profile). Added routes `/api/tryon`, `/api/tryon/status`, `/api/fitscore`. Rebuilt `app/page.tsx` as full client flow (upload → render → score → profile). Rewrote README as self-sufficient judge doc. `npm run lint` clean, `npm run build` passes. **Blocked on real `PERFECTCORP_API_KEY` in `.env`** to test live try-on end-to-end. Next: add real key, smoke-test `/api/tryon` with a selfie+garment, then record demo video + screenshots.
- 2026-07-17 — **Live API integration debugged (real key present).** Key findings vs docs: (1) File API response nests `files[]` under `data`, not top-level — fixed parser. (2) Task API (`POST /task/cloth`) REJECTS the `source_file_id`/`reference_file_id` (file_id) variant for this account; it requires **public URLs**: `src_file_url` + `ref_file_url` + `garment_category` (flat payload, NOT wrapped in `body` — the `body` wrapper causes 400). (3) Switched image hosting to **ImgBB** (`lib/imgbb.ts`) — selfie+garment uploaded there, public URLs passed to YouCam. After payload fix, call reaches the API and now returns **`CreditInsufficiency`** → the account has 0 units; the 1,000 free Devpost units must be redeemed in the Perfect Corp console (Account > Redeem Code). Once credits are active, end-to-end try-on should succeed.
- 2026-07-17 — **Skin AI feature added + multi-page restructure.** Added Skin Analysis: `lib/perfectcorp.ts` (`startSkinAnalysis`/`getSkinStatus`), `lib/skinscore.ts` (interprets raw `score_info` → Skin Confidence summary), routes `/api/skin` + `/api/skin/status`, and `app/skin/page.tsx`. Restructured into pages: `/` landing (hero + "what it does"), `/try-on` (Apparel VTO + Fit Confidence), `/skin`, `/profile` (Fit Profile), with shared `Nav` in `layout.tsx`. README updated for both tracks. Bug fixes from live calls: (a) Skin task payload must be **flat** (`src_file_url` at top level, not under `body`) — fixed. (b) Shoes `style` is a fixed enum (`random`, `style_minimalist`, `style_bohemian`, `style_cottagecore`, `style_french_elegance`, `style_retro_fashion`), not free text — UI now uses the enum. lint clean, build passes. Still blocked on **`CreditInsufficiency`** (redeem 1,000 free units) before any live render/analysis succeeds.
- 2026-07-17 — **Credits redeemed → live calls now run.** Root-cause fix for "Failed to parse URL from ": skin status route passed `statusUrl: ""` and `getSkinStatus` used it directly in `fetch()`. Fixed `getSkinStatus` to reconstruct the URL from `taskId` when `statusUrl` is empty. Also added `running` to the in-progress status checks in both `try-on` and `skin` clients (API uses `running`, not `processing`). Verified end-to-end: skin task now starts + polls; completed tasks return real `score_info` (a 1×1 test pixel fails with `Truncated File Read` — expected; a real selfie is required). Try-on path uses the same fixed status handling. Lint + build clean. Next: test with REAL selfie + garment photos to confirm render + skin summary quality.
- 2026-07-22 — **Live try-on rendering + debugging session.** Fixed three bugs found during live testing: (1) YouCam task status response field is `results` (plural), not `result` (singular) — `getTryOnStatus` was reading `data.result?.url` which was always `undefined`. Fixed to read `data.results` (plural), also handling `results` as direct URL string vs `{ url }` object. (2) Status route was downloading the result image from YouCam's S3 and re-uploading to ImgBB (2 extra API calls, ~300ms latency). Removed the unnecessary re-host — YouCam URL now passes through directly. (3) Stale closure in `run()` — `history` state was captured in the setInterval callback, so the second `persist()` couldn't find `entryId` and overwrote localStorage with stale data, losing the entry. Fixed with `historyRef`. Also decoupled verdict (score/size/reasons) from image URL in UI — fit info now displays even when image URL is missing. Apparel VTO and Fit Confidence fully working end to end.
- 2026-07-22 — **Profile page polish + history fixes.** Profile page: widened to `max-w-7xl`, redesigned as responsive card grid (3 columns on desktop), added filter tabs (All/Kept/Rejected/Undecided), image lightbox (click any thumbnail → full-screen overlay, Escape/click-outside to close). History persistence: fixed `selfieThumb`/`garmentThumb` using ephemeral blob URLs — `/api/tryon` now returns the ImgBB-hosted URLs (`selfieUrl`/`garmentUrl`) so they persist across page navigations. The ImgBB upload is not extra — it was already required for YouCam (needs public URLs); we just return the resulting URLs now. History stale-closure fix verified working — profile page correctly shows all completed try-ons.