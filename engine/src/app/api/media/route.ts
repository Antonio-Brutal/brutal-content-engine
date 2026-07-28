import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { MEDIA_DIR } from "@/db/client";
import { createMedia, getSolution, id as newId, type Media } from "@/db/repo";

export const runtime = "nodejs";

const KINDS = ["screenshot", "clip", "logo", "photo", "infographic"] as const;

// SVG is allowed here because /api/media/[id] serves it with nosniff + attachment.
const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

function resolveKind(raw: unknown): Media["kind"] {
  return typeof raw === "string" && (KINDS as readonly string[]).includes(raw) ? (raw as Media["kind"]) : "screenshot";
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });

  const file = form.get("file");
  const solutionId = form.get("solutionId");
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (typeof solutionId !== "string" || !solutionId) {
    return NextResponse.json({ error: "solutionId is required." }, { status: 400 });
  }
  if (!getSolution(solutionId)) return NextResponse.json({ error: "Solution not found." }, { status: 404 });

  const mime = file.type || "";
  if (!IMAGE_MIMES.has(mime) && !VIDEO_MIMES.has(mime)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WebP, GIF, SVG, MP4, QuickTime, or WebM uploads are accepted." }, { status: 400 });
  }

  const maxBytes = VIDEO_MIMES.has(mime) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    const limitMb = Math.floor(maxBytes / (1024 * 1024));
    return NextResponse.json({ error: `File is too large. The limit is ${limitMb} MB.` }, { status: 413 });
  }

  const extFromName = path.extname(file.name || "").slice(1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const extFromMime = (mime.split("/")[1] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = extFromName || extFromMime || "bin";

  const storageKey = `${newId()}.${ext}`;
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.writeFileSync(path.join(MEDIA_DIR, storageKey), Buffer.from(await file.arrayBuffer()));

  const row = createMedia({ solutionId, kind: resolveKind(form.get("kind")), storageKey, mime });
  return NextResponse.json(row, { status: 201 });
}
