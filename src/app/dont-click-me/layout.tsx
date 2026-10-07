import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/dont-click-me");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/dont-click-me">{children}</WebsiteFrame>;
}
