import Link from "next/link";
import { Asset, getSolution, listAllAssets, listPublicationsForAsset } from "@/db/repo";
import { Card, EmptyState, PageTitle, StatusPill } from "@/components/ui";

// Shared library view for the two flagship asset types (blog posts, case studies).
// These are the assets that ship to brutal.ai, so the live URL leads the card.

function titleOf(a: Asset) {
  const h1 = a.bodyMd.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : "(untitled draft)";
}

function excerptOf(a: Asset) {
  const body = a.bodyMd
    .replace(/^#.*$/gm, "")
    .replace(/^\*.*\*$/gm, "")
    .replace(/[>*`#|]/g, "")
    .trim();
  const words = body.split(/\s+/).slice(0, 32).join(" ");
  return words ? words + "…" : "Not drafted yet.";
}

export function AssetLibrary({ type, title, sub }: { type: Asset["type"]; title: string; sub: string }) {
  const assets = listAllAssets()
    .filter((a) => a.type === type)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div>
      <PageTitle sub={sub}>{title}</PageTitle>
      {assets.length === 0 ? (
        <EmptyState title="Nothing here yet.">
          <p>
            Assets land here as the pipeline produces them. Start from{" "}
            <Link href="/solutions/new" className="text-(--lime) underline underline-offset-4">
              New solution
            </Link>{" "}
            or the{" "}
            <Link href="/studio" className="text-(--lime) underline underline-offset-4">
              Studio
            </Link>
            .
          </p>
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {assets.map((a) => {
            const solution = a.solutionId ? getSolution(a.solutionId) : undefined;
            const live = listPublicationsForAsset(a.id).filter((p) => p.status === "live" && p.url);
            const href = a.solutionId ? `/solutions/${a.solutionId}/assets/${a.id}` : `/studio/assets/${a.id}`;
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={href} className="text-lg font-medium underline-offset-4 hover:underline">
                      {titleOf(a)}
                    </Link>
                    <p className="label mt-1">
                      {solution ? `From: ${solution.title}.` : "Standalone."}{" "}
                      {new Date(a.updatedAt).toISOString().slice(0, 10)}.
                    </p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-3 max-w-3xl text-sm text-(--muted)">{excerptOf(a)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link href={href} className="btn">
                    Open
                  </Link>
                  {live.map((p) => (
                    <a
                      key={p.id}
                      href={p.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-(--lime) underline underline-offset-4"
                    >
                      Live: {p.url!.replace(/^https?:\/\//, "")}
                    </a>
                  ))}
                  {live.length === 0 && a.status === "approved" ? (
                    <span className="label text-(--amber)">Approved, not yet published to brutal.ai.</span>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
