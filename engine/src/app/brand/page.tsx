import Link from "next/link";
import { listVault, listUnprocessedDiffs, type VaultEntry } from "@/db/repo";
import { EmptyState, PageTitle, SectionLabel } from "@/components/ui";
import { toggleActive } from "./actions";
import { formatDate } from "./format";
import { VoiceLoop } from "./voice-loop";

export const dynamic = "force-dynamic";

const GROUPS: { kind: VaultEntry["kind"]; label: string; note?: string }[] = [
  { kind: "doc", label: "Docs." },
  {
    kind: "rule",
    label: "Standing rules.",
    note: "Activating a proposed rule approves it, from then on it is added to every engine prompt.",
  },
  {
    kind: "prompt_override",
    label: "Prompt overrides.",
    note: "Create an entry titled override:<engine> (blog, page, tweet, linkedin, case_study, solution) and its content is appended to that engine's system prompt as operator instructions that win.",
  },
];

function isProposed(entry: VaultEntry) {
  return entry.kind === "rule" && !entry.active && entry.title.startsWith("Proposed: ");
}

export default function BrandVaultPage() {
  const entries = listVault();
  const unprocessedCount = listUnprocessedDiffs().length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <PageTitle sub="Every engine prompt inherits the active entries below, deactivate one and the next generation run no longer sees it.">
          Brand vault
        </PageTitle>
        <Link href="/brand/new" className="btn btn-primary shrink-0">
          Add document
        </Link>
      </div>

      <section className="mb-10">
        <SectionLabel>Voice loop.</SectionLabel>
        <VoiceLoop unprocessedCount={unprocessedCount} />
      </section>

      {entries.length === 0 ? (
        <EmptyState title="The vault is empty.">
          <p>Add the style pack and a hallmark post, every engine reads the active entries before writing a word.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-10">
          {GROUPS.map((group) => {
            const rows = entries.filter((e) => e.kind === group.kind);
            return (
              <section key={group.kind}>
                <SectionLabel>{group.label}</SectionLabel>
                {group.note ? <p className="-mt-2 mb-3 text-xs text-(--muted)">{group.note}</p> : null}
                {rows.length === 0 ? (
                  <p className="text-sm text-(--muted)">None yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {rows.map((entry) => (
                      <div key={entry.id} className="card flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <Link
                            href={`/brand/${entry.id}`}
                            className="block truncate font-medium underline-offset-4 hover:underline"
                          >
                            {entry.title}
                          </Link>
                          <p className="mt-1 text-xs text-(--muted)">
                            v{entry.version} · Updated {formatDate(entry.updatedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isProposed(entry) ? <span className="pill text-(--amber)">proposed</span> : null}
                          <form action={toggleActive}>
                            <input type="hidden" name="id" value={entry.id} />
                            <input type="hidden" name="next" value={entry.active ? "false" : "true"} />
                            <button
                              type="submit"
                              className={`pill cursor-pointer ${entry.active ? "text-(--lime)" : "text-(--muted)"}`}
                              title={
                                isProposed(entry)
                                  ? "Approve, activating adds this rule to every engine prompt"
                                  : entry.active
                                    ? "Deactivate"
                                    : "Activate"
                              }
                            >
                              {entry.active ? "active" : "inactive"}
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
