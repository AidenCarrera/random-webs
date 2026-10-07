import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/click-speed-test");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/click-speed-test">{children}</WebsiteFrame>;
}
