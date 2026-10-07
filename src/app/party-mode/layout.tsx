import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/party-mode");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/party-mode">{children}</WebsiteFrame>;
}
