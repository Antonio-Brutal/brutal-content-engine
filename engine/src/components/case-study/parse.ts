// Parses case-study markdown into renderable blocks. The engine emits the
// directive vocabulary (see CASE_STUDY_VOCAB); everything else stays markdown.

export type CsBlock =
  | { type: "markdown"; md: string }
  | { type: "logo" }
  | { type: "image"; slot: string; kind: string; brief: string; mediaId: string | null }
  | { type: "stats"; cards: { value: string; label: string; source: string }[] }
  | { type: "quote"; text: string; attribution: string }
  | { type: "sidebar"; fields: { field: string; value: string }[] }
  | { type: "about-client"; md: string }
  | { type: "about-brutal"; md: string };

// Match only the [[image ...]] shell, then pull the attributes out pair by
// pair: order-independent, and a stray double quote inside a value degrades
// that one value instead of failing the whole directive.
const IMAGE_SHELL_RE = /^\[\[image\s+(.+?)\s*\]\]$/;

function parseImageAttrs(trimmed: string): Record<string, string> | null {
  const shell = trimmed.match(IMAGE_SHELL_RE);
  if (!shell) return null;
  const attrs: Record<string, string> = {};
  for (const m of shell[1].matchAll(/(\w+)="([^"]*)"/g)) {
    attrs[m[1]] = m[2];
  }
  if (!attrs.slot) return null;
  return attrs;
}

export function parseCaseStudy(bodyMd: string): CsBlock[] {
  const blocks: CsBlock[] = [];
  let md: string[] = [];
  const flush = () => {
    const text = md.join("\n").trim();
    if (text) blocks.push({ type: "markdown", md: text });
    md = [];
  };

  const lines = bodyMd.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "[[logo]]") {
      flush();
      blocks.push({ type: "logo" });
      i++;
      continue;
    }

    const img = parseImageAttrs(trimmed);
    if (img) {
      flush();
      blocks.push({ type: "image", slot: img.slot, kind: img.kind || "photo", brief: img.brief || "", mediaId: img.media || null });
      i++;
      continue;
    }

    if (trimmed.startsWith(":::")) {
      const kind = trimmed.slice(3).trim();
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        inner.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      flush();
      const body = inner.join("\n").trim();
      if (kind === "stats") {
        const cards = inner
          .map((l) => l.split("|").map((p) => p.trim()))
          .filter((p) => p.length >= 2 && p[0])
          .map((p) => ({ value: p[0], label: p[1] ?? "", source: p[2] ?? "" }));
        if (cards.length) blocks.push({ type: "stats", cards });
      } else if (kind === "quote") {
        const parts = inner.map((l) => l.trim()).filter(Boolean);
        if (parts.length) blocks.push({ type: "quote", text: parts[0].replace(/^"|"$/g, ""), attribution: parts.slice(1).join(", ") });
      } else if (kind === "sidebar") {
        const fields = inner
          .map((l) => l.split(/:(.+)/).map((p) => p.trim()))
          .filter((p) => p.length >= 2 && p[0] && p[1])
          .map((p) => ({ field: p[0], value: p[1] }));
        if (fields.length) blocks.push({ type: "sidebar", fields });
      } else if (kind === "about-client") {
        blocks.push({ type: "about-client", md: body });
      } else if (kind === "about-brutal") {
        blocks.push({ type: "about-brutal", md: body });
      } else if (body) {
        blocks.push({ type: "markdown", md: body });
      }
      continue;
    }

    md.push(line);
    i++;
  }
  flush();
  return blocks;
}

/** Rewrites an image directive to carry a media id (used after a slot is filled). */
export function fillSlotInMarkdown(bodyMd: string, slot: string, mediaId: string): string {
  return bodyMd
    .split("\n")
    .map((line) => {
      const attrs = parseImageAttrs(line.trim());
      if (attrs && attrs.slot === slot) {
        const kind = attrs.kind || "photo";
        const brief = (attrs.brief || "").replace(/"/g, "'");
        return `[[image slot="${slot}" kind="${kind}" brief="${brief}" media="${mediaId}"]]`;
      }
      return line;
    })
    .join("\n");
}
