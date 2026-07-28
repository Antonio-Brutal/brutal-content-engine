import { AssetLibrary } from "@/components/asset-library";

export const dynamic = "force-dynamic";

export default function BlogLibrary() {
  return (
    <AssetLibrary
      type="blog"
      title="Blog posts"
      sub="Every blog post the engine has produced, across all solutions and the studio. These ship to brutal.ai's blog, Medium, Substack, and Hacker News."
    />
  );
}
