export function Section({
  id,
  number,
  title,
  intro,
  children,
}: {
  id: string;
  number: string;
  title: string;
  /** One-line orientation shown under the heading (GLW-4.1). */
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-16 sm:py-24">
      <div className={`flex items-baseline gap-4 ${intro ? "mb-2" : "mb-10"}`}>
        <span aria-hidden className="font-mono text-sm text-muted">
          {number}
        </span>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      </div>
      {intro && (
        <p className="mb-10 font-mono text-[11px] uppercase tracking-wider text-muted">{intro}</p>
      )}
      {children}
    </section>
  );
}
