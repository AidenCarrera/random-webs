import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/sticky-notes");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/sticky-notes">{children}</WebsiteFrame>;
}
