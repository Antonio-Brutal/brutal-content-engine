"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { PermissionPill, type ClientPermission } from "./permission-pill";
import { attachClientAction, generateCaseStudyAction } from "./actions";

export type AttachedClient = { id: string; name: string; permission: ClientPermission };
export type ClientOption = { id: string; name: string };

// Interactive half of AttachClientCard. Data comes from the server-component
// wrapper in attach-card.tsx; mutations go through ./actions.ts.
export function AttachClientCardInner({
  solutionId,
  client,
  options,
}: {
  solutionId: string;
  client: AttachedClient | null;
  options: ClientOption[];
}) {
  const [selected, setSelected] = useState(options[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const run = (label: string, fn: () => Promise<void>) => {
    setPendingLabel(label);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch {
        setError("Something went wrong, try again.");
      }
      setPendingLabel(null);
    });
  };

  return (
    <Card>
      <p className="label mb-3">Client.</p>

      {client ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/clients/${client.id}`} className="font-medium underline-offset-4 hover:underline">
              {client.name}
            </Link>
            <PermissionPill permission={client.permission} />
          </div>

          {client.permission !== "written" ? (
            <p className="text-xs text-(--muted)">
              Permission is {client.permission}, the case study runs anonymized until written permission is
              recorded.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={isPending}
              onClick={() =>
                run("Generating case study", async () => {
                  const result = await generateCaseStudyAction(solutionId);
                  if (result.ok) setMessage("Case study drafted.");
                  else setError(result.error ?? "Generation failed.");
                })
              }
            >
              {pendingLabel === "Generating case study" ? "Generating case study…" : "Generate case study"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={isPending}
              onClick={() =>
                run("Detaching", async () => {
                  await attachClientAction(solutionId, null);
                })
              }
            >
              {pendingLabel === "Detaching" ? "Detaching…" : "Detach"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {options.length === 0 ? (
            <p className="text-sm text-(--muted)">No client records yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="select max-w-56"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={isPending}
                aria-label="Client record"
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isPending || !selected}
                onClick={() =>
                  run("Attaching", async () => {
                    await attachClientAction(solutionId, selected);
                  })
                }
              >
                {pendingLabel === "Attaching" ? "Attaching…" : "Attach"}
              </button>
            </div>
          )}
          <p className="text-xs text-(--muted)">
            Attaching unblocks the case-study engine.{" "}
            <Link href="/clients/new" className="text-(--lime) underline underline-offset-4">
              New client record
            </Link>
            .
          </p>
        </div>
      )}

      {message ? <p className="mt-3 text-sm text-(--lime)">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-(--red)">{error}</p> : null}
    </Card>
  );
}
