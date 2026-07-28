import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAsset, getSolution, listCaseStudyTemplates, listJobs, listPublicationsForAsset, listVersions } from "@/db/repo";
import { CaseStudyView } from "@/components/case-study/CaseStudyView";
import { TemplatePicker } from "@/components/case-study/template-picker";
import { PLATFORMS, unresolvedTokens } from "@/lib/engines/exports";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { AssetEditor } from "@/components/board/asset-editor";
import { ExportPanel } from "@/components/board/export-panel";
import { ImageGenerator } from "@/components/board/image-generator";
import { RunEngineButton } from "@/components/board/run-engine-button";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function AssetPanelPage({
  params,
}: {
  params: Promise<{ id: string; assetId: string }>;
}) {
  const { id, assetId } = await params;
  const solution = getSolution(id);
  if (!solution) notFound();
  const asset = getAsset(assetId);
  if (!asset || asset.solutionId !== id) notFound();
  // The solution doc has its own editor on the board, this panel is for the engines.
  if (asset.type === "solution") redirect(`/solutions/${id}`);
  const type = asset.type as EngineType;

  const versions = listVersions(asset.id);
  const livePublications = listPublicationsForAsset(asset.id).filter((p) => p.status === "live");
  const platforms = Object.entries(PLATFORMS)
    .filter(([, v]) => v.assetTypes.includes(asset.type))
    .map(([key, v]) => ({ key, label: v.label }));
  const locked = unresolvedTokens(asset.bodyMd, asset.solutionId);
  const jobError = listJobs(200).find((j) => j.assetId === asset.id)?.error ?? null;
  const hasBody = asset.bodyMd.trim().length > 0;

  return (
    <div>
      <div className="mb-10">
        <Link href={`/solutions/${id}`} className="label transition-colors hover:text-(--text)">
          Back to the board.
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium tracking-[-0.02em]">{ENGINE_LABELS[type]}</h1>
          <StatusPill status={asset.status} />
        </div>
        <p className="label mt-3">
          {solution.title} · updated {fmtDate(asset.updatedAt)}.
        </p>
      </div>

      <SectionLabel>Asset.</SectionLabel>
      <div className="mb-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          {asset.status === "generating" ? (
            <Card>
              <StatusPill status="generating" />
              <p className="mt-3 text-sm text-(--muted)">Working… Reload the page to see the result.</p>
              {/* Escape hatch: a server restart mid-run leaves the asset wedged in
                  "generating" forever. The page is force-dynamic, so this staleness
                  check runs per request. */}
              {Date.now() - asset.updatedAt > 3 * 60 * 1000 ? (
                <div className="mt-3">
                  <RunEngineButton
                    type={type}
                    solutionId={id}
                    label="Taking too long? Regenerate"
                    pendingLabel="Regenerating…"
                    tone="amber"
                  />
                </div>
              ) : null}
            </Card>
          ) : (
            <div className="space-y-4">
              {asset.status === "failed" ? (
                <Card className="border-(--red)">
                  <p className="text-sm text-(--red)">{jobError ?? "Generation failed."}</p>
                  <div className="mt-3">
                    <RunEngineButton type={type} solutionId={id} label="Retry" pendingLabel="Retrying…" />
                  </div>
                </Card>
              ) : null}
              {asset.status === "blocked" ? (
                <Card className="border-(--amber)">
                  <p className="text-sm text-(--amber)">
                    Blocked: no client record attached. Attach a client on the board to unblock the case study.
                  </p>
                </Card>
              ) : null}
              {asset.status === "stale" ? (
                <Card className="border-(--amber)">
                  <p className="text-sm text-(--amber)">
                    Upstream changed since this was generated, the body below may contradict the newer version.
                  </p>
                  <div className="mt-3">
                    <RunEngineButton
                      type={type}
                      solutionId={id}
                      label="Upstream changed, regenerate from new version"
                      pendingLabel="Regenerating…"
                      tone="amber"
                    />
                  </div>
                </Card>
              ) : null}
              {hasBody && type === "case_study" ? (
                <div className="space-y-4">
                  <Card>
                    <p className="label mb-3">Template.</p>
                    <TemplatePicker
                      assetId={asset.id}
                      templates={listCaseStudyTemplates()}
                      current={(() => {
                        try {
                          return asset.metaJson ? (JSON.parse(asset.metaJson).template ?? null) : null;
                        } catch {
                          return null;
                        }
                      })()}
                    />
                  </Card>
                  <Card>
                    <CaseStudyView asset={asset} />
                  </Card>
                  <details className="card p-5">
                    <summary className="label cursor-pointer select-none">Edit source, approve, regenerate.</summary>
                    <div className="mt-4">
                      <AssetEditor
                        key={asset.updatedAt}
                        assetId={asset.id}
                        solutionId={id}
                        type={type}
                        initialBody={asset.bodyMd}
                        approved={asset.status === "approved"}
                      />
                    </div>
                  </details>
                </div>
              ) : hasBody ? (
                <Card>
                  <AssetEditor
                    key={asset.updatedAt}
                    assetId={asset.id}
                    solutionId={id}
                    type={type}
                    initialBody={asset.bodyMd}
                    approved={asset.status === "approved"}
                  />
                </Card>
              ) : asset.status !== "failed" && asset.status !== "blocked" ? (
                <Card>
                  <p className="text-sm text-(--muted)">Nothing generated yet.</p>
                  <div className="mt-3">
                    <RunEngineButton
                      type={type}
                      solutionId={id}
                      label={`Generate ${ENGINE_LABELS[type].toLowerCase()}`}
                      pendingLabel="Drafting… (~60s)"
                    />
                  </div>
                </Card>
              ) : null}
            </div>
          )}
        </div>
        <div>
          <p className="label mb-3">Versions.</p>
          {versions.length === 0 ? (
            <p className="text-sm text-(--muted)">
              None yet. A version is written on each regenerate and each approval.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id}>
                  <details>
                    <summary className="cursor-pointer select-none font-mono text-xs text-(--muted)">
                      v{v.version} · {v.author} · {fmtDate(v.createdAt)}
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-(--line) bg-(--panel-2) p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-(--muted)">
                      {v.bodyMd}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SectionLabel>Publish &amp; export.</SectionLabel>
      <Card className="mb-12">
        <ExportPanel
          assetId={asset.id}
          solutionId={id}
          platforms={platforms}
          locked={locked}
          publications={livePublications.map((p) => ({ platform: p.platform, url: p.url }))}
        />
      </Card>

      <SectionLabel>Image generation.</SectionLabel>
      <Card>
        <ImageGenerator solutionId={id} />
      </Card>
    </div>
  );
}
