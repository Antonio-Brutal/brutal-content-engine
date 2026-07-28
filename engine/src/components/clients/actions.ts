"use server";

import { revalidatePath } from "next/cache";
import { attachClientToSolution } from "@/db/repo";
import { runEngine, type RunResult } from "@/lib/engines/generate";

/** Attach (clientId) or detach (null) a client record on a solution. */
export async function attachClientAction(solutionId: string, clientId: string | null) {
  attachClientToSolution(solutionId, clientId);
  revalidatePath(`/solutions/${solutionId}`);
  revalidatePath("/solutions");
  revalidatePath("/clients");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

/**
 * Run the case-study engine for a solution. Slow (30-90s LLM call) -
 * callers show a pending state via useTransition.
 */
export async function generateCaseStudyAction(solutionId: string): Promise<RunResult> {
  const result = await runEngine("case_study", solutionId);
  revalidatePath(`/solutions/${solutionId}`);
  revalidatePath("/");
  return result;
}
