import { ScanRedesignPreview } from '@/components/scan-redesign/ScanRedesignPreview';

export const metadata = {
  title: 'Capture Gate Preview — FORGEWITH.AI',
  robots: { index: false, follow: false },
};

export default function CaptureRedesignPreview() {
  return <ScanRedesignPreview view="capture" />;
}
