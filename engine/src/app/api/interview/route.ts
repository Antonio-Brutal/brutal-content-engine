import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODEL, getProvider, type ChatMessage } from "@/lib/llm";
import { interviewerSystem } from "@/lib/prompts";
import { createJob, finishJob, getSolution, listMediaForSolution } from "@/db/repo";

export const runtime = "nodejs";

// The client transcript starts with the interviewer's opening question, so a synthetic
// user turn kicks the conversation off and keeps roles alternating.
const KICKOFF: ChatMessage = {
  role: "user",
  content: "(Interview start. Review what you already have, then ask your first question.)",
};

function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((m): ChatMessage[] => {
    if (!m || typeof m !== "object") return [];
    const r = m as { role?: unknown; content?: unknown };
    if (typeof r.content !== "string") return [];
    if (r.role !== "user" && r.role !== "assistant") return [];
    return [{ role: r.role === "assistant" ? "assistant" : "user", content: r.content }];
  });
}

export async function POST(req: NextRequest) {
  const provider = getProvider();
  const configError = provider.configError();
  if (configError) return NextResponse.json({ error: configError }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { solutionId?: unknown; messages?: unknown } | null;
  const solutionId = typeof body?.solutionId === "string" ? body.solutionId : null;
  if (!solutionId) return NextResponse.json({ error: "solutionId is required." }, { status: 400 });

  const solution = getSolution(solutionId);
  if (!solution) return NextResponse.json({ error: "Solution not found." }, { status: 404 });

  const history = parseMessages(body?.messages);
  const system = interviewerSystem({
    title: solution.title,
    dumpRaw: solution.dumpRaw,
    links: solution.links,
    mediaCount: listMediaForSolution(solutionId).length,
  });

  const jobId = createJob({ engine: "interview", model: DEFAULT_MODEL });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // a closed tab must not turn a finished generation into a failed job
      let disconnected = false;
      const safeEnqueue = (delta: string) => {
        if (disconnected) return;
        try {
          controller.enqueue(encoder.encode(delta));
        } catch {
          disconnected = true;
        }
      };
      try {
        const result = await provider.stream({
          system,
          messages: [KICKOFF, ...history],
          onText: safeEnqueue,
        });
        finishJob(jobId, { status: "succeeded", tokensIn: result.tokensIn, tokensOut: result.tokensOut });
        if (!disconnected) controller.close();
      } catch (err) {
        finishJob(jobId, { status: "failed", error: err instanceof Error ? err.message : String(err) });
        if (!disconnected) controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
