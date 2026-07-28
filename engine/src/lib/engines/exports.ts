import { liveUrlsForSolution } from "@/db/repo";

// Copy/export layer (spec §05 publish tracking): social link-replies carry
// {{blog_url}}/{{page_url}} tokens; they resolve here, at copy time, from live
// publication records, never from imagination.

export const PLATFORMS: Record<string, { label: string; assetTypes: string[] }> = {
  brutal_blog: { label: "Brutal blog", assetTypes: ["blog"] },
  medium: { label: "Medium", assetTypes: ["blog"] },
  substack: { label: "Substack", assetTypes: ["blog"] },
  hn: { label: "Hacker News", assetTypes: ["blog"] },
  site: { label: "Solutions page", assetTypes: ["page"] },
  x: { label: "X", assetTypes: ["tweet"] },
  linkedin: { label: "LinkedIn", assetTypes: ["linkedin", "case_study"] },
};

export function unresolvedTokens(bodyMd: string, solutionId: string | null): string[] {
  const tokens = Array.from(new Set(bodyMd.match(/\{\{(blog_url|page_url)\}\}/g) ?? []));
  if (!tokens.length) return [];
  if (!solutionId) return tokens;
  const urls = liveUrlsForSolution(solutionId);
  return tokens.filter((t) => (t === "{{blog_url}}" ? !urls.blog : !urls.page));
}

export function resolveTokens(bodyMd: string, solutionId: string | null): string {
  if (!solutionId) return bodyMd;
  const urls = liveUrlsForSolution(solutionId);
  return bodyMd.replace(/\{\{blog_url\}\}/g, urls.blog ?? "{{blog_url}}").replace(/\{\{page_url\}\}/g, urls.page ?? "{{page_url}}");
}

/** Per-platform export formatting. Input is the asset body; output is what lands on the clipboard. */
export function formatForPlatform(platform: string, bodyMd: string, solutionId: string | null): string {
  const resolved = resolveTokens(bodyMd, solutionId);
  switch (platform) {
    case "linkedin": {
      // strip markdown headers/emphasis; keep line breaks that survive paste
      return resolved
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .trim();
    }
    case "x": {
      return resolved.replace(/^#{1,6}\s+/gm, "").trim();
    }
    case "hn": {
      // the blog's Platform notes section carries the HN title + first comment; export as-is
      return resolved;
    }
    default:
      return resolved; // markdown platforms (blog, medium, substack, site)
  }
}
