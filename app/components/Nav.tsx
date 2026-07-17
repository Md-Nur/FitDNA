"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSparkle } from "./illustrations";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/try-on", label: "Fit & Try-On" },
  { href: "/skin", label: "Skin Analysis" },
  { href: "/profile", label: "My Fit Profile" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
            <IconSparkle className="h-4 w-4" />
          </span>
          Fit<span className="gradient-text">DNA</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active ? "bg-accent text-white" : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
