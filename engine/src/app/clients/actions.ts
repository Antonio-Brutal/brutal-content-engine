"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MEDIA_DIR } from "@/db/client";
import { createClient, createMedia, getClient, id as newId, updateClient, type Client } from "@/db/repo";

const PERMISSIONS = ["none", "verbal", "written"] as const;

function resolvePermission(raw: unknown): Client["permission"] {
  return typeof raw === "string" && (PERMISSIONS as readonly string[]).includes(raw)
    ? (raw as Client["permission"])
    : "none";
}

/** Create a client record from the /clients/new form, then land on its detail page. */
export async function createClientAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/clients/new");

  const contact = String(formData.get("contact") ?? "").trim();
  const factsJson = String(formData.get("factsJson") ?? "").trim();
  const client = createClient({
    name,
    contact: contact || undefined,
    permission: resolvePermission(formData.get("permission")),
    factsJson: factsJson || undefined,
  });
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

/** Save edits from the client detail form. */
export async function updateClientAction(
  clientId: string,
  patch: { name: string; contact: string; permission: string; factsJson: string }
) {
  const name = patch.name.trim();
  if (!name) return { ok: false as const, error: "Name is required." };
  if (!getClient(clientId)) return { ok: false as const, error: "Client not found." };

  updateClient(clientId, {
    name,
    contact: patch.contact.trim() || null,
    permission: resolvePermission(patch.permission),
    factsJson: patch.factsJson.trim() || null,
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/solutions");
  return { ok: true as const };
}

/**
 * Store a logo upload as a media row (kind "logo") and point the client at it.
 * Same storage and serving path as /api/media, that route requires a solutionId,
 * which a client record does not have, so the write happens here instead.
 */
export async function uploadLogoAction(clientId: string, formData: FormData) {
  const client = getClient(clientId);
  if (!client) return { ok: false as const, error: "Client not found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose an image first." };

  const mime = file.type || "";
  if (!mime.startsWith("image/")) return { ok: false as const, error: "Logos must be images." };

  const extFromName = path.extname(file.name || "").slice(1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const extFromMime = (mime.split("/")[1] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = extFromName || extFromMime || "bin";

  const storageKey = `${newId()}.${ext}`;
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.writeFileSync(path.join(MEDIA_DIR, storageKey), Buffer.from(await file.arrayBuffer()));

  const row = createMedia({ kind: "logo", storageKey, mime, alt: `${client.name} logo` });
  updateClient(clientId, { logoMediaId: row.id });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}
