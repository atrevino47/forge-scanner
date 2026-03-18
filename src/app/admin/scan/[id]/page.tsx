export default async function AdminScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="px-6 pt-24 pb-16">
      <div className="mx-auto max-w-[1120px]">
        <h1
          className="font-display tracking-display leading-display mb-4"
          style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)' }}
        >
          [COPY: Team Scan View]
        </h1>
        <p className="font-body text-forge-text-muted">
          Scan ID: {id}
        </p>
        <p className="font-body mt-2 text-sm text-forge-text-muted/60">
          [COPY: Team scan view placeholder — Phase 3]
        </p>
      </div>
    </div>
  );
}
