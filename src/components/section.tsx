import { Lamp } from "./street";

/**
 * A shop on Zahid Imran Street (E24, STR-2).
 *
 * The header is a fascia signboard — number and trade name on the board,
 * corbels at each end, a wall lamp hanging off the right. Hovering the board
 * previews the light; the lamp button keeps it lit. The section content below
 * is the shop's window display.
 */
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
  /** One-line orientation shown under the signboard (GLW-4.1). */
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="shop scroll-mt-20 border-t border-border py-16 sm:py-24">
      <header className="shop-fascia">
        <span aria-hidden className="shop-no font-mono text-sm text-muted">
          No. {number}
        </span>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <Lamp />
      </header>
      {intro && (
        <p className="mb-10 mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
          {intro}
        </p>
      )}
      {!intro && <div className="mb-10" />}
      {children}
    </section>
  );
}
