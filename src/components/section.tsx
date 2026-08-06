import { District, type DistrictName } from "./society/districts";
import { TownGlyph, type GlyphName } from "./society/glyphs";

export function Section({
  id,
  number,
  title,
  intro,
  glyph,
  district,
  children,
}: {
  id: string;
  number: string;
  title: string;
  /** One-line orientation shown under the heading (GLW-4.1). */
  intro?: string;
  /** Town building this district is marked by (SOC-8). Decorative. */
  glyph?: GlyphName;
  /** Working district animating at the foot of this section (E21). */
  district?: DistrictName;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-16 sm:py-24">
      <div className={`flex items-baseline gap-3 ${intro ? "mb-2" : "mb-10"}`}>
        {glyph && <TownGlyph name={glyph} />}
        <span aria-hidden className="font-mono text-sm text-muted">
          {number}
        </span>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      </div>
      {intro && (
        <p className="mb-10 font-mono text-[11px] uppercase tracking-wider text-muted">{intro}</p>
      )}
      {children}
      {district && <District name={district} />}
    </section>
  );
}
