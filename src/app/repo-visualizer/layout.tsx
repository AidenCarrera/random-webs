import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/repo-visualizer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/repo-visualizer">{children}</WebsiteFrame>;
}
