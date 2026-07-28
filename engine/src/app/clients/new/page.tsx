import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/clients" className="label transition-colors hover:text-(--text)">
        All clients.
      </Link>

      <div className="mt-4">
        <PageTitle sub="A client record is the closed world for its case studies: the engine may only use what is written down here, and only names the client publicly with written permission.">
          Add client
        </PageTitle>
      </div>

      <form action={createClientAction} className="card grid gap-5 p-6">
        <div>
          <label className="label mb-2 block" htmlFor="name">
            Name.
          </label>
          <input id="name" name="name" className="input" required placeholder="Acme Logistics" />
        </div>

        <div>
          <label className="label mb-2 block" htmlFor="contact">
            Contact.
          </label>
          <input id="contact" name="contact" className="input" placeholder="Jane Doe, jane@acme.com" />
        </div>

        <div>
          <label className="label mb-2 block" htmlFor="permission">
            Permission.
          </label>
          <select id="permission" name="permission" className="select" defaultValue="none">
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
          <label className="label mb-2 block" htmlFor="factsJson">
            Recorded facts.
          </label>
          <textarea
            id="factsJson"
            name="factsJson"
            className="textarea font-mono text-[13px] leading-relaxed"
            rows={10}
            placeholder="Metric: 40% faster intake (source: their Q3 ops report). Quote: ..., Jane Doe, COO. Timeline: kickoff March, live May."
          />
          <p className="mt-2 text-xs text-(--muted)">
            Recorded facts only, metrics with source, quotes with attribution, timeline. This is the ONLY
            material the case-study engine may use.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
