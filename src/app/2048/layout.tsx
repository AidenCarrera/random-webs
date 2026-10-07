import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/2048");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/2048">{children}</WebsiteFrame>;
}
