"use client";

import { useEffect, useRef, useState } from "react";
import { useNight } from "@/lib/use-night";

const DISTRICTS: { id: string; label: string }[] = [
  { id: "top", label: "The gate" },
  { id: "impact", label: "Records office" },
  { id: "projects", label: "Workshops" },
  { id: "experience", label: "The long road" },
  { id: "skills", label: "Toolshed" },
  { id: "certificates", label: "Library" },
  { id: "mcp", label: "Telegraph office" },
  { id: "contact", label: "Town hall" },
];

/**
 * A guide who walks the strip under the nav, showing where in the town the
 * reader currently is. Position maps to scroll progress; the walk cycle only
 * runs while actually moving, so a stationary reader sees a stationary guide.
 *
 * This is decoration layered on the existing progress hairline — if it is
 * hidden (mobile, reduced motion) the plain bar still communicates position.
 */
export function Guide() {
  const guideRef = useRef<HTMLDivElement>(null);
  const [district, setDistrict] = useState(DISTRICTS[0].label);
  // Same town clock as the citizens and the workshop (SOC-11).
  const night = useNight();

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide) return;

    let raf = 0;
    let lastX = 0;
    let stillTimer: ReturnType<typeof setTimeout>;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;

      // Keep the figure inside the strip at both ends.
      const x = progress * (guide.parentElement!.clientWidth - 22);
      const movingRight = x >= lastX;
      guide.style.transform = `translateX(${x}px) scaleX(${movingRight ? 1 : -1})`;

      if (Math.abs(x - lastX) > 0.4) {
        guide.dataset.moving = "true";
        clearTimeout(stillTimer);
        stillTimer = setTimeout(() => {
          guide.dataset.moving = "false";
        }, 160);
      }
      lastX = x;

      // Which district is under the reading line?
      let current = DISTRICTS[0].label;
      for (const d of DISTRICTS) {
        const el = document.getElementById(d.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = d.label;
        }
      }
      setDistrict(current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(stillTimer);
    };
  }, []);

  return (
    <div className="guide-strip no-print" aria-hidden="true" data-night={night ? "true" : "false"}>
      <div className="guide" ref={guideRef} data-moving="false">
        <svg viewBox="0 0 24 30" className="guide-svg" focusable="false">
          <circle cx="12" cy="5" r="3" fill="currentColor" />
          <line x1="12" y1="8" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <g className="guide-limb guide-arm-b">
            <line x1="12" y1="10" x2="12" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className="guide-limb guide-arm-f">
            <line x1="12" y1="10" x2="12" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className="guide-limb guide-leg-b">
            <line x1="12" y1="18" x2="12" y2="27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <g className="guide-limb guide-leg-f">
            <line x1="12" y1="18" x2="12" y2="27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* After dark the guide carries a lantern. */}
          {night && (
            <g className="guide-lantern">
              <line x1="12" y1="12" x2="18" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="18.6" cy="15.6" r="2.1" fill="currentColor" />
            </g>
          )}
        </svg>
      </div>
      <span className="guide-label font-mono">{district}</span>
    </div>
  );
}
