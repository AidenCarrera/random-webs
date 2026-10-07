import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/fluid-simulation");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/fluid-simulation">{children}</WebsiteFrame>;
}
