/**
 * The citizens of the portfolio's little society.
 *
 * Each one is a role with its own behaviour, a job label the visitor can
 * inspect, and a different thing it does at night. Positions are percentages
 * across the scene so the whole thing is fluid.
 *
 * Design constraints inherited from the site: monochrome only, transform-only
 * animation (stays on the compositor), and everything disappears under
 * prefers-reduced-motion.
 */

export type Behaviour =
  | "walk"
  | "cycle"
  | "engineer"
  | "build"
  | "rest"
  | "fly"
  | "inspect"
  | "dog";

export type Lane = "far" | "mid" | "near";

export type Citizen = {
  id: string;
  /** Shown when the visitor clicks the figure. */
  role: string;
  dayTask: string;
  nightTask: string;
  behaviour: Behaviour;
  lane: Lane;
  /** Starting position, % across the scene. */
  x: number;
  /** Seconds for one full cycle — varied so nobody marches in lockstep. */
  duration: number;
  /** Negative delay so the scene looks mid-life on arrival, not synchronised. */
  offset: number;
  /** Some citizens clock off after dark. */
  nocturnal?: boolean;
  dayOnly?: boolean;
};

export const citizens: Citizen[] = [
  {
    id: "commuter-a",
    role: "Commuter",
    dayTask: "Walking to the office",
    nightTask: "Heading home",
    behaviour: "walk",
    lane: "near",
    x: 4,
    duration: 38,
    offset: -3,
  },
  {
    id: "commuter-b",
    role: "Commuter",
    dayTask: "Late for a stand-up",
    nightTask: "Last one out of the building",
    behaviour: "walk",
    lane: "mid",
    x: 62,
    duration: 46,
    offset: -21,
  },
  {
    id: "courier",
    role: "Courier",
    dayTask: "Delivering something urgent",
    nightTask: "Night shift, still riding",
    behaviour: "cycle",
    lane: "near",
    x: 20,
    duration: 22,
    offset: -9,
  },
  {
    id: "engineer",
    role: "Engineer",
    dayTask: "Debugging a pipeline at the workbench",
    nightTask: "Still debugging. It's always the pipeline.",
    behaviour: "engineer",
    lane: "mid",
    x: 14,
    duration: 2.2,
    offset: 0,
  },
  {
    id: "builder",
    role: "Builder",
    dayTask: "Raising a new floor on the office",
    nightTask: "Tools down, site quiet",
    behaviour: "build",
    lane: "far",
    x: 74,
    duration: 1.8,
    offset: -0.6,
    dayOnly: true,
  },
  {
    id: "inspector",
    role: "Data inspector",
    dayTask: "Reading the charts further down the page",
    nightTask: "Checking the overnight run",
    behaviour: "inspect",
    lane: "mid",
    x: 44,
    duration: 3.4,
    offset: -1.1,
  },
  {
    id: "rester",
    role: "Resting",
    dayTask: "On the bench with a coffee",
    nightTask: "Asleep on the bench",
    behaviour: "rest",
    lane: "near",
    x: 84,
    duration: 4.5,
    offset: -2,
  },
  {
    id: "pilot",
    role: "Pilot",
    dayTask: "Towing a banner across the skyline",
    nightTask: "Navigation lights only",
    behaviour: "fly",
    lane: "far",
    x: 0,
    duration: 30,
    offset: -12,
  },
  {
    id: "dog",
    role: "Dog",
    dayTask: "Following the commuter. Very pleased about it.",
    nightTask: "Still following. Still pleased.",
    behaviour: "dog",
    lane: "near",
    x: 0,
    duration: 38,
    offset: -1.6,
  },
];

/** Lit windows are placed deterministically so server and client markup agree. */
export const OFFICE_WINDOWS = 18;
