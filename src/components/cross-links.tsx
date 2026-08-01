"use client";

import { useEffect } from "react";

/**
 * Page-level delegated cross-links, mounted once:
 * - DTL-2.3: clicking a tech badge on a flagship card jumps to and flashes
 *   the matching skill chip (badges carry data-skill with the chip id).
 * - DTL-4: hovering/tapping a diagram node highlights the card bullet it
 *   depicts (nodes carry data-bullet with the bullet index).
 */
export function CrossLinks() {
  useEffect(() => {
    const bulletFor = (node: Element): HTMLElement | null => {
      const index = Number(node.getAttribute("data-bullet"));
      const article = node.closest("article");
      const bullets = article?.querySelectorAll<HTMLElement>("ul li");
      return bullets && index < bullets.length ? bullets[index] : null;
    };

    const onClick = (event: MouseEvent) => {
      const badge = (event.target as Element).closest("[data-skill]");
      if (badge) {
        const chip = document.getElementById(badge.getAttribute("data-skill") ?? "");
        if (chip) {
          chip.scrollIntoView({ block: "center" });
          chip.classList.remove("chip-flash");
          // restart the animation if the same chip is flashed twice
          void chip.offsetWidth;
          chip.classList.add("chip-flash");
        }
        return;
      }
      const node = (event.target as Element).closest("[data-bullet]");
      if (node) {
        const bullet = bulletFor(node);
        bullet?.classList.toggle("bullet-lit");
      }
    };

    const onOver = (event: MouseEvent) => {
      const node = (event.target as Element).closest("[data-bullet]");
      if (node) bulletFor(node)?.classList.add("bullet-lit");
    };

    const onOut = (event: MouseEvent) => {
      const node = (event.target as Element).closest("[data-bullet]");
      if (node) bulletFor(node)?.classList.remove("bullet-lit");
    };

    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return null;
}
