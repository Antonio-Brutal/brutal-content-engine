"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
import { Markdown } from "@/components/markdown";
import { generateGermanAction } from "./actions";

// EN | DE toggle above the asset body. The EN side is the server-rendered body
// passed as children (it stays mounted, only hidden, so editor state survives
// switching). The DE side renders the stored German variant as plain markdown,
// or offers to generate one.

export type GermanVariant = { bodyMd: string; at: number; sourceUpdatedAt: number };

export function LanguageToggle({
  assetId,
  solutionId,
  de,
  assetUpdatedAt,
  children,
}: {
  assetId: string;
  solutionId: string;
  de: GermanVariant | null;
  assetUpdatedAt: number;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<"en" | "de">("en");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateGermanAction(assetId, solutionId);
      if (!result.ok) setError(result.error ?? "Localization failed.");
    });
  };

  const copyGerman = async () => {
    if (!de) return;
    await navigator.clipboard.writeText(de.bodyMd);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const stale = de !== null && de.sourceUpdatedAt < assetUpdatedAt;

  const tabClass = (active: boolean) =>
    `label cursor-pointer bg-transparent p-0 transition-colors ${active ? "text-(--text)" : "hover:text-(--text)"}`;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" className={tabClass(lang === "en")} onClick={() => setLang("en")}>
          EN
        </button>
        <span className="text-xs text-(--muted)">|</span>
        <button type="button" className={tabClass(lang === "de")} onClick={() => setLang("de")}>
          DE
        </button>
      </div>

      <div className={lang === "en" ? "" : "hidden"}>{children}</div>

      {lang === "de" ? (
        de ? (
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button type="button" className="btn" onClick={copyGerman}>
                {copied ? "Copied" : "Copy German"}
              </button>
              {stale ? (
                <>
                  <span className="text-xs text-(--amber)">
                    The English body changed after this localization, it may be out of date.
                  </span>
                  <button type="button" className="btn border-(--amber) text-(--amber)" onClick={generate} disabled={isPending}>
                    {isPending ? "Localizing… (~1 min)" : "Regenerate German"}
                  </button>
                </>
              ) : null}
            </div>
            <Markdown md={de.bodyMd} />
          </div>
        ) : (
          <div className="card p-5">
            <p className="text-sm text-(--muted)">No German variant yet.</p>
            <div className="mt-3">
              <button type="button" className="btn" onClick={generate} disabled={isPending}>
                {isPending ? "Localizing… (~1 min)" : "Generate German variant"}
              </button>
            </div>
          </div>
        )
      ) : null}
      {error ? <p className="mt-3 text-xs text-(--red)">{error}</p> : null}
    </div>
  );
}
