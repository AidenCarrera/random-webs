import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/pixel-art");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/pixel-art">{children}</WebsiteFrame>;
}
