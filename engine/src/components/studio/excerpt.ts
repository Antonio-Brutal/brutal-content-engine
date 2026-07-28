// Tiny plain-text excerpt for asset lists and pickers. Strips the loudest
// markdown noise; not a renderer.
export function excerpt(md: string, max = 90): string {
  const text = md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/media:\/\/[a-zA-Z0-9_-]+/g, "")
    .replace(/[*_`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "(no body yet)";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
