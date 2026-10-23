import React from "react";

export type PSGlyphType =
  | "cross"
  | "circle"
  | "square"
  | "triangle"
  | "dpad"
  | "l1"
  | "r1"
  | "l2"
  | "r2"
  | "options";

interface PlayStationGlyphProps {
  type: PSGlyphType;
  className?: string;
  size?: number;
}

export const PlayStationGlyph: React.FC<PlayStationGlyphProps> = ({
  type,
  className = "w-4 h-4 inline-block align-middle",
  size = 20,
}) => {
  switch (type) {
    case "cross": // ✕ آبی نئونی
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-[#3b82f6]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Cross"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );

    case "circle": // ○ قرمز نئونی
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-[#ef4444]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Circle"
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
      );

    case "square": // □ صورتی/بنفش نئونی
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-[#ec4899]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Square"
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );

    case "triangle": // △ سبز نئونی
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-[#22c55e]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Triangle"
        >
          <polygon points="12 4 21 20 3 20" />
        </svg>
      );

    case "dpad":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-slate-300`}
          fill="currentColor"
          aria-label="D-Pad"
        >
          <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4l2 3h-4l2-3zm0 16l-2-3h4l-2 3zm-8-8l3-2v4l-3-2zm16 0l-3 2v-4l3 2z" />
        </svg>
      );

    case "l1":
    case "r1":
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold uppercase rounded border border-white/20 bg-white/10 px-1 py-0.2 text-[10px] text-slate-200 ${className}`}
          style={{ minWidth: `${size}px`, height: `${size}px` }}
        >
          {type.toUpperCase()}
        </span>
      );

    case "l2":
    case "r2":
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold uppercase rounded-sm border border-orange-500/40 bg-orange-500/10 px-1 py-0.2 text-[10px] text-orange-300 ${className}`}
          style={{ minWidth: `${size}px`, height: `${size}px` }}
        >
          {type.toUpperCase()}
        </span>
      );

    case "options":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`${className} text-slate-300`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-label="Options"
        >
          <line x1="5" y1="7" x2="19" y2="7" />
          <line x1="5" y1="12" x2="19" y2="12" />
          <line x1="5" y1="17" x2="19" y2="17" />
        </svg>
      );

    default:
      return null;
  }
};

export default PlayStationGlyph;
