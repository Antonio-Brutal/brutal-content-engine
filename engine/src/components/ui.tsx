import { ReactNode } from "react";

// Shared primitives. Builders: use these, don't restyle from scratch.

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="label mb-3">{children}</p>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-medium tracking-[-0.02em]">{children}</h1>
      {sub ? <p className="mt-2 max-w-2xl text-sm text-(--muted)">{sub}</p> : null}
    </div>
  );
}

export type PillStatus =
  | "draft"
  | "approved"
  | "stale"
  | "blocked"
  | "failed"
  | "generating"
  | "published";

export function StatusPill({ status }: { status: PillStatus }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-start gap-2 border-dashed p-8">
      <p className="text-base font-medium">{title}</p>
      {children ? <div className="text-sm text-(--muted)">{children}</div> : null}
    </div>
  );
}
