import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, listSolutions } from "@/db/repo";
import { Card, SectionLabel } from "@/components/ui";
import { ClientForm } from "@/components/clients/client-form";
import { LogoUploader } from "@/components/clients/logo-uploader";
import { PermissionPill } from "@/components/clients/permission-pill";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  const attached = listSolutions().filter((s) => s.clientId === id);

  return (
    <div>
      <div className="mb-10">
        <Link href="/clients" className="label transition-colors hover:text-(--text)">
          All clients.
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium tracking-[-0.02em]">{client.name}</h1>
          <PermissionPill permission={client.permission} />
        </div>
        <p className="label mt-3">Created {fmtDate(client.createdAt)}.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <SectionLabel>Record.</SectionLabel>
          <Card>
            <ClientForm
              clientId={client.id}
              initialName={client.name}
              initialContact={client.contact ?? ""}
              initialPermission={client.permission}
              initialFacts={client.factsJson ?? ""}
            />
          </Card>
        </div>

        <div className="grid content-start gap-8">
          <div>
            <SectionLabel>Logo.</SectionLabel>
            <Card>
              <LogoUploader clientId={client.id} logoMediaId={client.logoMediaId} clientName={client.name} />
            </Card>
          </div>

          <div>
            <SectionLabel>Attached solutions.</SectionLabel>
            {attached.length === 0 ? (
              <p className="text-sm text-(--muted)">
                None. Attach this client from a solution board, attaching unblocks the case-study engine.
              </p>
            ) : (
              <ul className="space-y-2">
                {attached.map((s) => (
                  <li key={s.id} className="text-sm text-(--muted)">
                    <Link href={`/solutions/${s.id}`} className="underline-offset-4 hover:underline">
                      {s.title}
                    </Link>{" "}
                    <span className="font-mono text-xs">· {s.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
