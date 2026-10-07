import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

import type { WebsiteEntry } from "@/lib/websites";

import { getAccentColors } from "./accent";
import styles from "./home.module.css";
import { ScrambleText } from "./scramble-text";

export function maskText(value: string) {
  return value.replace(/\S/g, "?");
}

type WebsiteCardProps = {
  website: WebsiteEntry;
  index: number;
  isRevealed: boolean;
};

export function WebsiteCard({ website, index, isRevealed }: WebsiteCardProps) {
  const number = String(index + 1).padStart(2, "0");
  const colors = getAccentColors(website);
  const style = {
    "--i": index,
    "--card-from": colors.from,
    "--card-via": colors.via,
    "--card-to": colors.to,
  } as React.CSSProperties;

  if (!isRevealed) {
    // Masked via CSS data attributes so placeholder text is excluded from crawlers.
    return (
      <div
        role="img"
        aria-label={`Website ${number}, not discovered yet`}
        className={`${styles.card} ${styles.cardLocked}`}
        style={style}
      >
        <div className={styles.cardInner} aria-hidden="true">
          <div className={styles.cardMeta}>
            <span className={styles.cardMask} data-mask={number} />
            <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
          <div
            className={`${styles.cardTitleLocked} ${styles.cardMask}`}
            data-mask={maskText(website.title)}
          />
          <div
            className={`${styles.cardBlurbLocked} ${styles.cardMask}`}
            data-mask={maskText(website.blurb)}
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={website.path}
      aria-label={website.title}
      className={`${styles.card} ${styles.cardRevealed} group`}
      style={style}
    >
      <span
        aria-hidden="true"
        className={`${styles.cardAura} bg-linear-to-br ${website.accent}`}
      />
      <span
        aria-hidden="true"
        className={`${styles.cardEdge} bg-linear-to-r ${website.accent}`}
      />
      <div className={styles.cardInner}>
        <div className={styles.cardMeta} aria-hidden="true">
          <span>{number}</span>
          <ArrowUpRight className={styles.cardArrow} strokeWidth={2.25} />
        </div>
        <h2 className={styles.cardTitle}>
          <ScrambleText
            text={website.title}
            trigger="visible"
            placeholder="?"
            duration={520}
            delay={(index % 4) * 60}
          />
        </h2>
        <p className={styles.cardBlurb}>{website.blurb}</p>
      </div>
    </Link>
  );
}
