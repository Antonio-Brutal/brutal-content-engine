import Link from "next/link";
import { notFound } from "next/navigation";
import { getVaultEntry } from "@/db/repo";
import { PageTitle } from "@/components/ui";
import { toggleActive } from "../actions";
import { formatDate, KIND_LABELS } from "../format";
import { EntryEditor } from "./entry-editor";

export const dynamic = "force-dynamic";

export default async function VaultEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getVaultEntry(id);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/brand" className="label transition-colors hover:text-(--text)">
        Back to vault.
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <PageTitle
          sub={`${KIND_LABELS[entry.kind]} · v${entry.version} · Created ${formatDate(entry.createdAt)} · Updated ${formatDate(entry.updatedAt)}`}
        >
          {entry.title}
        </PageTitle>
        <form action={toggleActive} className="flex shrink-0 items-center gap-3 pt-1">
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="next" value={entry.active ? "false" : "true"} />
          <span className={`pill ${entry.active ? "text-(--lime)" : "text-(--muted)"}`}>
            {entry.active ? "active" : "inactive"}
          </span>
          <button type="submit" className="btn">
            {entry.active ? "Deactivate" : "Activate"}
          </button>
        </form>
      </div>

      <EntryEditor entryId={entry.id} contentMd={entry.contentMd} />
    </div>
  );
}
