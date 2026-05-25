"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/config/app";

const links = [
  { href: "/", label: "App" },
  { href: "/badges", label: "Badges" },
  { href: "/leaderboard", label: "Leaders" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="uni-card mb-3 flex items-center justify-between gap-3 px-4 py-3">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
        <AppLogo size={36} />
        <span className="uni-heading truncate text-base text-[var(--uni-text)]">
          {APP_NAME}
        </span>
      </Link>
      <div className="uni-tabs">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`uni-tab ${active ? "uni-tab-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
