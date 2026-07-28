// Permission → pill styling shared by the clients surface and the attach card.
// none = blocked (amber), verbal = draft (blue), written = approved (lime).

export type ClientPermission = "none" | "verbal" | "written";

const PILL_CLASS: Record<ClientPermission, string> = {
  none: "pill-blocked",
  verbal: "pill-draft",
  written: "pill-approved",
};

export function PermissionPill({ permission }: { permission: ClientPermission }) {
  return <span className={`pill ${PILL_CLASS[permission]}`}>{permission}</span>;
}
