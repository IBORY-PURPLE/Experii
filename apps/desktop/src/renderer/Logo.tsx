// The drawings of assets/brand/mark*.svg. ink is the box their strokes fill (x, y, width, height); the sign-in
// lockup is measured from it.
const MASTER = {
  box: 48,
  stroke: 4,
  d: 'M26 8H10V40H38M10 24H32',
  ink: [8, 6, 32, 36],
};
const D16 = {
  box: 16,
  stroke: 2,
  d: 'M9 3H4V13H13M4 8H11',
  ink: [3, 2, 11, 12],
};
const D20 = {
  box: 20,
  stroke: 2,
  d: 'M11 4H4V16H16M4 10H13',
  ink: [3, 3, 14, 14],
};
const D24 = {
  box: 24,
  stroke: 2,
  d: 'M13 4H5V20H19M5 12H16',
  ink: [4, 3, 16, 18],
};

// Small sizes use pixel-fitted drawings; 40 draws the 20 one at exactly 2x so its strokes stay on whole pixels.
function drawingFor(size: number) {
  if (size <= 16) return D16;
  if (size <= 20) return D20;
  if (size <= 24) return D24;
  if (size === 40) return D20;
  return MASTER;
}

// With ink the svg is cropped to the strokes at the same scale, so a 40px mark measures 28px.
export function LogoMark({
  size = 24,
  ink = false,
  className,
}: {
  size?: number;
  ink?: boolean;
  className?: string;
}) {
  const { box, stroke, d, ink: crop } = drawingFor(size);
  const [x, y, w, h] = ink ? crop : [0, 0, box, box];
  const scale = size / box;
  return (
    <svg
      className={className}
      width={w * scale}
      height={h * scale}
      viewBox={`${x} ${y} ${w} ${h}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

// Its size comes from the place it sits in: 16px in the sidebar head, --fs-logo on the sign-in card.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className ? `wordmark ${className}` : 'wordmark'}>
      Experii
    </span>
  );
}
