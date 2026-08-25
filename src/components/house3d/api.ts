import type { House3DHandle } from "./engine";

/**
 * Tiny registry so the guided tour (a sibling component) can drive the 3D
 * house's camera without prop-drilling through the page. Null whenever the
 * engine isn't mounted — callers must handle that.
 */
let current: House3DHandle | null = null;

export function setHouseApi(handle: House3DHandle | null): void {
  current = handle;
}

export function getHouseApi(): House3DHandle | null {
  return current;
}
