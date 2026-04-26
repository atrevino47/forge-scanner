type DotStatus = 'present' | 'weak' | 'missing' | 'off';

interface StatusDotProps {
  status?: DotStatus;
}

export function StatusDot({ status = 'present' }: StatusDotProps) {
  return <span className={`dot dot-${status}`} />;
}
