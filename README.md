# FitDNA — Decode your fit before you buy

**FitDNA** pairs the **Perfect Corp YouCam Apparel Virtual Try-On (VTO) API** with a
**Fit Confidence Score** so online shoppers stop guessing and start buying with
certainty — and skip the return shipping.

Built for the **YouCam API Skin AI & Apparel VTO Hackathon** (Apparel VTO track).

---

## The problem it solves

Most online clothing/shoe decisions come down to a guess: *will this fit, will this
look right, is it worth the return shipping?* Returns from bad fit guesses are a huge
cost for retailers and a hassle for shoppers. Visual try-on alone (the "obvious" use
judges are tired of) shows you the garment but doesn't tell you if the **size** is right.

FitDNA adds the non-obvious layer: it estimates your body proportions, normalizes a
garment's brand size chart into a common scheme, and outputs a **0–100 Fit Confidence
Score** with a recommended size and plain-language reasoning. It then remembers your
try-ons and keep/reject decisions to build an evolving **Fit Profile**.

This is clearly *more than a wrapper around a single API call* — there is real scoring
logic (size normalization across brands, per-keyword tolerance, confidence math) sitting
on top of the YouCam render.

## How it uses the YouCam API

- **Apparel Virtual Try-On (V2.0 S2S)** for both **Clothes** (`task/cloth`) and
  **Shoes** (`task/shoes`).
- Flow (all server-side, key never reaches the browser):
  1. Upload user selfie + garment image via `POST /s2s/v2.0/file/{cloth|shoes}` → get `file_id`.
  2. Start the try-on task via `POST /s2s/v2.0/task/{cloth|shoes}` → get `task_id`.
  3. Poll `GET /s2s/v2.0/task/{feature}/{task_id}` until `success` → render image URL.
- Auth: **V2 uses the API key directly as a Bearer token** —
  `Authorization: Bearer <PERFECTCORP_API_KEY>`.
- Base host: `https://yce-api-01.perfectcorp.com`

The Fit Confidence Score is computed locally from your measurements + sample brand size
charts (`lib/fitscore.ts`); it is independent of the API and runs even if you have no
key, so the product demo works without burning credits.

## Tech stack

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**
- Server-side YouCam client in `lib/perfectcorp.ts`
- Fit scoring logic in `lib/fitscore.ts`
- Light "Wardrobe / Fit Profile" layer persisted in browser `localStorage` (`lib/profile.ts`)
- Route handlers under `app/api/*`

## Setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
#   edit .env and paste your YouCam API key as PERFECTCORP_API_KEY
#   get it at https://yce.perfectcorp.com/api-console/en/api-keys/

# 3. Run dev
npm run dev
#   open http://localhost:3000
```

> Without a key the UI still works for the **Fit Confidence Score** demo (enter
> measurements, pick a brand, see the score). The live try-on render requires a valid
> `PERFECTCORP_API_KEY`.

### Environment variables

| Var | Purpose |
| --- | --- |
| `PERFECTCORP_API_KEY` | Your YouCam V2 API key (Bearer token). **Never commit the real value.** |
| `PERFECTCORP_API_BASE` | API base URL (defaults to `https://yce-api-01.perfectcorp.com`). |

## Usage

1. Choose **Clothes** or **Shoes**.
2. Upload a **selfie** and a **garment product image**.
3. Enter your body measurements (cm). For shoes, enter **foot length (cm)**.
4. Pick a brand size chart (Generic / Zara sample charts included).
5. Click **Try on & score my fit** → see the YouCam render + your Fit Confidence Score,
   recommended size, and reasoning.
6. Keep or reject the result; your **Fit Profile** updates on the right.

## Demo video notes (for submission)

- Show the app running in the browser at `localhost:3000` (or the deployed Vercel URL).
- Explain the YouCam **Apparel Virtual Try-On API** is used for the render.
- Highlight the Fit Confidence Score as the differentiating logic.

## Project structure

```
app/
  page.tsx                 # main UI (upload, try-on, score, profile)
  api/tryon/route.ts       # upload images + start VTO task
  api/tryon/status/route.ts# poll task status
  api/fitscore/route.ts    # compute Fit Confidence Score
lib/
  perfectcorp.ts           # server-side YouCam V2 client
  fitscore.ts              # fit scoring + sample brand charts
  profile.ts               # light-B profile (localStorage)
```

## Notes / limitations

- Brand size charts are **sample data** in `lib/fitscore.ts`; a production build would
  fetch real per-brand charts.
- Body proportions are entered by the user (a production build could estimate them from
  the selfie via a pose/measurement model — out of scope for the hackathon).
- Submission type: **solo**.
