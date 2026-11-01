const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const Check = () => (
  <svg {...base}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const Lock = () => (
  <svg {...base} strokeWidth={2.4}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const ArrowUp = () => (
  <svg {...base}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const PanelLeft = () => (
  <svg {...base} strokeWidth={1.8}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9.5 4.5v15" />
  </svg>
);

export const PanelRight = () => (
  <svg {...base} strokeWidth={1.8}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M14.5 4.5v15" />
  </svg>
);

export const ChevronRight = () => (
  <svg {...base} strokeWidth={2.4}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
);

export const ChevronLeft = () => (
  <svg {...base} strokeWidth={2.4}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
);

export const ChevronDown = () => (
  <svg {...base} strokeWidth={2.2}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const ArrowLeft = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ArrowRight = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Road = () => (
  <svg {...base} strokeWidth={2}>
    <circle cx="7" cy="5.5" r="2" />
    <circle cx="17" cy="18.5" r="2" />
    <path d="M9 5.5h6a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h6" />
  </svg>
);

export const Close = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const Plus = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const Minus = () => (
  <svg {...base} strokeWidth={2}>
    <path d="M5.5 12h13" />
  </svg>
);

export const Pointer = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M6 3.5l12 7.2-5.3 1.4 3.1 5.6-2.5 1.4-3.1-5.6L6 17.6z" />
  </svg>
);

export const Hand = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-.6a6 6 0 0 1-5-2.7L3.6 13a1.5 1.5 0 0 1 2.5-1.6L8 13.5" />
  </svg>
);

export const Sticky = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M5 4.5h14v9.5l-5 5.5H5z" />
    <path d="M19 14h-5v5.5" />
  </svg>
);

export const Speech = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z" />
  </svg>
);

export const Page = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M6.5 3.5h7l4 4v13h-11z" />
    <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
  </svg>
);

export const Stop = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);
