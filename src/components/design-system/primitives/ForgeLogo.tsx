interface ForgeLogoProps {
  dark?: boolean;
  size?: number;
}

export function ForgeLogo({ dark = false, size = 18 }: ForgeLogoProps) {
  return (
    <span
      className={'forge-logo' + (dark ? ' forge-logo-dark' : '')}
      style={{ fontSize: size }}
    >
      FORGE<span className="forge-logo-accent">WITH.AI</span>
    </span>
  );
}
