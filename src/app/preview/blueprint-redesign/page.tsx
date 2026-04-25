import {
  BlueprintDesktop,
  BlueprintMobile,
} from '@/components/blueprint-redesign';

export const metadata = { robots: { index: false, follow: false } };

export default function BlueprintRedesignPreview() {
  return (
    <div>
      <div className="hidden md:block">
        <BlueprintDesktop />
      </div>
      <div className="block md:hidden">
        <BlueprintMobile />
      </div>
    </div>
  );
}
