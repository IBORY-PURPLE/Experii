const MASTER = { box: 48, stroke: 4, d: 'M26 8H10V40H38M10 24H32' };
const D16 = { box: 16, stroke: 2, d: 'M9 3H4V13H13M4 8H11' };
const D20 = { box: 20, stroke: 2, d: 'M11 4H4V16H16M4 10H13' };
const D24 = { box: 24, stroke: 2, d: 'M13 4H5V20H19M5 12H16' };

// Small sizes use pixel-fitted drawings; 32 and 40 draw the 16 and 20 ones at exactly 2x so strokes stay on whole pixels.
function drawingFor(size: number) {
  if (size <= 16) return D16;
  if (size <= 20) return D20;
  if (size <= 24) return D24;
  if (size === 32) return D16;
  if (size === 40) return D20;
  return MASTER;
}

export function LogoMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const { box, stroke, d } = drawingFor(size);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
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

export function Wordmark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={className ? `wordmark ${className}` : 'wordmark'}
      style={{ fontSize: size }}
    >
      Experii
    </span>
  );
}
