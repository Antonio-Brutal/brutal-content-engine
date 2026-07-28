"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { MEDIA_DIR } from "@/db/client";
import { createMedia, getAsset, getSolution, saveWorkingBody, updateClient } from "@/db/repo";
import { runEngine } from "@/lib/engines/generate";
import { brandArtDirection, getImageProvider } from "@/lib/images";
import { fillSlotInMarkdown } from "./parse";

function pathsFor(assetId: string) {
  const asset = getAsset(assetId);
  const sid = asset?.solutionId;
  return [`/solutions/${sid}/assets/${assetId}`, `/solutions/${sid}`, "/case-studies"];
}

/** Upload a file into a named image slot of a case-study asset. */
export async function fillSlotWithUploadAction(assetId: string, slot: string, formData: FormData) {
  const asset = getAsset(assetId);
  if (!asset) return { error: "Asset not found." };
  const file = formData.get("file") as File | null;
  if (!file || !file.type.startsWith("image/")) return { error: "Upload an image file." };

  const ext = (file.name.split(".").pop() || "png").toLowerCase().slice(0, 5);
  const storageKey = `${nanoid(12)}.${ext}`;
  fs.writeFileSync(path.join(MEDIA_DIR, storageKey), Buffer.from(await file.arrayBuffer()));
  const media = createMedia({
    solutionId: asset.solutionId ?? undefined,
    kind: slot === "logo" ? "logo" : "photo",
    storageKey,
    mime: file.type,
    alt: `${slot} image`,
  });

  if (slot === "logo") {
    const clientId = asset.solutionId ? getSolution(asset.solutionId)?.clientId : null;
    if (clientId) updateClient(clientId, { logoMediaId: media.id });
  } else {
    saveWorkingBody(assetId, fillSlotInMarkdown(asset.bodyMd, slot, media.id));
  }
  for (const p of pathsFor(assetId)) revalidatePath(p);
  return { mediaId: media.id };
}

/** Generate an image for a slot with the configured provider (Flux). */
export async function fillSlotWithGeneratedAction(assetId: string, slot: string, brief: string) {
  const asset = getAsset(assetId);
  if (!asset) return { error: "Asset not found." };
  const provider = getImageProvider();
  const configError = provider.configError();
  if (configError) return { error: configError };
  if (!brief.trim()) return { error: "The slot has no brief to generate from." };

  try {
    const { data, mime } = await provider.generate({ prompt: brandArtDirection(brief) });
    const storageKey = `${nanoid(12)}.png`;
    fs.writeFileSync(path.join(MEDIA_DIR, storageKey), data);
    const media = createMedia({
      solutionId: asset.solutionId ?? undefined,
      kind: "infographic",
      storageKey,
      mime,
      alt: brief.slice(0, 200),
    });
    saveWorkingBody(assetId, fillSlotInMarkdown(asset.bodyMd, slot, media.id));
    for (const p of pathsFor(assetId)) revalidatePath(p);
    return { mediaId: media.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Regenerate a case study on a chosen template. */
export async function regenerateWithTemplateAction(assetId: string, template: string) {
  const asset = getAsset(assetId);
  if (!asset || !asset.solutionId) return { error: "Asset not found." };
  const result = await runEngine("case_study", asset.solutionId, { template });
  for (const p of pathsFor(assetId)) revalidatePath(p);
  return result.ok ? { ok: true } : { error: result.error };
}
