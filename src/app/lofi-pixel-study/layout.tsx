import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/lofi-pixel-study");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/lofi-pixel-study">{children}</WebsiteFrame>;
}
