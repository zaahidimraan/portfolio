"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toggleNight, useNight } from "@/lib/use-night";

export type Speed = 0.5 | 1 | 2;

type TownState = {
  playing: boolean;
  speed: Speed;
  night: boolean;
  setPlaying: (value: boolean) => void;
  setSpeed: (value: Speed) => void;
  flipClock: () => void;
};

const TownContext = createContext<TownState | null>(null);

const STORE_KEY = "town-prefs";

/**
 * One transport for the whole town.
 *
 * Every district on the page reads playing/speed/night from here, so a single
 * control governs all of them and none can drift out of step (TWN-4, D3).
 */
export function TownProvider({ children }: { children: React.ReactNode }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);
  const night = useNight() ?? false;

  // Restore the visitor's previous preference.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { playing?: boolean; speed?: Speed };
      if (typeof saved.playing === "boolean") setPlaying(saved.playing);
      if (saved.speed === 0.5 || saved.speed === 1 || saved.speed === 2) setSpeed(saved.speed);
    } catch {
      /* corrupt or unavailable storage — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ playing, speed }));
    } catch {
      /* private mode — preference simply won't persist */
    }
  }, [playing, speed]);

  const value = useMemo<TownState>(
    () => ({ playing, speed, night, setPlaying, setSpeed, flipClock: () => toggleNight() }),
    [playing, speed, night],
  );

  return <TownContext.Provider value={value}>{children}</TownContext.Provider>;
}

export function useTown(): TownState {
  const ctx = useContext(TownContext);
  if (!ctx) {
    throw new Error("useTown must be used inside <TownProvider>");
  }
  return ctx;
}

/**
 * True while the element is near the viewport.
 *
 * Districts off screen must not animate: a long page with a dozen animated
 * scenes would burn the main thread continuously. Waking ~250px early means
 * the scene is already in motion by the time it scrolls into view (D2).
 */
export function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  // Start awake, not asleep. The observer's job is to *pause* districts that
  // are demonstrably off screen — so if it never reports (unsupported, or a
  // context where callbacks don't run) the town animates rather than sitting
  // silently frozen. A slightly busier page is a far better failure than a
  // dead one nobody can debug from the outside.
  const [near, setNear] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: "250px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, near };
}

/** Shared props every district band needs. */
export function useDistrictChrome() {
  const { playing, speed, night } = useTown();
  const { ref, near } = useNearViewport<HTMLDivElement>();

  const chrome = useCallback(
    (scene: string) => ({
      ref,
      className: "district",
      "data-scene": scene,
      "data-night": night ? "true" : "false",
      // Paused when the visitor has stopped the town *or* when the district
      // is nowhere near the viewport.
      "data-active": playing && near ? "true" : "false",
      "aria-hidden": true as const,
      style: { ["--soc-speed" as string]: String(speed) },
    }),
    [ref, night, playing, near, speed],
  );

  return chrome;
}
