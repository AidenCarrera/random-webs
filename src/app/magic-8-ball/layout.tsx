import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/magic-8-ball");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/magic-8-ball">{children}</WebsiteFrame>;
}
