import Link from "next/link";
import { notFound } from "next/navigation";
import { getAsset, listVersions } from "@/db/repo";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { PLATFORMS, formatForPlatform, unresolvedTokens } from "@/lib/engines/exports";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { StudioAssetEditor } from "@/components/studio/asset-editor";
import { CopyButton } from "@/components/studio/copy-button";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function StudioAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const asset = getAsset(assetId);
  if (!asset) notFound();

  const isEngineType = asset.type in ENGINE_LABELS;
  const label = isEngineType ? ENGINE_LABELS[asset.type as EngineType] : "Solution doc";
  const versions = listVersions(asset.id);
  const hasBody = asset.bodyMd.trim().length > 0;

  const exports = hasBody
    ? Object.entries(PLATFORMS)
        .filter(([, p]) => p.assetTypes.includes(asset.type))
        .map(([key, p]) => ({ key, label: p.label, text: formatForPlatform(key, asset.bodyMd, asset.solutionId) }))
    : [];
  const unresolved = hasBody ? unresolvedTokens(asset.bodyMd, asset.solutionId) : [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <Link href="/studio" className="label transition-colors hover:text-(--text)">
          Studio.
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium tracking-[-0.02em]">{label}</h1>
          <StatusPill status={asset.status} />
        </div>
        <p className="label mt-3">
          Standalone, no solution attached · created {fmtDate(asset.createdAt)} · updated {fmtDate(asset.updatedAt)}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <StudioAssetEditor assetId={asset.id} initialBody={asset.bodyMd} approved={asset.status === "approved"} />
        </Card>

        <div className="space-y-10">
          <div>
            <SectionLabel>Regenerate.</SectionLabel>
            <p className="text-sm text-(--muted)">
              Not available for ad-hoc assets, the brief is not stored.{" "}
              {isEngineType ? (
                <>
                  <Link href={`/studio?type=${asset.type}`} className="text-(--lime) underline underline-offset-4">
                    Duplicate to studio
                  </Link>{" "}
                  with the engine preselected and paste the brief again.
                </>
              ) : null}
            </p>
          </div>

          <div>
            <SectionLabel>Copy for platform.</SectionLabel>
            {exports.length === 0 ? (
              <p className="text-sm text-(--muted)">Nothing to copy, no body yet.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {exports.map((e) => (
                    <CopyButton key={e.key} label={e.label} text={e.text} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-(--muted)">
                  No solution means no publication records, tokens like {"{{blog_url}}"} stay literal in the copied text.
                  {unresolved.length > 0 ? <> Unresolved here: {unresolved.join(", ")}.</> : null}
                </p>
              </>
            )}
          </div>

          <div>
            <SectionLabel>Versions.</SectionLabel>
            {versions.length === 0 ? (
              <p className="text-sm text-(--muted)">
                None yet. A version is written when the AI drafts and each time you approve.
              </p>
            ) : (
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className="font-mono text-xs text-(--muted)">
                    v{v.version} · {v.author} · {fmtDate(v.createdAt)}
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
