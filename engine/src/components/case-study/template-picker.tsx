"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateWithTemplateAction } from "./actions";

export function TemplatePicker({ assetId, templates, current }: { assetId: string; templates: { slug: string }[]; current: string | null }) {
  const router = useRouter();
  const [slug, setSlug] = useState(current ?? templates[0]?.slug ?? "");
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  if (!templates.length) {
    return <p className="text-sm text-(--muted)">No templates seeded yet.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select className="select w-auto" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={pending}>
        {templates.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.slug}
          </option>
        ))}
      </select>
      <button
        className="btn"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setNote(null);
            const res = await regenerateWithTemplateAction(assetId, slug);
            if (res.error) setNote(res.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Regenerating… (~2 min)" : "Regenerate on this template"}
      </button>
      {current ? <span className="label">Current: {current}</span> : null}
      {note ? <span className="text-sm text-(--amber)">{note}</span> : null}
    </div>
  );
}
