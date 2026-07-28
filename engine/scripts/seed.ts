/* Seeds the Brand Vault with the editorial style pack + hallmark post.
   Run: npx tsx scripts/seed.ts (or: npm run seed) — idempotent by title. */
import fs from "node:fs";
import path from "node:path";
import { createVaultEntry, listVault } from "../src/db/repo";

const BRAND_DIR = path.resolve(process.cwd(), "..", "brand");

function seedOnce(kind: "doc", title: string, contentMd: string) {
  const existing = listVault().find((e) => e.title === title);
  if (existing) {
    console.log(`✓ already seeded: ${title}`);
    return;
  }
  createVaultEntry({ kind, title, contentMd });
  console.log(`+ seeded: ${title}`);
}

const stylePack = fs.readFileSync(path.join(BRAND_DIR, "editorial-style-pack.md"), "utf8");
seedOnce("doc", "Editorial Style Pack", stylePack);

const hallmarkHtml = fs.readFileSync(path.join(BRAND_DIR, "hallmark-blog-modern-data-stack.html"), "utf8");
const hallmarkBody = hallmarkHtml
  .replace(/^[\s\S]*<body>/, "")
  .replace(/<\/body>[\s\S]*$/, "")
  .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_m, code) => "\n```\n" + code + "\n```\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
seedOnce(
  "doc",
  "Hallmark post — Making Explicit What Was Previously Implicit (Dani)",
  `The hallmark blog post: the register every generated piece is measured against.\n\n${hallmarkBody}`
);

console.log("Brand Vault seeded.");
