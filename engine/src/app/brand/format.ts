// Shared display helpers for the Brand Vault surface. Kept dependency-free so
// both server pages and client components can import it.

export type VaultKind = "doc" | "rule" | "prompt_override";

export const KIND_LABELS: Record<VaultKind, string> = {
  doc: "Doc",
  rule: "Standing rule",
  prompt_override: "Prompt override",
};

export function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
