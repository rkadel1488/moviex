"use client";

import { useState } from "react";

export default function ShareButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet, nothing to do
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-md transition-colors ring-1 bg-transparent text-white ring-white/40 hover:bg-white/10"
    >
      {copied ? "✓ Link Copied" : "↗ Share"}
    </button>
  );
}
