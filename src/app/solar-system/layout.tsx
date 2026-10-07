import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";
import styles from "./styles.module.css";

export const metadata = createWebsiteMetadata("/solar-system");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteFrame path="/solar-system">
      <div className={styles.root}>{children}</div>
    </WebsiteFrame>
  );
}
