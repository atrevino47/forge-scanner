import { ScanLayout } from '@/components/scan/ScanLayout';

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ScanLayout scanId={id} />;
}
