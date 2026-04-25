import type { CSSProperties } from 'react';

interface PhImgProps {
  label?: string;
  aspect?: string;
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function PhImg({
  label = 'Screenshot',
  aspect = '16/10',
  height,
  width = '100%',
  className,
  style,
}: PhImgProps) {
  return (
    <div
      className={'ph-img' + (className ? ' ' + className : '')}
      style={{
        width,
        aspectRatio: height ? undefined : aspect,
        height,
        borderRadius: 8,
        ...style,
      }}
    >
      <div className="ph-label">{label}</div>
    </div>
  );
}
