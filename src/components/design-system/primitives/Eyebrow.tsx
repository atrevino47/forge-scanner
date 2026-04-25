import type { CSSProperties, ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  accent?: boolean;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Eyebrow({ children, accent, muted, className, style }: EyebrowProps) {
  const classes = [
    'eyebrow',
    accent ? 'eyebrow-accent' : '',
    muted ? 'eyebrow-muted' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
