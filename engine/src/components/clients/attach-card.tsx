import { getClient, listClients } from "@/db/repo";
import { AttachClientCardInner } from "./attach-card-inner";

/**
 * Client record card for the solution board. Server-component wrapper: reads
 * the attached client (or the attachable list) from the repo and hands plain
 * data to the interactive inner component. Self-contained, its mutations live
 * in src/components/clients/actions.ts.
 */
export function AttachClientCard({ solutionId, clientId }: { solutionId: string; clientId: string | null }) {
  const client = clientId ? getClient(clientId) : undefined;
  const options = client
    ? []
    : listClients().map((c) => ({ id: c.id, name: c.name }));

  return (
    <AttachClientCardInner
      solutionId={solutionId}
      client={client ? { id: client.id, name: client.name, permission: client.permission } : null}
      options={options}
    />
  );
}
