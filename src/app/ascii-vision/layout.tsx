import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/ascii-vision");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/ascii-vision">{children}</WebsiteFrame>;
}
