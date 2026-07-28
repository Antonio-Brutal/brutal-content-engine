"use client";

import { useRef, useState } from "react";

// Clipboard copy for a pre-formatted export string. The text is computed
// server-side via formatForPlatform; this button only ships it to the clipboard.
export function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    if (timer.current) clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="btn" onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}
