import Link from "next/link";

import type { HomeLinkCorner } from "@/lib/websites";

import styles from "./HomeBadge.module.css";

type HomeBadgeProps = {
  corner?: HomeLinkCorner;
  /** Corner on mobile screens, where the badge shrinks to an icon. */
  mobileCorner?: HomeLinkCorner | "hidden";
};

export function HomeBadge({
  corner = "top-left",
  mobileCorner = corner,
}: HomeBadgeProps) {
  return (
    <Link
      href="/"
      prefetch={false}
      className={styles.badge}
      data-corner={corner}
      data-corner-mobile={mobileCorner}
      data-home-badge
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
      <span className={styles.label}>Random Webs</span>
    </Link>
  );
}
