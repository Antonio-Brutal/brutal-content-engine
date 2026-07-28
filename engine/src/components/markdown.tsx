import { marked } from "marked";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// marked passes raw HTML through by default; escape it so pasted or generated
// markup (e.g. <script>, <img onerror=...>) renders as text instead of executing.
// The parser routes both block and inline html tokens through this renderer.
marked.use({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

export function Markdown({ md, className = "" }: { md: string; className?: string }) {
  const html = marked.parse(md, { async: false, breaks: false });
  return <div className={`prose-brutal ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
