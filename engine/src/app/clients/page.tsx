import Link from "next/link";
import { listClients } from "@/db/repo";
import { EmptyState, PageTitle } from "@/components/ui";
import { PermissionPill } from "@/components/clients/permission-pill";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export default function ClientsPage() {
  const clients = listClients();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Client records feed the case-study engine, recorded facts only, permission tracked per client. A solution's case study stays blocked until one of these is attached.">
          Clients
        </PageTitle>
        <Link href="/clients/new" className="btn btn-primary mt-1 shrink-0">
          Add client
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No client records yet.">
          <p>
            Create one before attaching it to a solution -{" "}
            <Link href="/clients/new" className="text-(--lime) underline underline-offset-4">
              Add client
            </Link>
            . The case-study engine only ever uses the facts recorded here.
          </p>
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-4">
                {c.logoMediaId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${c.logoMediaId}`}
                    alt={`${c.name} logo`}
                    className="h-9 w-9 shrink-0 rounded-md bg-(--panel-2) object-contain"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-(--panel-2) font-mono text-[10px] text-(--muted)">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/clients/${c.id}`}
                    className="block truncate font-medium underline-offset-4 hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="label mt-1">Created {fmtDate(c.createdAt)}.</p>
                </div>
              </div>
              <div className="shrink-0">
                <PermissionPill permission={c.permission} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
