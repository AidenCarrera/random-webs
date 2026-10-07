import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/matrix-rain");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/matrix-rain">{children}</WebsiteFrame>;
}
