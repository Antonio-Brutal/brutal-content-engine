import { Markdown } from "@/components/markdown";
import { Asset, getClient, getSolution } from "@/db/repo";
import { parseCaseStudy } from "./parse";
import { ImageSlot, LogoSlot } from "./slot";

// Renders a case-study asset as a designed page: logo, hero and inline image
// slots (filled or uploadable), stat card grid, styled quotes, About boxes, and
// a facts sidebar. Server component; the slots are client islands.
export function CaseStudyView({ asset }: { asset: Asset }) {
  const solution = asset.solutionId ? getSolution(asset.solutionId) : undefined;
  const client = solution?.clientId ? getClient(solution.clientId) : undefined;
  const blocks = parseCaseStudy(asset.bodyMd);
  const sidebar = blocks.find((b) => b.type === "sidebar");
  const main = blocks.filter((b) => b !== sidebar);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        {main.map((b, i) => {
          switch (b.type) {
            case "logo":
              return <LogoSlot key={i} assetId={asset.id} logoMediaId={client?.logoMediaId ?? null} clientName={client?.name ?? null} />;
            case "image":
              return b.mediaId ? (
                <figure key={i} className="my-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${b.mediaId}`} alt={b.brief} className="w-full rounded-xl border hairline" />
                  {b.brief ? <figcaption className="label mt-2">{b.brief}</figcaption> : null}
                </figure>
              ) : (
                <ImageSlot key={i} assetId={asset.id} slot={b.slot} kind={b.kind} brief={b.brief} />
              );
            case "stats":
              return (
                <div key={i} className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {b.cards.map((c, j) => (
                    <div key={j} className="card p-4">
                      <p className="text-2xl font-medium tracking-[-0.02em] text-(--lime) tabular-nums">{c.value}</p>
                      <p className="mt-1 text-[13px] leading-snug text-(--text)">{c.label}</p>
                      {c.source ? <p className="label mt-2">{c.source}</p> : null}
                    </div>
                  ))}
                </div>
              );
            case "quote":
              return (
                <blockquote key={i} className="my-8 border-l-2 border-(--lime) pl-6">
                  <p className="text-xl leading-relaxed text-(--text)">&ldquo;{b.text}&rdquo;</p>
                  {b.attribution ? <footer className="label mt-3">{b.attribution}</footer> : null}
                </blockquote>
              );
            case "about-client":
              return (
                <div key={i} className="card mt-10 p-5">
                  <p className="label mb-2">About {client?.name ?? "the client"}</p>
                  <Markdown md={b.md} />
                </div>
              );
            case "about-brutal":
              return (
                <div key={i} className="card mt-4 p-5">
                  <p className="label mb-2">About Brutal</p>
                  <Markdown md={b.md} />
                </div>
              );
            default:
              return b.type === "markdown" ? <Markdown key={i} md={b.md} /> : null;
          }
        })}
      </div>
      {sidebar && sidebar.type === "sidebar" ? (
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="label mb-3">Engagement facts</p>
            <dl className="grid gap-3">
              {sidebar.fields.map((f, i) => (
                <div key={i}>
                  <dt className="label">{f.field}</dt>
                  <dd className="mt-0.5 text-sm">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
