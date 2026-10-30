import type { ReactNode } from 'react';

type IconProps = { size?: number; className?: string };

// One stroke family on a 24 grid: 1.5px at 16px, 2px at 20px, growing 1px per 8px between 1.5px and 2.5px.
const strokeFor = (size: number) =>
  (Math.min(2.5, Math.max(1.5, 1.5 + (size - 16) / 8)) * 24) / size;

function Icon({
  size = 16,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeFor(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 12.5l4.25 4.25L18.5 8" />
  </Icon>
);

export const Lock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icon>
);

export const ArrowUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />
  </Icon>
);

export const Stop = (p: IconProps) => (
  <Icon {...p}>
    <rect
      x="7"
      y="7"
      width="10"
      height="10"
      rx="2"
      fill="currentColor"
      stroke="none"
    />
  </Icon>
);

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const Dots = (p: IconProps) => (
  <Icon {...p}>
    <g fill="currentColor" stroke="none">
      <circle cx="7" cy="12" r="1.875" />
      <circle cx="12" cy="12" r="1.875" />
      <circle cx="17" cy="12" r="1.875" />
    </g>
  </Icon>
);

export const Shield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l7 2.75v5.25c0 4.25-2.9 7.6-7 9-4.1-1.4-7-4.75-7-9V6.25z" />
    <path d="M9 12h6" />
  </Icon>
);
