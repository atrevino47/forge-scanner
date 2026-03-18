export function FooterSection() {
  return (
    <footer className="border-t border-forge-border px-6 py-12">
      <div className="mx-auto max-w-[960px] text-center">
        <p className="font-display text-xl tracking-display text-forge-text">
          FORGE<span className="text-forge-accent">.</span>
        </p>
        <p className="mt-3 font-body text-sm text-forge-text-muted">
          [COPY: footer tagline]
        </p>
        <p className="mt-8 font-body text-xs text-forge-text-muted/60">
          [COPY: copyright notice]
        </p>
      </div>
    </footer>
  );
}
