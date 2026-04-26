import { ScanRedesignPreview } from '@/components/scan-redesign/ScanRedesignPreview';

export const metadata = {
  title: 'Results Preview — FORGEWITH.AI',
  robots: { index: false, follow: false },
};

export default function ResultsRedesignPreview() {
  return <ScanRedesignPreview view="results" />;
}
