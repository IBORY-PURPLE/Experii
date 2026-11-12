export type View = { x: number; y: number; z: number };
export const DEFAULT_VIEW: View = { x: 0, y: 0, z: 1 };

export type Point = { x: number; y: number };

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const NOTE_W = 264;
// At 100% the first column starts right of the pinned card (328px wide from 16px in), and every column starts below
// the row of the next study button.
export const COLUMN_LEFT = 376;
export const COLUMN_TOP = 64;
const COLUMN_W = NOTE_W + 24;

export const toWorld = (v: View, screen: Point): Point => ({
  x: (screen.x - v.x) / v.z,
  y: (screen.y - v.y) / v.z,
});

// Zooming keeps the point under the pointer where it is.
export function zoomAt(v: View, at: Point, factor: number): View {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.z * factor));
  const k = z / v.z;
  return { x: at.x - (at.x - v.x) * k, y: at.y - (at.y - v.y) * k, z };
}

// Words kept without a spot of their own line up by question, Q1's column first, each under the last note there.
export function columnSpot(
  q: number,
  notes: Array<Point & { h: number }>,
): Point {
  const x = COLUMN_LEFT + (Math.max(1, q) - 1) * COLUMN_W;
  const below = notes
    .filter((n) => Math.abs(n.x - x) < COLUMN_W / 2)
    .map((n) => Math.round(n.y + n.h + 16));
  return { x, y: Math.max(COLUMN_TOP, ...below) };
}
