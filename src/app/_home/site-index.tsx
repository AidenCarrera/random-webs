import Link from "next/link";

import { WEBSITE_CATEGORIES, WEBSITES } from "@/lib/websites";

import styles from "./home.module.css";

/** Complete index of websites for visitors and search crawlers. */
export function SiteIndex() {
  return (
    <details className={styles.index} data-site-index>
      <summary className={styles.indexSummary}>
        <span className={styles.indexLabel}>Spoilers</span>
        <h2 className={styles.indexHeading}>
          Full index of all {WEBSITES.length} websites
        </h2>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.indexChevron}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className={styles.indexBody}>
        {WEBSITE_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h3 className={styles.indexGroupTitle}>{category.label}</h3>
            <ul className={styles.indexList}>
              {WEBSITES.filter(
                (website) => website.category === category.id,
              ).map((website) => (
                <li key={website.path}>
                  <Link
                    href={website.path}
                    prefetch={false}
                    className={styles.indexLink}
                  >
                    {website.title}
                  </Link>
                  <p className={styles.indexDescription}>
                    {website.metadata.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
