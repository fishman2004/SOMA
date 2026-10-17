import type { SVGProps } from "react";

/** Ícones de traço, decorativos por padrão (aria-hidden). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </Base>
);

export const BookIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17a3 3 0 0 1 3-3h11" />
  </Base>
);

export const BookmarkIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </Base>
);

export const ChartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 20v-7M12 20V5M19 20v-11" />
  </Base>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M5 12l5 5 9-10" />
  </Base>
);

export const RedoIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Base>
);

export const CardsIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="3" width="13" height="15" rx="2" />
    <path d="M4 7v12a2 2 0 0 0 2 2h10" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" />
  </Base>
);

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {/* Cores pelos tokens, para o logo se inverter no modo escuro. */}
      <rect width="32" height="32" rx="9" style={{ fill: "var(--color-ink)" }} />
      <path d="M16 9v14M9 16h14" style={{ stroke: "var(--color-ground)" }} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
