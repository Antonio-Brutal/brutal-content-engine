"use client";

import { useRef, useState, useTransition } from "react";
import { uploadLogoAction } from "@/app/clients/actions";

// Logo upload for a client record. Stored as a media row (kind "logo"),
// served back via /api/media/<id>.
export function LogoUploader({
  clientId,
  logoMediaId,
  clientName,
}: {
  clientId: string;
  logoMediaId: string | null;
  clientName: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    setMessage(null);
    setError(null);
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        const result = await uploadLogoAction(clientId, formData);
        if (result.ok) {
          setMessage("Logo saved.");
          if (fileRef.current) fileRef.current.value = "";
        } else {
          setError(result.error);
        }
      } catch {
        setError("Upload failed, the file may be too large.");
      }
    });
  };

  return (
    <div className="grid gap-3">
      {logoMediaId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/media/${logoMediaId}`}
          alt={`${clientName} logo`}
          className="h-24 w-full rounded-md bg-(--panel-2) object-contain p-3"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-md bg-(--panel-2) font-mono text-[10px] text-(--muted)">
          no logo
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        disabled={isPending}
        className="block w-full text-xs text-(--muted) file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-solid file:border-(--line-strong) file:bg-transparent file:px-4 file:py-2 file:text-xs file:font-medium file:text-(--text)"
      />
      <div className="flex items-center gap-3">
        <button type="button" className="btn" onClick={upload} disabled={isPending}>
          {isPending ? "Uploading…" : logoMediaId ? "Replace logo" : "Upload logo"}
        </button>
        {message ? <span className="text-sm text-(--lime)">{message}</span> : null}
        {error ? <span className="text-sm text-(--red)">{error}</span> : null}
      </div>
    </div>
  );
}
