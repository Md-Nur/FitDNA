import Link from "next/link";
import {
  HeroArt,
  ArtTryOn,
  ArtProfile,
  ArtSizing,
  IconShirt,
  IconProfile,
  IconRuler,
  IconArrow,
} from "./components/illustrations";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden pb-12 sm:pb-16">
        <div className="mx-auto grid max-w-5xl items-center gap-6 px-5 py-10 sm:py-14 md:grid-cols-2">
          <div className="animate-pop text-center md:text-left">
            <div className="mx-auto mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-accent-2" />
              Powered by Perfect Corp YouCam
            </div>
            <h1 className="mx-auto max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              See it. <span className="gradient-text">Score it.</span> Wear it.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/60">
              Try clothes &amp; shoes on your photo and read a <strong>Fit Confidence</strong> score
              before you buy.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href="/try-on"
                className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Try on &amp; score
              </Link>
            </div>
          </div>
          <div className="animate-float flex justify-center">
            <HeroArt className="w-full max-w-xs" />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "1", t: "Upload", s: "Selfie + a product shot" },
            { n: "2", t: "AI renders", s: "YouCam try-on" },
            { n: "3", t: "Get your score", s: "Fit confidence" },
          ].map((s) => (
            <div key={s.n} className="glass flex items-center gap-4 rounded-2xl p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-lg font-black text-white">
                {s.n}
              </span>
              <div>
                <div className="font-semibold">{s.t}</div>
                <div className="text-sm text-white/55">{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<ArtTryOn className="h-16 w-20" />}
            badge={<IconShirt className="h-3.5 w-3.5" />}
            title="Fit Confidence Score"
            tag="Try-On"
            body="YouCam renders the look, FitDNA scores the fit 0–100 with a size & plain reasoning."
            href="/try-on"
            cta="Try on"
          />
          <Feature
            icon={<ArtProfile className="h-16 w-20" />}
            badge={<IconProfile className="h-3.5 w-3.5" />}
            title="Your Fit Profile"
            tag="Memory"
            body="Keep or reject results. Your common size & confidence get smarter every try."
            href="/profile"
            cta="View profile"
          />
          <Feature
            icon={<ArtSizing className="h-16 w-20" />}
            badge={<IconRuler className="h-3.5 w-3.5" />}
            title="Brand-aware sizing"
            tag="Less returns"
            body="One size scheme across brands. Fewer bad fits, less return shipping."
            href="/try-on"
            cta="See it"
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  badge,
  title,
  tag,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  badge: React.ReactNode;
  title: string;
  tag: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="glass group block rounded-2xl p-6 transition hover:glow">
      <div className="flex items-center justify-between">
        <div className="text-accent">{icon}</div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs uppercase tracking-wide text-accent">
          {badge}
          {tag}
        </div>
      </div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-2 transition group-hover:gap-2">
        {cta} <IconArrow className="h-4 w-4" />
      </span>
    </Link>
  );
}
