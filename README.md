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
- Must explain how the project was newly built or significantly updated _during_ the submission period
- Winner obligations: exit interview + blog feature consent

## 2. The API (Perfect Corp YouCam API — Apparel VTO)

- Docs: https://docs.perfectcorp.com/develop/introduction
- Standard REST API, async task pattern:
  1. **Auth** — your **API Key = `client_id`**, your **Secret Key = `client_secret`**. These are NOT sent directly as a bearer token. Flow: use client_id/client_secret to obtain an `id_token` (per the Quick Start Guide's auth step, involves signing/encrypting the client_id), then exchange that for an `access_token`. All subsequent calls use `Authorization: Bearer <access_token>`. The access_token expires — check the docs for its lifetime and refresh accordingly.
  2. **Upload** — call the relevant `file/...` endpoint to get an upload URL + `file_id`, then PUT the image to that URL.
  3. **Start task** — POST to the relevant `task/...` endpoint (e.g. `task/cloth`, `task/shoes`, `task/bag` — confirm exact path per garment category in the API reference, they differ per category) with the `file_id` + garment config. Get back a `task_id`.
  4. **Poll** — GET the task status endpoint until `status` is `success` or `error`.
  5. **Result** — success response includes a download URL for the generated try-on image.

### Credentials — already generated, handle with care

- API Key (client_id) and Secret Key (client_secret) have already been generated in the Perfect Console.
- **The secret key is shown only once at generation time** — if it's saved somewhere other than a password manager or `.env` right now, move it into one immediately.
- Store both as `PERFECTCORP_CLIENT_ID` and `PERFECTCORP_CLIENT_SECRET` in a `.env` file, gitignored from the first commit — don't repeat the leaked-HF-token incident from Lumora.
- Never paste the actual key/secret values into chat with Claude (here or in Open Code) — reference them only as env var names.
- Base host pattern seen in docs: `https://yce-api-01.makeupar.com/s2s/v2.0/...` — **verify current host/paths against the live API reference before hardcoding**, Perfect Corp has multiple API versions (v1 vs v2.0) and the hackathon should use the current one.
- **Known gotcha from a prior hackathon build (MIRROR, DeveloperWeek 2026):** Perfect Corp's API needs a **public URL** to reach your backend/image host — plan to run behind ngrok (or deploy properly) from day one, don't leave it for later.
- Different garment categories (clothes, shoes, bags, earrings) have different request payload shapes (`garment_category`, `change_shoes`, `ref_file_urls`, `object_infos`, etc.) — don't assume one schema fits all if the product supports multiple categories.
- Rate limits: 100 req / 5 min per IP, 100 req / min per access token — both must hold.

## 3. Idea direction (brainstormed, not yet locked)

The hackathon brief basically hands you the thesis: _"will this fit, will this look right, is it worth the return shipping — build something that replaces that guess with confidence."_ Straight visual try-on alone is the "obvious" use judges said they're tired of. The differentiator is pairing VTO with something that reduces actual purchase risk or decision friction.

Three directions, roughly in order of how well they dodge the "surface wrapper" trap:

**A. Fit Confidence Score (strongest fit with the judging criteria)**
VTO render + a fit/size recommendation layer on top: estimate body proportions from the try-on photo, compare against per-brand size charts, output a "how this will actually fit you" confidence score alongside the visual. Directly attacks the stated problem (returns from bad fit guesses), and it's clearly more than a single API call — there's real logic (size normalization across brands, confidence scoring) sitting on top of the render.

**B. Wardrobe/Style Profile over time (plays to your gamification instincts from FluentUp)**
Users build a virtual closet, try on new pieces against what they already own, and get an evolving "style profile" — similar shape to your Mistake DNA idea but for fashion: track what they try, what they keep, what they reject, and use that to get smarter about recommendations. More product depth, more demo-able "delight," but more scope for a one-day-ish build.

**C. In-context shopping layer**
Overlay VTO directly into a real or simulated e-commerce product page flow (browser extension or embedded widget) rather than a standalone app — makes the "retail value" case almost self-evident since it lives where the buying decision actually happens. Good demo footage, but more surface area (needs a believable storefront) for the time you have.

**Recommendation if you want a single strong pick:** A, possibly with a light B-style layer (remember past try-ons/sizes per user) if time allows. It's the most defensible under "Potential Impact" and "Quality of the Idea" because the value isn't just seeing the garment — it's the confidence number solving the return-shipping problem the hackathon names outright.

_Open Code: don't lock this in silently — confirm the direction with Nur before scaffolding, and update this section once decided._

## 4. Tech stack (defaults — confirm/adjust)

- Frontend: Next.js 14 + Tailwind (matches FluentUp stack, known-fast to scaffold)
- Backend: Next.js API routes or a small Node/FastAPI service — needed regardless, since the Perfect Corp API requires a public backend URL for callbacks/polling
- Image hosting: needs a public, reachable URL for garment/user images — decide early (S3/Cloudinary/ngrok-for-dev) per the MIRROR gotcha above
- Deployment: Vercel for frontend (known-good from prior projects); backend wherever it can hold a stable public URL

## 5. Repo hygiene for judging

- README must be self-sufficient: setup, env vars needed (`PERFECTCORP_API_KEY` etc.), how to run
- Keep the API key out of the repo (`.env`, gitignored) — a leaked key has bitten this dev before (see Lumora HF token incident), don't repeat it here
- Repo must show it was built or substantially updated _within_ the submission window — keep commit history honest and dated

## 6. Open decisions (fill in as resolved)

- [ ] Final idea locked (A/B/C above or a hybrid)?
- [ ] Garment category scope (clothes only? clothes+shoes?)
- [ ] Solo or team submission?
- [ ] Confirmed current API base URL + exact endpoint paths from the live reference (don't trust hardcoded paths above without checking)

## 7. Log

_(Open Code: append a dated one-line entry here each session — what was built, what broke, what's next.)_

- 2026-07-17 — Context doc created. Project named FitDNA. Track: Apparel VTO. API key + secret key generated (stored via env vars, not in repo). Idea direction not yet locked (leaning A: Fit Confidence Score).
