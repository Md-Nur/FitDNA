"use client";

import { useState } from "react";
import Image from "next/image";

// Map known raw YouCam error phrases to plain, non-technical, actionable text.
const FRIENDLY_ERRORS: { test: RegExp; message: string }[] = [
  {
    test: /face too small/i,
    message:
      "We can't see your face clearly enough. Use a selfie where your face fills more of the frame and is well lit.",
  },
  {
    test: /face not (found|detected)/i,
    message:
      "We couldn't find a face in your photo. Upload a clear front-facing selfie with no sunglasses or mask.",
  },
  {
    test: /src (file |source )?(too small|too large)/i,
    message:
      "Your photo is the wrong size. Use a clear, well-lit image where the subject is centered and fills most of the frame.",
  },
  {
    test: /truncated file read/i,
    message:
      "Your image didn't upload properly. Try a different, valid JPG or PNG photo.",
  },
  {
    test: /credit insufficiency/i,
    message:
      "You're out of API credits. Redeem your free units in the Perfect Corp console to continue.",
  },
  {
    test: /invalid api key|unauthorized|401/i,
    message:
      "The API key isn't valid. Check your YouCam API key in the environment settings.",
  },
  {
    test: /invalid parameters|missing required/i,
    message:
      "Something was missing from the request. Try again, and if it continues, check the image and inputs.",
  },
];

// Turn a raw YouCam/API error string into something readable for the UI.
// Keeps the original message available, but shows a cleaned-up version first.
export function humanizeError(raw: string): string {
  if (!raw) return "Something went wrong. Please try again.";
  let msg = raw.trim();

  // Strip noisy prefixes like "[DLQ] Max retries exhausted. Last error: "
  const dlq = msg.match(/\[DLQ\][^:]*:\s*(.*)$/);
  if (dlq) msg = dlq[1].trim();

  // Known phrases get a friendly, actionable message.
  for (const { test, message } of FRIENDLY_ERRORS) {
    if (test.test(msg)) return message;
  }

  // Fallback: replace underscores + camelCase breaks with spaces, title-ish case.
  const pretty = msg
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

export function ErrorBox({ raw, onRetry }: { raw: string; onRetry?: () => void }) {
  if (!raw) return null;
  return (
    <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
      <div className="text-sm font-medium text-red-300">{humanizeError(raw)}</div>
      <details className="mt-1">
        <summary className="cursor-pointer text-xs text-red-300/70">
          Technical details
        </summary>
        <code className="mt-1 block break-words text-xs text-red-200/60">{raw}</code>
      </details>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Loader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent-2" />
        <div className="absolute inset-3 animate-pulse rounded-full bg-accent/20" />
      </div>
      {text && (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Dots />
          {text}
        </div>
      )}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-2 [animation-delay:-0.3s]" />
      <span className="mx-0.5 h-1.5 w-1.5 animate-bounce rounded-full bg-accent-2 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-2" />
    </span>
  );
}

// Local object/data URLs bypass the optimizer (not supported by next/image).
// For remote URLs, if the optimizer fails, fall back to a plain <img> so the
// image always shows.
export function SmartImg({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [optimizerBroke, setOptimizerBroke] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-white/5 text-center text-xs text-white/40 ${className ?? ""}`}
      >
        Image unavailable
      </div>
    );
  }

  if (src.startsWith("data:") || src.startsWith("blob:") || optimizerBroke) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setOptimizerBroke(true)}
        sizes="(max-width: 768px) 50vw, 256px"
      />
    </div>
  );
}
