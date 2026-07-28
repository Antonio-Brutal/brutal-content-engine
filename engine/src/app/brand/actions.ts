"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createVaultEntry, updateVaultEntry, type VaultEntry } from "@/db/repo";
import { distillDiffs } from "@/lib/voice";

const KINDS = ["doc", "rule", "prompt_override"] as const;

/** Create a vault entry from the /brand/new form, then land on its detail page. */
export async function createEntry(formData: FormData) {
  const kindRaw = String(formData.get("kind") ?? "");
  const kind: VaultEntry["kind"] = (KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as VaultEntry["kind"])
    : "doc";
  const title = String(formData.get("title") ?? "").trim();
  const contentMd = String(formData.get("contentMd") ?? "").trim();
  if (!title || !contentMd) redirect("/brand/new");

  const entry = createVaultEntry({ kind, title, contentMd });
  revalidatePath("/brand");
  redirect(`/brand/${entry.id}`);
}

/** Flip an entry's active flag (form action from list + detail pages). */
export async function toggleActive(formData: FormData) {
  const entryId = String(formData.get("id") ?? "");
  if (!entryId) return;
  updateVaultEntry(entryId, { active: formData.get("next") === "true" });
  revalidatePath("/brand");
  revalidatePath(`/brand/${entryId}`);
}

/** Save edited content (called from the client editor). Version bump on content change happens in the repo. */
export async function saveContent(entryId: string, contentMd: string) {
  updateVaultEntry(entryId, { contentMd });
  revalidatePath("/brand");
  revalidatePath(`/brand/${entryId}`);
}

/**
 * Voice loop: distill unprocessed edit diffs into proposed standing rules.
 * Slow (LLM call), callers show a pending state via useTransition.
 */
export async function runDistillation(): Promise<{ processed: number; proposed: number; error?: string }> {
  const result = await distillDiffs();
  revalidatePath("/brand");
  return result;
}
