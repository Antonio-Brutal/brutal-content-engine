import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { MEDIA_DIR } from "@/db/client";
import { costForSolution, getSolution, listAssetsForSolution, listMediaForSolution, listPublicationsForAsset } from "@/db/repo";
import { getGermanVariant } from "@/lib/compliance";

export const runtime = "nodejs";

// Campaign export: one zip per solution carrying everything a human needs to
// ship or archive the campaign: manifest.json (statuses, publications, cost),
// one markdown file per drafted asset, German variants under de/, and every
// uploaded media file under media/.

const FILE_NAMES: Record<string, string> = {
  solution: "solution-doc.md",
  blog: "blog.md",
  page: "page.md",
  tweet: "tweet.md",
  linkedin: "linkedin.md",
  case_study: "case-study.md",
};

function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "solution";
}

function parseMetrics(metricsJson: string | null): unknown {
  if (!metricsJson) return null;
  try {
    return JSON.parse(metricsJson);
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ solutionId: string }> }) {
  const { solutionId } = await params;
  const solution = getSolution(solutionId);
  if (!solution) return NextResponse.json({ error: "Solution not found." }, { status: 404 });

  const assets = listAssetsForSolution(solutionId);
  const zip = new JSZip();

  const publications = assets.flatMap((a) =>
    listPublicationsForAsset(a.id).map((p) => ({
      assetType: a.type,
      platform: p.platform,
      status: p.status,
      url: p.url,
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
      metrics: parseMetrics(p.metricsJson),
    }))
  );

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        title: solution.title,
        solutionId: solution.id,
        solutionStatus: solution.status,
        exportedAt: new Date().toISOString(),
        assetStatuses: Object.fromEntries(assets.map((a) => [a.type, a.status])),
        publications,
        costUsd: costForSolution(solutionId),
      },
      null,
      2
    )
  );

  for (const asset of assets) {
    if (!asset.bodyMd.trim()) continue;
    const name = FILE_NAMES[asset.type] ?? `${asset.type}.md`;
    zip.file(name, asset.bodyMd);
    const de = getGermanVariant(asset.metaJson);
    if (de) zip.file(`de/${name}`, de.bodyMd);
  }

  for (const media of listMediaForSolution(solutionId)) {
    const fileName = path.basename(media.storageKey);
    const filePath = path.join(MEDIA_DIR, fileName);
    if (!fs.existsSync(filePath)) continue;
    zip.file(`media/${fileName}`, fs.readFileSync(filePath));
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${slugify(solution.title)}-campaign.zip"`,
    },
  });
}
