"use client";

import { useRef, useState, useTransition } from "react";
import { updateClientAction } from "@/app/clients/actions";
import type { ClientPermission } from "./permission-pill";

// Edit surface for a client record. All fields save together via one action.
export function ClientForm({
  clientId,
  initialName,
  initialContact,
  initialPermission,
  initialFacts,
}: {
  clientId: string;
  initialName: string;
  initialContact: string;
  initialPermission: ClientPermission;
  initialFacts: string;
}) {
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [permission, setPermission] = useState<ClientPermission>(initialPermission);
  const [facts, setFacts] = useState(initialFacts);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await updateClientAction(clientId, { name, contact, permission, factsJson: facts });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFlash("Saved");
      flashTimer.current = setTimeout(() => setFlash(null), 2500);
    });

  return (
    <div className="grid gap-5">
      <div>
        <label className="label mb-2 block" htmlFor="client-name">
          Name.
        </label>
        <input
          id="client-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label mb-2 block" htmlFor="client-contact">
          Contact.
        </label>
        <input
          id="client-contact"
          className="input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Jane Doe, jane@acme.com"
        />
      </div>

      <div>
        <label className="label mb-2 block" htmlFor="client-permission">
          Permission.
        </label>
        <select
          id="client-permission"
          className="select"
          value={permission}
          onChange={(e) => setPermission(e.target.value as ClientPermission)}
        >
          <option value="none">None</option>
          <option value="verbal">Verbal</option>
          <option value="written">Written</option>
        </select>
        <p className="mt-2 text-xs text-(--muted)">
          Only written permission lets the case-study engine name the client publicly, anything less runs
          anonymized.
        </p>
      </div>

      <div>
        <label className="label mb-2 block" htmlFor="client-facts">
          Recorded facts.
        </label>
        <textarea
          id="client-facts"
          className="textarea min-h-[220px] font-mono text-[13px] leading-relaxed"
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          spellCheck={false}
        />
        <p className="mt-2 text-xs text-(--muted)">
          Recorded facts only, metrics with source, quotes with attribution, timeline. This is the ONLY
          material the case-study engine may use.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
        {flash ? <span className="text-sm text-(--lime)">{flash}</span> : null}
        {error ? <span className="text-sm text-(--red)">{error}</span> : null}
      </div>
    </div>
  );
}
