# FitDNA — Your Genetic Fit Signature, Decoded

FitDNA pairs **YouCam Apparel Virtual Try-On** with a **Fit Confidence Score** (0–100) so you never guess whether an online purchase will fit again. Upload a selfie + a garment photo, see the realistic try-on render, and get a data-driven size recommendation with plain-language reasoning.

Built for the [Perfect Corp YouCam API Apparel VTO & Skin AI Hackathon](https://youcam-api.devpost.com/).

## Features

- **Virtual Try-On** — Upload your selfie and a garment (clothes or shoes). YouCam generates a realistic try-on render.
- **Fit Confidence Score** — FitDNA compares your body measurements against the brand's size chart and outputs a 0–100 fit score, a recommended size, and specific fit reasons for each body measurement.
- **Wardrobe History** — Every try-on is saved locally. Your profile page tracks what you tried, what fit, and what you kept or rejected.

## How It Works

1. **Upload** — You provide a selfie, a garment image, and your body measurements (bust, waist, hips, shoulder, height).
2. **Render** — Images are hosted via ImgBB and sent to the YouCam Apparel VTO API, which returns a photorealistic try-on render.
3. **Score** — FitDNA normalizes the brand's size chart against your measurements and computes a 0–100 Fit Confidence Score with per-size breakdowns and plain-language fit reasons.
4. **Remember** — Results persist in `localStorage` as your personal fit profile.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Route Handlers)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Virtual Try-On:** Perfect Corp YouCam Apparel VTO API v2.0 (S2S)
- **Image Hosting:** ImgBB API (for public image URLs required by YouCam)
- **Storage:** Browser `localStorage` (no backend database)

## Prerequisites

- Node.js 20+
- A **Perfect Corp API key** with Apparel VTO access (free via Devpost registration)
- An **ImgBB API key** (free tier)

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd fit-dna

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
PERFECTCORP_API_KEY=your_youcam_api_key_here
IMGBB_API_KEY=your_imgbb_api_key_here
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── tryon/         # POST — start a YouCam try-on task
│   │   ├── tryon/status/  # GET — poll task status
│   │   └── fitscore/      # POST — compute Fit Confidence score
│   ├── try-on/            # Try-on page (upload + render + score)
│   ├── profile/           # Fit history profile page
│   ├── page.tsx           # Landing page
│   └── layout.tsx         # Root layout with shared Nav
├── lib/
│   ├── perfectcorp.ts     # YouCam API client
│   ├── fitscore.ts        # Fit Confidence scoring engine
│   ├── imgbb.ts           # ImgBB image upload client
│   └── profile.ts         # localStorage profile helpers
└── public/
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PERFECTCORP_API_KEY` | Yes | YouCam API key (Bearer token) |
| `IMGBB_API_KEY` | Yes | ImgBB API key for image hosting |

## License

MIT
