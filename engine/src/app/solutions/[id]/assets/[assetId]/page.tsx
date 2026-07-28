import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { costForAsset, getAsset, getSolution, listCaseStudyTemplates, listJobs, listPublicationsForAsset, listVersions } from "@/db/repo";
import { getGermanVariant, getReview } from "@/lib/compliance";
import { CaseStudyView } from "@/components/case-study/CaseStudyView";
import { TemplatePicker } from "@/components/case-study/template-picker";
import { PLATFORMS, unresolvedTokens } from "@/lib/engines/exports";
import { ENGINE_LABELS, type EngineType } from "@/lib/engines/prompts";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { AssetEditor } from "@/components/board/asset-editor";
import { ExportPanel } from "@/components/board/export-panel";
import { ImageGenerator } from "@/components/board/image-generator";
import { RunEngineButton } from "@/components/board/run-engine-button";
import { AutoRefresh } from "@/components/auto-refresh";
import { ReviewCard } from "@/components/review/review-card";
import { LanguageToggle } from "@/components/review/language-toggle";
import { VersionsPanel } from "@/components/review/version-compare";

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
  const review = getReview(asset.metaJson);
  const german = getGermanVariant(asset.metaJson);
  const spend = costForAsset(asset.id);
  // Escape hatch: a server restart mid-run leaves the asset wedged in
  // "generating" forever. The page is force-dynamic, so this staleness
  // check intentionally runs per request (same pattern as board/column.tsx).
  // eslint-disable-next-line react-hooks/purity
  const generationWedged = asset.status === "generating" && Date.now() - asset.updatedAt > 3 * 60 * 1000;

  return (
    <div>
      <AutoRefresh active={asset.status === "generating"} />
      <div className="mb-10">
        <Link href={`/solutions/${id}`} className="label transition-colors hover:text-(--text)">
          Back to the board.
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-medium tracking-[-0.02em]">{ENGINE_LABELS[type]}</h1>
          <StatusPill status={asset.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <p className="label">
            {solution.title} · updated {fmtDate(asset.updatedAt)}.
          </p>
          <p className="label">
            Generation spend. <span className="font-mono tabular-nums text-(--text)">${spend.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <SectionLabel>Asset.</SectionLabel>
      <VersionsPanel
        versions={versions.map((v) => ({ id: v.id, version: v.version, author: v.author, createdAt: v.createdAt, bodyMd: v.bodyMd }))}
      >
        {asset.status === "generating" ? (
          <Card>
            <StatusPill status="generating" />
            <p className="mt-3 text-sm text-(--muted)">Working… The page refreshes itself while the run is in flight.</p>
            {generationWedged ? (
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
            {hasBody ? <ReviewCard assetId={asset.id} solutionId={id} review={review} /> : null}
            {hasBody ? (
              <LanguageToggle assetId={asset.id} solutionId={id} de={german} assetUpdatedAt={asset.updatedAt}>
                {type === "case_study" ? (
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
                          assetId={asset.id}
                          solutionId={id}
                          type={type}
                          initialBody={asset.bodyMd}
                          approved={asset.status === "approved"}
                        />
                      </div>
                    </details>
                  </div>
                ) : (
                  <Card>
                    <AssetEditor
                      assetId={asset.id}
                      solutionId={id}
                      type={type}
                      initialBody={asset.bodyMd}
                      approved={asset.status === "approved"}
                    />
                  </Card>
                )}
              </LanguageToggle>
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
      </VersionsPanel>

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
