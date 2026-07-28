import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { MEDIA_DIR } from "@/db/client";
import { createMedia } from "@/db/repo";
import { brandArtDirection, getImageProvider } from "@/lib/images";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

// POST {prompt, solutionId?, kind?, raw?} → generates an on-brand image into the
// media library and returns the media row. raw=true skips the art-direction wrapper.
export async function POST(req: NextRequest) {
  const provider = getImageProvider();
  const configError = provider.configError();
  if (configError) return NextResponse.json({ error: configError }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { prompt?: string; solutionId?: string; kind?: string; raw?: boolean; size?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  const size = body?.size === "1024x1024" || body?.size === "1024x1536" || body?.size === "1536x1024" ? body.size : undefined;

  try {
    const { data, mime } = await provider.generate({ prompt: body?.raw ? prompt : brandArtDirection(prompt), size });
    const ext = mime === "image/png" ? "png" : "img";
    const storageKey = `${nanoid(12)}.${ext}`;
    fs.writeFileSync(path.join(MEDIA_DIR, storageKey), data);
    const kind = body?.kind === "photo" ? ("photo" as const) : ("infographic" as const);
    const row = createMedia({ solutionId: body?.solutionId, kind, storageKey, mime, alt: prompt.slice(0, 200) });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
