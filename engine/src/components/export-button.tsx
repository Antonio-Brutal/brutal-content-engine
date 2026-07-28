// One-click campaign zip for a solution. Server component, safe to mount
// anywhere (board header, calendar rows): it is just a styled download link
// to /api/export/[solutionId].

export function ExportButton({ solutionId, className = "btn" }: { solutionId: string; className?: string }) {
  return (
    <a className={className} href={`/api/export/${solutionId}`} download>
      Export campaign
    </a>
  );
}
