import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../lib/app";

type Variant = "primary" | "secondary" | "ghost" | "psn";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-linear-135 from-accent via-accent-2 to-pink text-on-accent shadow-glow-sm hover:shadow-glow",
  secondary: "bg-surface-2 text-fg border border-line-strong hover:border-accent-2",
  ghost: "text-fg-2 hover:text-fg hover:bg-surface-2",
  psn: "bg-psn text-on-accent hover:brightness-110",
};
const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
};

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  to?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", to, className = "", children, ...rest }: BtnProps) {
  const cls = `inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none ${VARIANT[variant]} ${SIZE[size]} ${className}`;
  if (to)
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/** White/black platform chip, PS Store style. */
export function PlatformBadge({ p, solid = false }: { p: string; solid?: boolean }) {
  return (
    <span
      dir="ltr"
      className={`inline-flex h-5 items-center rounded px-1.5 font-latin text-[10px] font-bold tracking-wide ${
        solid ? "bg-white text-black" : "bg-black/70 text-white ring-1 ring-white/20"
      }`}
    >
      {p}
    </span>
  );
}

export function MetaScore({ v }: { v: number }) {
  const tone = v >= 90 ? "text-success bg-success-soft" : v >= 75 ? "text-warning bg-warning-soft" : "text-danger bg-danger-soft";
  return (
    <span className={`inline-flex h-5 min-w-7 items-center justify-center rounded px-1 font-latin text-[11px] font-bold ${tone}`}>
      {v}
    </span>
  );
}

/** Section title with the purple vertical rule from the PRD. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-lg font-bold tracking-tight">
        <span className="h-5 w-1 rounded-full bg-accent-2" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-card border border-line bg-surface shadow-card ${className}`}>{children}</div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "accent" | "psn"; children: ReactNode }) {
  const map = {
    neutral: "bg-surface-2 text-fg-2",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent-2",
    psn: "bg-psn-soft text-psn",
  } as const;
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

/** Faint PlayStation-shape pattern behind inner pages (opacity 0.03 per PRD). */
export function ShapePattern({ className = "" }: { className?: string }) {
  return (
    // ds-ok: PRD specifies 0.03 pattern opacity
    <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full text-fg opacity-[0.035] ${className}`}>
      <defs>
        <pattern id="ps-shapes" width="180" height="180" patternUnits="userSpaceOnUse">
          <path d="M30 18 L42 40 L18 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="120" cy="32" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M22 112 L44 134 M44 112 L22 134" stroke="currentColor" strokeWidth="2" />
          <rect x="110" y="110" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="80" cy="80" r="1.5" fill="currentColor" />
          <circle cx="160" cy="150" r="1" fill="currentColor" />
          <circle cx="66" cy="160" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ps-shapes)" />
    </svg>
  );
}

export function useGb() {
  const { n, t } = useApp();
  return (gb: number) => (gb >= 1000 ? `${n((gb / 1000).toFixed(gb % 1000 === 0 ? 0 : 1))} ${t("ترابایت", "TB")}` : `${n(gb)} GB`);
}
