import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:py-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-accent-2" />
            Powered by Perfect Corp YouCam API
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Decode your fit — and your skin — before you buy.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            FitDNA turns the guesswork of online shopping into a number. Try clothes
            and shoes on your own photo with AI, get a <strong>Fit Confidence Score</strong>,
            and analyze your skin to find products that actually suit you. Built for the
            YouCam Apparel VTO + Skin AI Hackathon.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/try-on"
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Try on & score my fit
            </Link>
            <Link
              href="/skin"
              className="rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Analyze my skin
            </Link>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <h2 className="text-2xl font-bold">What FitDNA actually does</h2>
        <p className="mt-2 max-w-2xl text-white/60">
          Most online decisions come down to a guess: will this fit, will this look
          right, is it worth the return shipping? And for skincare: what does my skin
          actually need? FitDNA replaces the guess with a score.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Feature
            title="Fit Confidence Score"
            tag="Apparel Virtual Try-On"
            body="Upload a selfie + a garment. YouCam renders the look, then FitDNA estimates your body proportions, normalizes the brand's size chart, and outputs a 0–100 Fit Confidence Score with a recommended size and plain-language reasoning. The non-obvious layer judges want — real logic on top of the render."
            href="/try-on"
            cta="Start a try-on"
          />
          <Feature
            title="Skin Analysis"
            tag="Skin AI"
            body="Upload a selfie and YouCam's Skin AI scores wrinkles, pores, oiliness, radiance, dark circles, moisture, and your skin type. FitDNA translates the raw scores into an easy Skin Confidence summary with product-direction advice — so you buy skincare that fits your face, not the hype."
            href="/skin"
            cta="Analyze my skin"
          />
          <Feature
            title="Your Fit Profile"
            tag="Wardrobe memory"
            body="Every try-on and skin check is remembered in your browser. Keep or reject results to build an evolving profile: your common size, your average confidence, and what tends to suit you. The more you use FitDNA, the smarter your DNA gets."
            href="/profile"
            cta="View my profile"
          />
          <Feature
            title="Brand-aware sizing"
            tag="Less returns"
            body="FitDNA normalizes different brands' size charts into one scheme, so a size M in Zara and a size M in a generic brand mean the same thing to you. That's fewer bad-fit purchases and less return shipping."
            href="/try-on"
            cta="See it in action"
          />
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <strong className="text-white">How the API is used:</strong> FitDNA calls the
          Perfect Corp YouCam <strong>Apparel Virtual Try-On</strong> (Clothes + Shoes) and
          <strong> Skin AI</strong> APIs server-side. Try-on images are hosted via ImgBB so
          YouCam can fetch them; all keys stay on the server and never reach the browser.
        </div>
      </section>
    </main>
  );
}

function Feature({
  title,
  tag,
  body,
  href,
  cta,
}: {
  title: string;
  tag: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs uppercase tracking-wide text-accent">{tag}</div>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-block text-sm font-medium text-accent-2 hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}
