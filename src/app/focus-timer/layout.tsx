import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/focus-timer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/focus-timer">{children}</WebsiteFrame>;
}
