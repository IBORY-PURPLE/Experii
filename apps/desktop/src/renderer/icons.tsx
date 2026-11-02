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

export const Minus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
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

export const Search = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Icon>
);

export const PanelLeft = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9.5 4.5v15" />
  </Icon>
);

export const PanelRight = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M14.5 4.5v15" />
  </Icon>
);

export const ChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </Icon>
);

export const ChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 6l-6 6 6 6" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);

export const ArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const Road = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="5.5" r="2" />
    <circle cx="17" cy="18.5" r="2" />
    <path d="M9 5.5h6a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h6" />
  </Icon>
);

export const Pointer = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5l12 7.2-5.3 1.4 3.1 5.6-2.5 1.4-3.1-5.6L6 17.6z" />
  </Icon>
);

export const Hand = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-.6a6 6 0 0 1-5-2.7L3.6 13a1.5 1.5 0 0 1 2.5-1.6L8 13.5" />
  </Icon>
);

export const Sticky = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4.5h14v9.5l-5 5.5H5z" />
    <path d="M19 14h-5v5.5" />
  </Icon>
);

export const Speech = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" />
  </Icon>
);

export const Page = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 3.5h7l4 4v13h-11z" />
    <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
  </Icon>
);
