import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/hypno-spiral");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/hypno-spiral">{children}</WebsiteFrame>;
}
