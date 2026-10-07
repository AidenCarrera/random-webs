import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/emoji-rain");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/emoji-rain">{children}</WebsiteFrame>;
}
