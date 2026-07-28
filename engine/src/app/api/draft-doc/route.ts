import { NextRequest, NextResponse } from "next/server";
import { getProvider, LONGFORM_MODEL } from "@/lib/llm";
import { docWriterSystem } from "@/lib/prompts";
import {
  createJob,
  ensureSolutionDocAsset,
  finishJob,
  getSolution,
  listMediaForSolution,
  setAssetStatus,
  writeVersion,
} from "@/db/repo";

export const runtime = "nodejs";

type TranscriptTurn = { role?: unknown; content?: unknown };

function formatTranscript(interviewLog: string | null): string {
  if (!interviewLog) return "(no interview yet)";
  let turns: TranscriptTurn[] = [];
  try {
    const parsed = JSON.parse(interviewLog);
    if (Array.isArray(parsed)) turns = parsed;
  } catch {
    return "(no interview yet)";
  }
  const lines = turns
    .filter((t) => t && typeof t.content === "string")
    .map((t) => `${t.role === "assistant" ? "Interviewer" : "Team"}: ${t.content}`);
  return lines.length ? lines.join("\n\n") : "(no interview yet)";
}

export async function POST(req: NextRequest) {
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return NextResponse.json({ error: configError }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { solutionId?: unknown } | null;
  const solutionId = typeof body?.solutionId === "string" ? body.solutionId : null;
  if (!solutionId) return NextResponse.json({ error: "solutionId is required." }, { status: 400 });

  const solution = getSolution(solutionId);
  if (!solution) return NextResponse.json({ error: "Solution not found." }, { status: 404 });

  const media = listMediaForSolution(solutionId);
  const userMessage = [
    `Title: ${solution.title}`,
    `INFO DUMP\n${solution.dumpRaw || "(none)"}`,
    `LINKS\n${solution.links || "(none)"}`,
    `INTERVIEW TRANSCRIPT\n${formatTranscript(solution.interviewLog)}`,
    `UPLOADED MEDIA (reference inline as media://<id> where a visual belongs)\n${
      media.length ? media.map((m) => `- media://${m.id} (${m.kind}, ${m.mime})`).join("\n") : "(none)"
    }`,
    "Write the complete solution document now.",
  ].join("\n\n---\n\n");

  const asset = ensureSolutionDocAsset(solutionId);
  setAssetStatus(asset.id, "generating");
  const jobId = createJob({ assetId: asset.id, engine: "solution_doc", model: LONGFORM_MODEL });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // If the client disconnects mid-stream, keep the generation running and
      // persist the finished draft anyway; only provider errors mark it failed.
      let disconnected = false;
      const safeEnqueue = (chunk: Uint8Array) => {
        if (disconnected) return;
        try {
          controller.enqueue(chunk);
        } catch {
          disconnected = true;
        }
      };
      try {
        const result = await provider.stream({
          system: docWriterSystem(),
          messages: [{ role: "user", content: userMessage }],
          model: LONGFORM_MODEL,
          maxTokens: 24000,
          onText: (delta) => safeEnqueue(encoder.encode(delta)),
        });
        writeVersion(asset.id, result.text, "ai");
        setAssetStatus(asset.id, "draft");
        finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut });
        if (!disconnected) controller.close();
      } catch (err) {
        setAssetStatus(asset.id, "failed");
        finishJob(jobId, { status: "failed", error: err instanceof Error ? err.message : String(err) });
        if (!disconnected) controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
