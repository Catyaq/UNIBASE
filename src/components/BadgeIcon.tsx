import type { BadgeKind, BadgeTier } from "@/config/badges";
import { badgeTierLabel } from "@/config/badges";

type BadgeIconProps = {
  kind: BadgeKind;
  className?: string;
};

export function BadgeIcon({ kind, className = "h-6 w-6" }: BadgeIconProps) {
  switch (kind) {
    case "gm":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case "deploy":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 3l8 5v8l-8 5-8-5V8l8-5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M12 12l8-4M12 12v9M12 12L4 8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "points":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17.8 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      );
    case "rank":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M7 4h10v5a5 5 0 01-10 0V4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 20h6M12 14v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M5 4H4a1 1 0 00-1 1v1h2V4zM20 4h1a1 1 0 011 1v1h-2V4z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

export function badgeTierClass(tier: BadgeTier): string {
  return `uni-badge-medallion-${tier}`;
}

export function badgeTierChipClass(tier: BadgeTier): string {
  return `uni-badge-tier-chip uni-badge-tier-${tier}`;
}

export { badgeTierLabel };

export function badgeThresholdLabel(
  kind: BadgeKind,
  threshold: number,
): string {
  if (kind === "rank") return `#${threshold}`;
  if (kind === "points") return `${threshold}`;
  return `×${threshold}`;
}
