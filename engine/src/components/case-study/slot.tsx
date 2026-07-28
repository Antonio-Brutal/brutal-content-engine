"use client";

import { useRef, useState, useTransition } from "react";
import { fillSlotWithGeneratedAction, fillSlotWithUploadAction } from "./actions";

// An unfilled image slot: a visible, labeled space that accepts an upload or a
// Flux generation from the slot's brief.
export function ImageSlot({ assetId, slot, kind, brief }: { assetId: string; slot: string; kind: string; brief: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await fillSlotWithUploadAction(assetId, slot, fd);
      if (res.error) setNote(res.error);
    });
  }

  function generate() {
    startTransition(async () => {
      setNote("Generating with Flux, up to a minute.");
      const res = await fillSlotWithGeneratedAction(assetId, slot, brief);
      setNote(res.error ?? null);
    });
  }

  return (
    <div className="my-6 rounded-xl border border-dashed border-(--line-strong) bg-(--panel-2) p-6">
      <p className="label mb-1">
        Image slot: {slot} ({kind})
      </p>
      {brief ? <p className="mb-4 max-w-xl text-sm text-(--muted)">{brief}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={pending} onClick={() => fileRef.current?.click()}>
          {pending ? "Working" : "Upload image"}
        </button>
        {kind !== "screenshot" ? (
          <button className="btn" disabled={pending} onClick={generate}>
            Generate with Flux
          </button>
        ) : (
          <span className="label">Screenshots stay real, upload only</span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) upload(f);
          }}
        />
      </div>
      {note ? <p className="mt-3 text-sm text-(--amber)">{note}</p> : null}
    </div>
  );
}

export function LogoSlot({ assetId, logoMediaId, clientName }: { assetId: string; logoMediaId: string | null; clientName: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  if (logoMediaId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/media/${logoMediaId}`} alt={clientName ? `${clientName} logo` : "Client logo"} className="my-4 h-10 w-auto brightness-0 invert" />
    );
  }
  return (
    <div className="my-4 inline-flex items-center gap-3 rounded-lg border border-dashed border-(--line-strong) px-4 py-3">
      <span className="label">Client logo</span>
      <button
        className="btn"
        disabled={pending}
        onClick={() => fileRef.current?.click()}
      >
        {pending ? "Working" : "Upload"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const fd = new FormData();
          fd.set("file", f);
          startTransition(async () => {
            const res = await fillSlotWithUploadAction(assetId, "logo", fd);
            if (res.error) setNote(res.error);
          });
        }}
      />
      {note ? <span className="text-sm text-(--amber)">{note}</span> : null}
    </div>
  );
}
