import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/conway-multiverse");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/conway-multiverse">{children}</WebsiteFrame>;
}
