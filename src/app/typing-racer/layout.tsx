import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/typing-racer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/typing-racer">{children}</WebsiteFrame>;
}
