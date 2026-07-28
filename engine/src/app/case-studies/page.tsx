import { AssetLibrary } from "@/components/asset-library";

export const dynamic = "force-dynamic";

export default function CaseStudyLibrary() {
  return (
    <AssetLibrary
      type="case_study"
      title="Case studies"
      sub="Every case study, built strictly from recorded client facts. These ship to brutal.ai once the client has approved every stated fact."
    />
  );
}
