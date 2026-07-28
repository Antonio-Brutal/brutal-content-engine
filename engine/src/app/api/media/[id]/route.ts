import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { MEDIA_DIR } from "@/db/client";
import { getMedia } from "@/db/repo";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = getMedia(id);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const filePath = path.join(MEDIA_DIR, path.basename(media.storageKey));
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "File is missing on disk." }, { status: 404 });

  const stream = Readable.toWeb(fs.createReadStream(filePath)) as unknown as ReadableStream<Uint8Array>;
  const headers: Record<string, string> = {
    "Content-Type": media.mime,
    "Content-Length": String(fs.statSync(filePath).size),
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // SVG can carry scripts; force download so it never executes on this origin.
  if (media.mime === "image/svg+xml") headers["Content-Disposition"] = "attachment";
  return new Response(stream, { headers });
}
